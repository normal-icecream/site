// List of URLs that are allowed to make requests to Square based on environment
// TODO - add .club as an allowed origin
const ALLOWED_ORIGINS = [
  'localhost:3000', // Local development
  '--site--normal-icecream.aem.page', // Preview domain/
  '--site--normal-icecream.aem.live', // Production domain/
];

const SANDBOX_ROUTES = [
  'localhost:3000', // Local development
  '--site--normal-icecream.aem.page', // Preview domain/
];

export default {
  async fetch(request, env) {
    // Get the 'Origin' header from the incoming request to validate the source
    const originHeader = request.headers.get('Origin');
    console.log("originHeader:", originHeader);

    // Check if originHeader is null or undefined
    if (!originHeader) {
      return new Response('Bad Request: Origin header is missing', {
        status: 400,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Check if the request's origin is in the list of allowed origins
    const isAllowed = ALLOWED_ORIGINS.find((element) => originHeader.endsWith(element));
    if (!isAllowed) {
      // Reject the request with a 403 status if the origin is not allowed
      return new Response(`Forbidden: Requests from origin header ${originHeader} are not allowed.`, {
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

    const shouldHitSandbox = SANDBOX_ROUTES.some((element) => originHeader.endsWith(element));
    console.log("shouldHitSandbox:", shouldHitSandbox);
    
    const url = new URL(request.url);
    const forceSandbox = url.searchParams.get('env') === 'sandbox';
    const useProduction = !forceSandbox && env.ENVIRONMENT === 'production';
    const apiKey = useProduction ? env.SQUARE_PROD_API_KEY : env.SQUARE_SANDBOX_API_KEY;
    const baseUrl = useProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
    console.log("baseUrl:", baseUrl);

    // Extract the pathname from the request URL and modify it to match the Square API
    const squareUrl = `${baseUrl}${url.pathname.replace('/api/square', '')}`;

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
