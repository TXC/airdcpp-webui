const MODULE_URL = 'search';
const INSTANCE_URL = MODULE_URL + '/0';
export default {
  MODULE_URL: MODULE_URL,
  INSTANCE_URL: INSTANCE_URL,
  INSTANCES_URL: MODULE_URL,

  HUB_SEARCH_URL: INSTANCE_URL + '/hub_search',
  RESULTS_URL: INSTANCE_URL + '/results',

  SEARCH_TYPES_URL: MODULE_URL + '/types',
  SEARCH_TYPES_UPDATED: 'search_types_updated'
};
