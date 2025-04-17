/* eslint-disable import/prefer-default-export */
import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

/**
 * Creates Square invoice.
 * @returns {Promise<Array>} - A promise that resolves to an invoice object.
 * @throws {Error} - Throws an error if the API call fails.
*/
export async function createInvoice(invoiceData) {
  if (!invoiceData) {
    // Validate that an invoiceData is provided before making the API call
    throw new Error('invoiceData is required to create an invoice.');
  }

  try {
    // Use the API client to create Invoice in Square
    const invoice = await apiClient(API_ENDPOINTS.SQUARE.INVOICE.create, 'POST', invoiceData);
    return invoice;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating invoice:', error);
    throw new Error(`Failed to create invoice: ${error.message}`);
  }
}

/**
 * Publish Square invoice.
 * @returns {Promise<Array>} - A promise that resolves to an invoice object.
 * @throws {Error} - Throws an error if the API call fails.
*/
export async function publishInvoice(invoiceId, invoiceData) {
  if (!invoiceData) {
    // Validate that an invoiceData is provided before making the API call
    throw new Error('invoiceData is required to publish an invoice.');
  }

  try {
    // Use the API client to create Invoice in Square
    const publishedInvoice = await apiClient(API_ENDPOINTS.SQUARE.INVOICE.publish(invoiceId), 'POST', invoiceData);
    return publishedInvoice;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error publishing invoice:', error);
    throw new Error(`Failed to publish invoice: ${error.message}`);
  }
}
