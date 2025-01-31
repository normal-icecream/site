/* eslint-disable import/prefer-default-export */
/** Configuration file containing base URLs and endpoint definitions for APIs. */

// Base URLs for different APIs
const API_BASE_URLS = {
  SQUARE: '/api/square', // Base path for the Square API proxy
  // ADD any other API here
};

/**
 * Endpoint definitions for the Square API and other APIs.
 * Provides organized and reusable paths for various API operations.
*/
export const API_ENDPOINTS = {
  SQUARE: {
    CATALOG: {
      /**
       * Constructs the URL for fetching a specific catalog object by its ID.
       * @param {string} objectId - The ID of the square catalog object to fetch.
       * @returns {string} - The URL for the square catalog object API.
      */
      item: (objectId) => `${API_BASE_URLS.SQUARE}/v2/catalog/object/${objectId}?include_related_objects=true`, // GET

      /** URL for fetching the list of square catalog objects. */
      // list: `${API_BASE_URLS.SQUARE}/v2/catalog/list?types=ITEM`, // GET
      list: `${API_BASE_URLS.SQUARE}/v2/catalog/list?types=ITEM`, // GET
      modifierList: `${API_BASE_URLS.SQUARE}/v2/catalog/list?types=MODIFIER_LIST`, // GET
      taxes: `${API_BASE_URLS.SQUARE}/v2/catalog/list?types=TAX`, // GET
      discounts: `${API_BASE_URLS.SQUARE}/v2/catalog/list?types=DISCOUNT`, // GET
    },
    ORDER: {
      create: (queryParams) => `${API_BASE_URLS.SQUARE}/v2/orders${queryParams}`, // POST
    },
    PAYMENTS: {
      create: `${API_BASE_URLS.SQUARE}/v2/payments`, // POST
    },
    LOCATIONS: {
      list: `${API_BASE_URLS.SQUARE}/v2/locations`, // POST
    },
  },
  // ADD any other API here
};