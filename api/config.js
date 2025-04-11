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
      catalog: `${API_BASE_URLS.SQUARE}/catalog.json`, // GET
      refresh: `${API_BASE_URLS.SQUARE}/catalog.json/refresh`, // POST
      taxes: `${API_BASE_URLS.SQUARE}/v2/catalog/list?types=TAX`, // GET
    },
    CUSTOMER: {
      create: `${API_BASE_URLS.SQUARE}/v2/customers`, // POST
      search: `${API_BASE_URLS.SQUARE}/v2/customers/search`, // POST
    },
    INVOICE: {
      create: `${API_BASE_URLS.SQUARE}/v2/invoices`, // POST
    },
    LOCATIONS: {
      list: `${API_BASE_URLS.SQUARE}/v2/locations`, // POST
    },
    ORDER: {
      create: (queryParams) => `${API_BASE_URLS.SQUARE}/v2/orders${queryParams}`, // POST
    },
    PAYMENTS: {
      create: `${API_BASE_URLS.SQUARE}/v2/payments`, // POST
    },
  },
  // ADD any other API here
};
