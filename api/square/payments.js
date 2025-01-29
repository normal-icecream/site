import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

export async function createPayment(paymentData) {
    if (!paymentData) {
        // Validate that an paymentData is provided before making the API call
        throw new Error('paymentData is required to create an payment.');
    }

    try {
        const payment = await apiClient(API_ENDPOINTS.SQUARE.PAYMENTS.create, 'POST', paymentData);
        return payment;
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error creating payment:', error);
        throw new Error(`Failed to create payment: ${error.message}`);
    }
}