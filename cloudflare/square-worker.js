/* eslint-disable no-console */
/* eslint-disable max-len */

// List of URLs that are allowed to make requests to Square based on environment
// TODO - add .club as an allowed origin
const ALLOWED_ORIGINS = [
  'localhost:3000', // Local development
  '--site--normal-icecream.aem.page', // Preview domain/
  '--site--normal-icecream.aem.live', // Production domain/
];

const SANDBOX_URLS = [
  'localhost:3000', // Local development
  '--site--normal-icecream.aem.page', // Preview domain/
];

const LOCATIONS = [
  {
    id: 'KNEG5DW42BE2E',
    name: 'CATERING',
  },
  {
    id: 'WPBKJEG0HRQ9F',
    name: 'SHIPPING',
  },
  {
    id: '6EXJXZ644ND0E',
    name: 'STORE',
  },
  {
    id: '3HQZPV73H8BHM',
    name: 'TRUCK',
  },
  {
    id: 'Y689GQNGQJYWP',
    name: 'WHOLESALE',
  },
  {
    id: 'RXJXAWG01MBF5',
    name: 'SANDBOX',
  },
];

const PROD_APPLICATION_ID = 'sq0idp-7jw3abEgrV94NrJOaRXFTw';
const SANDBOX_APPLICATION_ID = 'sandbox-sq0idb-qLf4bq1JWvEeLouPhDqnRA';

async function fetchAllPages(baseUrl, apiKey, collectedItems = []) {
  let nextCursor = null;
  let currentUrl = baseUrl; // Start with the base URL

  do {
    // eslint-disable-next-line no-await-in-loop
    const response = await fetch(currentUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    // eslint-disable-next-line no-await-in-loop
    const jsonResponse = await response.json();
    if (jsonResponse.objects) collectedItems.push(...jsonResponse.objects);

    nextCursor = jsonResponse.cursor;

    if (nextCursor) {
      // Create a URL object to manipulate query parameters safely
      const urlObj = new URL(currentUrl);
      if (urlObj.searchParams.has('cursor')) {
        // Replace the existing cursor value
        urlObj.searchParams.set('cursor', nextCursor);
      } else {
        // Append the new cursor if it doesn't exist
        urlObj.searchParams.append('cursor', nextCursor);
      }
      currentUrl = urlObj.toString();
    }
  } while (nextCursor); // Keep looping until there's no cursor
  return collectedItems; // Return all collected items
}

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

    let requestBody = {};
    if (request.body) {
      const bodyText = await request.text();
      try {
        requestBody = JSON.parse(bodyText); // Parse bodyText into an object
      } catch (error) {
        return new Response('Invalid JSON in request body', { status: 400 });
      }
    } // Select correct square path to hit based on useProduction flag

    const isOrderRequest = url.pathname.includes('orders');
    const isSandboxUrl = SANDBOX_URLS.some((sandboxUrl) => originHeader.includes(sandboxUrl));
    let locationKey;
    if (isOrderRequest && request.method === 'POST') {
      if (isSandboxUrl) {
        locationKey = LOCATIONS.find((location) => location.name === 'SANDBOX').id;
        const body = JSON.parse(requestBody);
        body.order.location_id = locationKey;
        requestBody = JSON.stringify(body);
      } else {
        const locationParam = url.searchParams.get('location');
        if (locationParam) {
          locationKey = LOCATIONS.find((location) => location.name === locationParam.toUpperCase()).id;
          const body = JSON.parse(requestBody);
          body.order.location_id = locationKey;
          requestBody = JSON.stringify(body);
        } else {
          return new Response('Bad Request: Location query param is missing', {
            status: 400,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
        // check for locations qp and grab the corresponding location
      }
    }

    const forceSandbox = url.searchParams.get('env') === 'sandbox';
    const useProduction = !forceSandbox;
    const apiKey = useProduction ? env.SQUARE_PROD_API_KEY : env.SQUARE_SANDBOX_API_KEY;
    const baseUrl = useProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';

    // Extract the pathname from the request URL and modify it to match the Square API
    const squareUrl = `${baseUrl}${url.pathname.replace('/api/square', '')}`;

    const filteredParams = Array.from(url.searchParams.entries()).filter((([key]) => !key.startsWith('env') && !key.startsWith('location')));
    // Rebuild the query parameters without the ones starting with "env"
    url.search = new URLSearchParams(filteredParams).toString();

    const queryString = filteredParams.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join('&');

    const fullSquareUrl = queryString ? `${squareUrl}?${queryString}` : squareUrl;

    // Idempotency Key
    const idempotencyKeyHeader = request.headers.get('Idempotency-Key');
    const idempotencyKey = idempotencyKeyHeader || crypto.randomUUID();
    // Add the idempotency key header for POST or PUT requests
    if (request.method === 'POST' || request.method === 'PUT') {
      const body = JSON.parse(requestBody);
      body.idempotency_key = idempotencyKey;
      requestBody = JSON.stringify(body);
    }

    const isCatalogJsonRequest = url.pathname.includes('catalog.json');
    if (isCatalogJsonRequest) {
      try {
        const catalogData = await env.CATALOG_JSON.get('catalog', { type: 'json' });
        if (catalogData.length > 0) {
          return new Response(JSON.stringify({ objects: catalogData }), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': originHeader,
            },
          });
        }
        const latestCatalog = await fetchAllPages('https://connect.squareup.com/v2/catalog/list', apiKey);
        await env.CATALOG_JSON.put('catalog', JSON.stringify(latestCatalog));

        // return new Response("Value not found", { status: 404 });
        return new Response(JSON.stringify({ objects: latestCatalog }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': originHeader,
          },
        });
      } catch (error) {
        console.error(`KV returned error: ${error}`);
        return new Response(error, { status: 500 });
      }
    }

    // If it's a GET request for listing Square catalog items
    if (request.method === 'GET' && url.pathname.includes('catalog/list')) {
      const objects = await fetchAllPages(fullSquareUrl, apiKey);
      return new Response(JSON.stringify({ objects }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': originHeader,
        },
      });
    }

    // Create a new request object to forward the modified request to the Square API
    const modifiedRequest = new Request(fullSquareUrl, {
      method: request.method,
      headers: {
        // Attach the appropriate API key for authentication
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? requestBody : null,
    });

    // Send the modified request to the Square API
    const response = await fetch(modifiedRequest);

    // Store response in KV for idempotency
    if (request.method === 'POST' || request.method === 'PUT') {
      const cacheKey = `${idempotencyKey}-${url.pathname}`;
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
        { expirationTtl: 3600 }, // 1 hour expiration
      );
    }

    // Add CORS headers to the response to enable cross-origin requests
    const corsHeaders = {
      'Access-Control-Allow-Origin': originHeader,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const additionalFields = {};
    if (isOrderRequest) {
      additionalFields.applicationId = isSandboxUrl ? SANDBOX_APPLICATION_ID : PROD_APPLICATION_ID;
    }

    const modifiedResponse = new Response(
      JSON.stringify({
        ...(await response.json()),
        idempotency_key: idempotencyKey, // Include the idempotency key,
        ...additionalFields,
      }),
      response,
    );

    Object.entries(corsHeaders).forEach(([key, value]) => {
      modifiedResponse.headers.set(key, value);
    });

    // Return the final response to the client
    return modifiedResponse;
  },
};
