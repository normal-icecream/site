const ALLOWED_ORIGINS = [
  'localhost:3000', // Local development
  '--site--normal-icecream.aem.page', // Preview domain/
  '--site--normal-icecream.aem.live', // Production domain/
];

export default {
  async fetch(request, env) {
    console.log("request.headers:", request.headers.entries());
    // request.headers.entries().forEach

    request.headers.entries().forEach((entry, i) => {
      console.log(i, entry);
    })
    // console.log("request.body:", request.body.get('Body'));
    const originHeader = request.headers.get('Origin');
    console.log("originHeader:", originHeader);
    const isAllowed = ALLOWED_ORIGINS.find((element) => originHeader.endsWith(element));
    if (!isAllowed) {
      return new Response('Forbidden', {
        status: 403,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    if (request.method === 'OPTIONS') {
      // Handle CORS preflight
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': originHeader,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // if(originHeader)

    const isProduction = env.ENVIRONMENT === 'production';
    const apiKey = isProduction ? env.SQUARE_PROD_API_KEY : env.SQUARE_SANDBOX_API_KEY;
    const baseUrl = isProduction ? 'https://connect.squareup.com' : 'https://connect.squareupsandbox.com';
    const url = new URL(request.url);
    const pathname = url.pathname;
    const squareUrl = `${baseUrl}${pathname.replace('/api/square', '')}`;

    const modifiedRequest = new Request(squareUrl, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    });

    const response = await fetch(modifiedRequest);

    const corsHeaders = {
      'Access-Control-Allow-Origin': originHeader,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const modifiedResponse = new Response(response.body, response);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      modifiedResponse.headers.set(key, value);
    });

    return modifiedResponse;
  },
};