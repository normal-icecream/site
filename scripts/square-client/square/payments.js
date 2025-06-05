/* eslint-disable import/prefer-default-export */
import { apiClient } from '../client.js';
import { API_ENDPOINTS } from '../config.js';

// eslint-disable-next-line consistent-return
export async function createPayment(paymentData) {
  if (!paymentData) {
    // Validate that an paymentData is provided before making the API call
    throw new Error('paymentData is required to create an payment.');
  }

  try {
    const payment = await apiClient(API_ENDPOINTS.SQUARE.PAYMENTS.create, 'POST', paymentData);
    return payment;
  } catch (e) {
    const errorData = await e.responseData;
    if (errorData) {
      const errorsArray = errorData.errors;
      const errorMessages = [];
      errorsArray.forEach((error) => {
        if (error.code === 'ADDRESS_VERIFICATION_FAILURE') {
          errorMessages.push('Card postal code is incorrect');
        } else if (error.code === 'INVALID_EXPIRATION') {
          errorMessages.push('Card expiration date is incorrect');
        } else if (error.code === 'GENERIC_DECLINE') {
          errorMessages.push('Card declined');
        } else if (error.code === 'CVV_FAILURE') {
          errorMessages.push('Card CVV incorrect');
        } else {
          errorMessages.push('Card payment failed, please try again :)');
        }
      });
      const error = new Error('API Error: Payment errors');
      error.responseMessages = errorMessages;
      throw error;
    }
  }
}
