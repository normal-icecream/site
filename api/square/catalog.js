import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

/**
 * Fetches a specific catalog item by its ID from the Square API.
 * @param {string} itemId - The ID of the catalog item to fetch.
 * @returns {Promise<Object>} - A promise that resolves to the catalog item object.
 * @throws {Error} - Throws an error if itemId is not provided or if the API call fails.
 */
export async function getCatalogItem(itemId) {
  if (!itemId) {
    // Validate that an itemId is provided before making the API call
    throw new Error('ItemId is required to fetch catalog item');
  }
  try {
    // Use the API client to fetch the catalog item from the Square API
    const item = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.item(itemId), 'GET');

    // return square object
    return item.object;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching catalog item:', error);
    throw new Error(`Failed to fetch catalog item: ${error.message}`);
  }
}
