/* eslint-disable import/prefer-default-export */
import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

export async function createOrder(orderData, queryParams) {
  if (!orderData) {
    // Validate that an orderData is provided before making the API call
    throw new Error('orderData is required to create an order.');
  }
  try {
    const order = await apiClient(API_ENDPOINTS.SQUARE.ORDER.create(queryParams), 'POST', orderData);

    return order;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
}
