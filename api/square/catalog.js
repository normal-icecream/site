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

/**
 * Fetches the list of catalog items from the Square API.
 * @returns {Promise<Array>} - A promise that resolves to an array of catalog item objects.
 * @throws {Error} - Throws an error if the API call fails.
*/
export async function getCatalogList() {
  try {
    // Use the API client to fetch the catalog list from the Square API
    const catalogList = await apiClient(API_ENDPOINTS.SQUARE.CATALOG.list, 'GET');

    // return list
    return catalogList.objects;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching catalog list:', error);
    throw new Error(`Failed to fetch catalog list: ${error.message}`);
  }
}



// TODO - add function description
export async function upsertCatalogItem(itemData) {
  if (!itemData) {
    // Validate that an itemId is provided before making the API call
    throw new Error('ItemData is required to upsert catalog item');
  }

  try {
    console.log('itemData', itemData)
    // const test = {

    // }

  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error upserting catalog item:', error);
    throw new Error(`Failed to upsert catalog item: ${error.message}`);
  }
}
