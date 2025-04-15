/* eslint-disable import/prefer-default-export */
import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

/**
 * Creates Square customer.
 * @returns {Promise<Array>} - A promise that resolves to a customer object.
 * @throws {Error} - Throws an error if the API call fails.
*/
export async function createCustomer(customerData) {
  if (!customerData) {
    // Validate that an customerData is provided before making the API call
    throw new Error('customerData is required to create a customer.');
  }

  try {
    // Use the API client to create customer in Square
    const customer = await apiClient(API_ENDPOINTS.SQUARE.CUSTOMER.create, 'POST', customerData);
    console.log(" customer:", customer);
    return customer;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating customer:', error);
    throw new Error(`Failed to create customer: ${error.message}`);
  }
}

/**
 * Queries Square customer.
 * @returns {Promise<Array>} - A promise that resolves to a customer object.
 * @throws {Error} - Throws an error if the API call fails.
*/
export async function findCustomer(customerData) {
  if (!customerData) {
    // Validate that an customerData is provided before making the API call
    throw new Error('customerData is required to create a customer.');
  }

  try {
    // Use the API client to create customer in Square
    const customer = await apiClient(API_ENDPOINTS.SQUARE.CUSTOMER.search, 'POST', customerData);
    return customer;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating customer:', error);
    throw new Error(`Failed to create customer: ${error.message}`);
  }
}
