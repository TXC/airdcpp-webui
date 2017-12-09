import PropTypes from 'prop-types';
import React from 'react';
import SettingConstants from 'constants/SettingConstants';

import DataProviderDecorator from 'decorators/DataProviderDecorator';
import SocketService from 'services/SocketService';

import Form from 'components/form/Form';


class RemoteSettingForm extends React.Component {
  static propTypes = {
    /**
		 * Form items to list
		 */
    keys: PropTypes.array.isRequired,
  };

  static contextTypes = {
    addFormRef: PropTypes.func.isRequired,
  };

  onSave = (changedValues) => {
    if (Object.keys(changedValues).length === 0) {
      return Promise.resolve();
    }
		
    return SocketService.post(SettingConstants.ITEMS_SET_URL, changedValues).then(this.refetchValues);
  };

  refetchValues = () => {
    this.props.refetchData([ 'settings' ]);
  };

  render() {
    const { settings, fieldDefinitions, ...otherProps } = this.props;
    const { addFormRef } = this.context;
    return (
      <div className="remote setting-form">
        <Form
          { ...otherProps }
          ref={ addFormRef }
          onSave={ this.onSave }
          fieldDefinitions={ fieldDefinitions }
          value={ settings }
        />
      </div>
    );
  }
}

export default DataProviderDecorator(RemoteSettingForm, {
  urls: {
    fieldDefinitions: ({ extension, keys }) => SocketService.post(SettingConstants.ITEMS_DEFINITIONS_URL, { keys }),
    settings: ({ extension, keys }) => SocketService.post(SettingConstants.ITEMS_GET_URL, { keys }),
  },
});