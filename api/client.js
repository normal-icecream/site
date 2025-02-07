/* eslint-disable import/prefer-default-export */
import { environmentConfig } from './environmentConfig.js';

// Define the base URL for API requests depending on the environment
// If running on localhost, use the local development server;
// otherwise, use the production Cloudflare Worker URL
const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8787' // Local development server
  : 'https://square-worker.website-f57.workers.dev'; // Production URL of your Cloudflare Worker

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

  if (data) {
    options.body = JSON.stringify(data);
  }

  // Send the API request and await the response
  const sandboxParam = environmentConfig.useSandbox ? '?env=sandbox' : '';
  const prodParam = environmentConfig.useProduction ? '&env=prod' : '';

  const baseUrl = `${API_BASE_URL}${endpoint}`;
  const url = new URL(baseUrl);
  if (sandboxParam) url.searchParams.set('env', 'sandbox');
  if (prodParam) url.searchParams.set('env', 'prod');

  const response = await fetch(url.toString(), options);

  // Check if the response status indicates an error
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} - ${response.statusText}`);
  }

  // Parse and return the JSON response
  return response.json();
}
