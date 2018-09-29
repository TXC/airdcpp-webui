import invariant from 'invariant';
import t from 'utils/tcomb-form';

import BrowseField from 'components/form/BrowseField';
import SelectField from 'components/form/SelectField';

import * as API from 'types/api';
import * as UI from 'types/ui';


const typeToComponent = (type: API.SettingTypeEnum, min: number | undefined, max: number | undefined) => {
  switch (type) {
    case API.SettingTypeEnum.NUMBER: {
      if (min || max) {
        return t.Range(min, max);
      }
      return t.Positive;
    }
    case API.SettingTypeEnum.BOOLEAN: return t.Bool;
    case API.SettingTypeEnum.STRING:
    case API.SettingTypeEnum.TEXT:
    case API.SettingTypeEnum.FILE_PATH:
    case API.SettingTypeEnum.DIRECTORY_PATH: return t.Str;
    default: 
  }

  throw 'Field type ' + type + ' is not supported';
};

const parseDefinitions = (definitions: UI.FormFieldDefinition[]) => {
  const ret = definitions.reduce(
    (reduced, def) => {
      if (def.type === API.SettingTypeEnum.LIST) {
        if (def.item_type === API.SettingTypeEnum.STRUCT) {
          reduced[def.key] = t.list(parseDefinitions(def.definitions!));
        } else {
          reduced[def.key] = t.list(typeToComponent(def.item_type!, def.min, def.max));
        }
      } else {
        const fieldComponent = typeToComponent(def.type, def.min, def.max);
        reduced[def.key] = def.optional ? t.maybe(fieldComponent) : fieldComponent;
      }

      return reduced;
    }, 
    {}
  );

  return t.struct(ret);
};

type IdItemValue = { id: API.SettingValueBase };
type FormSettingValue = API.SettingValue<API.SettingValueBase> | IdItemValue[];

const normalizeField = <T>(value?: FormSettingValue): API.SettingValue | T => {
  if (value) {
    // Convert { id, ... } objects used in the UI to plain IDs
    // Not used by the API
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Normalize object properties with value.id to plain id 
      invariant(value.hasOwnProperty('id'), 'Invalid object supplied for normalizeField (id property is required)');
      return value.id;
    } else if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      // Normalize each array item
      invariant(
        value[0]!.hasOwnProperty('id'), 
        'Invalid array supplied for form property (id property is required for values)'
      );

      const ret = (value as IdItemValue[]).map(normalizeField);
      return ret as API.SettingValueBase[];
    }
  } else if (value === '') {
    // Normalize empty strings to null, which is used by tcomb 
    return null;
  }

  return value as API.SettingValue;
};

const normalizeEnumValue = (rawItem: API.SettingEnumOption) => {
  return {
    value: rawItem.id,
    text: rawItem.name
  };
};

const normalizeSettingValueMap = (
  value: Partial<API.SettingValueMap<API.SettingValueBase>> | undefined, 
  valueDefinitions: UI.FormFieldDefinition[]
): UI.FormValueMap => {
  return valueDefinitions.reduce(
    (reducedValue, { key, type, definitions, default_value, item_type }) => {
      if (!!value && value.hasOwnProperty(key)) {
        const fieldValue = value[key];
        if (type === API.SettingTypeEnum.LIST && Array.isArray(fieldValue)) {
          if (item_type === API.SettingTypeEnum.STRUCT) {
            // Normalize each list object
            reducedValue[key] = fieldValue.map((arrayItem) => {
              if (!!arrayItem && typeof arrayItem === 'object') {
                return normalizeSettingValueMap(arrayItem, definitions!);
              }

              throw `Invalid value for a list struct ${arrayItem}`;
            });
          } else {
            reducedValue[key] = fieldValue.map(normalizeField);
          }
        } else {
          reducedValue[key] = normalizeField(fieldValue);
        }
      } else if (!value) {
        // Initialize empty value but don't merge missing fields into an existing value (we might be merging)
        reducedValue[key] = default_value ? default_value : null;
      }

      return reducedValue;
    }, 
    {}
  );
};

const intTransformer = {
  parse: (v: string) => v === 'null' ? null : parseInt(v, 10),
  format: (v: number) => String(v),
};

const parseTypeOptions = (type: API.SettingTypeEnum) => {
  const options = {};
  switch (type) {
    case API.SettingTypeEnum.TEXT: {
      options['type'] = 'textarea';
      break;
    } 
    //case FieldTypes.FILE_PATH:
    case API.SettingTypeEnum.DIRECTORY_PATH: {
      options['factory'] = t.form.Textbox;
      options['template'] = BrowseField;

      // TODO: file selector dialog
      options['config'] = {
        //isFile: type === FieldTypes.FILE_PATH
        isFile: false
      };
      break;
    }
    default:
  }

  return options;
};

const parseFieldOptions = (definition: UI.FormFieldDefinition) => {
  const options = parseTypeOptions(definition.type);

  // List item options
  if (definition.type === API.SettingTypeEnum.LIST) {
    options['item'] = {};
    if (definition.definitions) {
      // Struct item fields
      options['item']['fields'] = definition.definitions.reduce(
        (reduced, itemDefinition) => {
          reduced[itemDefinition.key] = parseFieldOptions(itemDefinition);
          return reduced;
        }, 
        {}
      );
    } else {
      // Plain items
      options['item'] = parseTypeOptions(definition.item_type!);
    }
  }

  // Captions
  options['legend'] = definition.title;
  options['help'] = definition.help;

  // Enum select field?
  if (definition.options) {
    invariant(
      Array.isArray(definition.options) && definition.options.length > 0, 
      'Incorrect enum options supplied: ' + JSON.stringify(definition.options)
    );

    Object.assign(options, {
      factory: t.form.Select,
      options: definition.options.map(normalizeEnumValue),
      nullOption: false,
    });

    if (definition.type === API.SettingTypeEnum.LIST) {
      options['template'] = SelectField;
    } else if (definition.options[0].id === parseInt(definition.options[0].id as string, 10)) {
      // Integer keys won't work with the default template, do string conversion
      options['transformer'] = intTransformer;
    }
  }

  return options;
};

export {
  // Migrates simple key -> value fields to an array that is compatible with the form
  // undefined values will also be initialized with nulled property fields
  normalizeSettingValueMap,

  intTransformer,

  normalizeEnumValue,

  // Convert field definitions to tcomb type object
  // Note that there are additional field options that need to be handled separately
  parseDefinitions,

  parseFieldOptions,
}
;