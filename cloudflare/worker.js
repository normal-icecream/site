// List of URLs that are allowed to make requests to Square based on environment
const ALLOWED_ORIGINS = [
  'localhost:3000', // Local development
  '--site--normal-icecream.aem.page', // Preview domain/
  '--site--normal-icecream.aem.live', // Production domain/
];

export default {
  async fetch(request, env) {
    // Get the 'Origin' header from the incoming request to validate the source
    const originHeader = request.headers.get('Origin');

    // Check if originHeader is null or undefined
    if (!originHeader) {
      return new Response('Forbidden: Origin header is missing', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Check if the request's origin is in the list of allowed origins
    const isAllowed = ALLOWED_ORIGINS.find((element) => originHeader.endsWith(element));
    if (!isAllowed) {
      // Reject the request with a 403 status if the origin is not allowed
      return new Response('Forbidden', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    if (request.method === 'OPTIONS') {
      // Handle CORS preflight requests by responding with appropriate headers
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': originHeader,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // Determine the environment to select the correct API key and base URL
    const isProduction = env.ENVIRONMENT === 'production';
    // Set API key from encrypptd env var stored in Cloudflare
    const apiKey = isProduction ? env.SQUARE_PROD_API_KEY : env.SQUARE_SANDBOX_API_KEY;
    const baseUrl = isProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

    // Extract the pathname from the request URL and modify it to match the Square API
    const { pathname } = new URL(request.url);
    const squareUrl = `${baseUrl}${pathname.replace('/api/square', '')}`;

    // Create a new request object to forward the modified request to the Square API
    const modifiedRequest = new Request(squareUrl, {
      method: request.method,
      headers: {
        // Attach the appropriate API key for authentication
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      // Include the request body for non-GET/HEAD methods
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    // Send the modified request to the Square API
    const response = await fetch(modifiedRequest);

    // Add CORS headers to the response to enable cross-origin requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': originHeader,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Create a new response object to include the CORS headers
    const modifiedResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      modifiedResponse.headers.set(key, value);
    });

    // Return the final response to the client
    return modifiedResponse;
  },
};
