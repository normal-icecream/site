/* eslint-disable import/prefer-default-export */
import { environmentConfig } from './environmentConfig.js';

// Define the base URL for API requests depending on the environment
// If running on localhost, use the local development server;
// otherwise, use the production Cloudflare Worker URL
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8787' // Local development server
  : 'https://www.normal.club'; // Production URL of your Cloudflare Worker
//  https://square-worker.website-f57.workers.dev

/**
 * A generic API client function to interact with the server-side API.
 * @param {string} endpoint - The API endpoint to send the request to (e.g., "/api/resource").
 * @param {string} [method='GET'] - The HTTP method to use for the request (e.g., 'GET', 'POST').
 * @param {Object|null} [data=null] - The request payload (optional, used for POST/PUT requests).
 * @returns {Promise<Object>} - A promise that resolves to the parsed JSON response from the API.
 * @throws {Error} - Throws an error if the API response is not OK (status code outside 2xx).
 */
export async function apiClient(endpoint, method = 'GET', data = null) {
  // Set default headers for JSON requests
  const headers = { 'Content-Type': 'application/json' };
  const options = { method, headers };

  if (data) options.body = JSON.stringify(data);

  // Send the API request and await the response
  const baseUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(baseUrl);
  if (environmentConfig.useSandbox) url.searchParams.set('env', 'sandbox');

  const response = await fetch(url.toString(), options);

  // Check if the response status indicates an error
  if (!response.ok) {
    const errorData = response.json();
    const error = new Error(`API Error: ${response.status} - ${response.statusText}`);
    error.responseData = errorData;
    throw error;
  }

  // Parse and return the JSON response
  return response.json();
}
