const API_BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:8787' // Local development
    : 'https://square-worker.website-f57.workers.dev'; // Production URL of your Cloudflare Worker
    // TODO - do I need this URL with the last back slash https://square-worker.website-f57.workers.dev/

export async function apiClient(endpoint, method = 'GET', data = null) {
  const headers = { 'Content-Type': 'application/json' };
  const options = { method, headers };

  console.log("options:", options);
  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API Client Error:', error);
    throw error;
  }
}