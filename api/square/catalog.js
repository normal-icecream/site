/* eslint-disable import/prefer-default-export */
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
