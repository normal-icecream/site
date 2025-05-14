/* eslint-disable import/prefer-default-export */
import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

export async function getCSRFToken(payload) {
  const encoder = new TextEncoder();
  const data = encoder.encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const base64String = btoa(String.fromCharCode(...new Uint8Array(hashBuffer)));
  return base64String.substring(0, 6);
}

export async function createOrder(orderData, queryParams) {
  if (!orderData) {
    // Validate that an orderData is provided before making the API call
    throw new Error('orderData is required to create an order.');
  }

  // get unique 6 digit csrf token
  const csrfToken = await getCSRFToken(orderData);

  try {
    const order = await apiClient(API_ENDPOINTS.SQUARE.ORDER.create(queryParams, encodeURIComponent(csrfToken)), 'POST', orderData);

    return order;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating order:', error);
    throw new Error(`Failed to create order: ${error.message}`);
  }
}
