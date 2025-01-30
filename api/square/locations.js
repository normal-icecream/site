import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

export async function getLocationsList() {
    try {
      // Use the API client to fetch the locations list from the Square API
      const locationsList = await apiClient(API_ENDPOINTS.SQUARE.LOCATIONS.list, 'GET');
  
      // return list
      return locationsList.locations;
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching locations list:', error);
      throw new Error(`Failed to fetch locations list: ${error.message}`);
    }
  }