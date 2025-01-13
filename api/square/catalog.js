import { apiClient } from '../client.js'
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

    // If the item exists, return its object property
    if (item) {
      return item.object;
    }
  } catch (error) {
    console.error("Error fetching catalog item:", error);
  }
}

/**
 * Fetches the list of catalog items from the Square API.
 * @returns {Promise<Array>} - A promise that resolves to an array of catalog item objects.
 * @throws {Error} - Throws an error if the API call fails.
 */
export async function getCatalogList() {
  try {
    // Use the API client to fetch the catalog list from the Square API
    const catalogList = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.list, 'GET');

    // If the catalog list exists, return its objects property
    if (catalogList) {
      return catalogList.objects
    }
  } catch (error) {
    console.error("Error fetching catalog list:", error);
  }
}
