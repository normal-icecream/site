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

    const url = new URL(request.url);

    // Determine environment
    const forceSandbox = url.searchParams.get('env') === 'sandbox';
    const useProduction = forceSandbox ? false : true;
    // Select correct API key in cloudflare dashboard based on useProduction flag
    const apiKey = useProduction ? env.SQUARE_PROD_API_KEY : env.SQUARE_SANDBOX_API_KEY;
    // Select correct square path to hit based on useProduction flag
    const baseUrl = useProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

    // Extract the pathname from the request URL and modify it to match the Square API
    const squareUrl = `${baseUrl}${url.pathname.replace('/api/square', '')}`;

    const filteredParams = Array.from(url.searchParams.entries()).filter((([key]) => !key.startsWith('env')));
    // Rebuild the query parameters without the ones starting with "env"
    url.search = new URLSearchParams(filteredParams).toString();

    const queryString = filteredParams.map(([key, value], i) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');

    const fullSquareUrl = queryString ? `${squareUrl}?${queryString}` : squareUrl;
    
    let requestBody = {};
    if (request.body) {
      const bodyText = await request.text();
    
      try {
        requestBody = JSON.parse(bodyText); // Parse bodyText into an object
      } catch (error) {
        return new Response("Invalid JSON in request body", { status: 400 });
      }
    }

    // Idempotency Key
    const idempotencyKeyHeader = request.headers.get("Idempotency-Key");
    // Add the idempotency key header for POST or PUT requests
    if (request.method === 'POST' || request.method === 'PUT') {
      const idempotencyKey = idempotencyKeyHeader || crypto.randomUUID();
      const body = JSON.parse(requestBody)
      body.idempotency_key = idempotencyKey;
      requestBody = body;
      
      // Cache the key for idempotency logic
      const cacheKey = `${idempotencyKey}-${url.pathname}`;
      const storedResponse = await env.IDEMPOTENCY_STORE.get(cacheKey, { type: "json" });
      if (storedResponse) {
        return new Response(JSON.stringify(storedResponse.body), {
          status: storedResponse.status,
          headers: {
            ...storedResponse.headers,
            'Access-Control-Allow-Origin': originHeader,
          },
        });
      }
    }

    // Create a new request object to forward the modified request to the Square API
    const modifiedRequest = new Request(fullSquareUrl, {
      method: request.method,
      headers: {
        // Attach the appropriate API key for authentication
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? JSON.stringify(requestBody) : null,
    });

    // Send the modified request to the Square API
    const response = await fetch(modifiedRequest);

    // Store response in KV for idempotency
    if (request.method === 'POST' || request.method === 'PUT') {
      const cacheKey = `${idempotencyKeyHeader || crypto.randomUUID()}-${url.pathname}`;
      const clonedResponse = response.clone();
      const responseBody = await clonedResponse.json();
      const responseHeaders = Object.fromEntries(clonedResponse.headers.entries());

      await env.IDEMPOTENCY_STORE.put(
        cacheKey,
        JSON.stringify({
          status: clonedResponse.status,
          body: responseBody,
          headers: responseHeaders,
        }),
        { expirationTtl: 3600 } // 1 hour expiration
      );
    }

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