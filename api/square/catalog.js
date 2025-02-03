import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

/**
 * Fetches the list of catalog items from the Square API.
 * @returns {Promise<Array>} - A promise that resolves to an array of catalog item objects.
 * @throws {Error} - Throws an error if the API call fails.
*/
export async function getCatalogListJson() {
  try {
    // Use the API client to fetch the catalog list from the Square API
    const catalogList = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.catalog, 'GET');

    // return list
    return catalogList.objects;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching catalog list:', error);
    throw new Error(`Failed to fetch catalog list: ${error.message}`);
  }
}

/**
 * Fetches catalog tax information from the Square API.
 * @returns {Promise<Array>} - A promise that resolves to a tax object.
 * @throws {Error} - Throws an error if the API call fails.
*/
export async function getCatalogTaxList() {
  try {
    // Use the API client to fetch the catalog modifier list from the Square API
    const catalogTax = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.taxes, 'GET');

    // return list
    return catalogTax.objects;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching catalog list:', error);
    throw new Error(`Failed to fetch catalog list: ${error.message}`);
  }
}
