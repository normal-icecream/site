var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// cloudflare/square-worker.js
var ALLOWED_ORIGINS = [
  "localhost:3000",
  // Local development
  "--site--normal-icecream.aem.page",
  // Preview domain/
  "--site--normal-icecream.aem.live"
  // Production domain/
];
var SANDBOX_URLS = [
  "localhost:3000",
  // Local development
  "--site--normal-icecream.aem.page"
  // Preview domain/
];
var LOCATIONS = [
  {
    id: "KNEG5DW42BE2E",
    name: "CATERING"
  },
  {
    id: "WPBKJEG0HRQ9F",
    name: "SHIPPING"
  },
  {
    id: "6EXJXZ644ND0E",
    name: "STORE"
  },
  {
    id: "3HQZPV73H8BHM",
    name: "TRUCK"
  },
  {
    id: "Y689GQNGQJYWP",
    name: "WHOLESALE"
  },
  {
    id: "RXJXAWG01MBF5",
    name: "SANDBOX"
  }
];
var PROD_APPLICATION_ID = "sq0idp-7jw3abEgrV94NrJOaRXFTw";
var SANDBOX_APPLICATION_ID = "sandbox-sq0idb-qLf4bq1JWvEeLouPhDqnRA";
async function fetchAllPages(baseUrl, apiKey, collectedItems = []) {
  let nextCursor = null;
  let currentUrl = baseUrl;
  do {
    const response = await fetch(currentUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    });
    const jsonResponse = await response.json();
    if (jsonResponse.objects)
      collectedItems.push(...jsonResponse.objects);
    nextCursor = jsonResponse.cursor;
    if (nextCursor) {
      const urlObj = new URL(currentUrl);
      if (urlObj.searchParams.has("cursor")) {
        urlObj.searchParams.set("cursor", nextCursor);
      } else {
        urlObj.searchParams.append("cursor", nextCursor);
      }
      currentUrl = urlObj.toString();
    }
  } while (nextCursor);
  return collectedItems;
}
__name(fetchAllPages, "fetchAllPages");
async function refreshCatalog(env, apiKey) {
  const latestCatalog = await fetchAllPages("https://connect.squareup.com/v2/catalog/list", apiKey);
  if (latestCatalog) {
    await env.CATALOG_JSON.put("catalog", JSON.stringify(latestCatalog));
  } else {
    console.warn("Failed to fetch new catalog data.");
  }
}
__name(refreshCatalog, "refreshCatalog");
async function fetchCatalog(env, apiKey) {
  let catalogData;
  try {
    catalogData = await env.CATALOG_JSON.get("catalog", { type: "json" });
    refreshCatalog(env, apiKey);
    return JSON.stringify(catalogData);
  } catch (kvError) {
    console.error("Error fetching from KV Store:", kvError);
  }
  const newCatalogData = await fetchAllPages("https://connect.squareup.com/v2/catalog/list", apiKey);
  if (newCatalogData) {
    await env.CATALOG_JSON.put("catalog", JSON.stringify(newCatalogData));
    return JSON.stringify(newCatalogData);
  }
  return JSON.stringify({ error: "Failed to fetch catalog data" });
}
__name(fetchCatalog, "fetchCatalog");
var square_worker_default = {
  async fetch(request, env) {
    const originHeader = request.headers.get("Origin");
    if (!originHeader) {
      return new Response("Bad Request: Origin header is missing", {
        status: 400,
        headers: { "Content-Type": "text/plain" }
      });
    }
    const isAllowed = ALLOWED_ORIGINS.find((element) => originHeader.endsWith(element));
    if (!isAllowed) {
      return new Response(`Forbidden: Requests from origin header ${originHeader} are not allowed.`, {
        status: 403,
        headers: { "Content-Type": "text/plain" }
      });
    }
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": originHeader,
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      });
    }
    const url = new URL(request.url);
    let requestBody = {};
    if (request.body) {
      const bodyText = await request.text();
      try {
        requestBody = JSON.parse(bodyText);
      } catch (error) {
        return new Response("Invalid JSON in request body", { status: 400 });
      }
    }
    const isOrderRequest = url.pathname.includes("orders");
    const isSandboxUrl = SANDBOX_URLS.some((sandboxUrl) => originHeader.includes(sandboxUrl));
    let locationKey;
    if (isOrderRequest && request.method === "POST") {
      if (isSandboxUrl) {
        locationKey = LOCATIONS.find((location) => location.name === "SANDBOX").id;
        const body = JSON.parse(requestBody);
        body.order.location_id = locationKey;
        requestBody = JSON.stringify(body);
      } else {
        const locationParam = url.searchParams.get("location");
        if (locationParam) {
          locationKey = LOCATIONS.find((location) => location.name === locationParam.toUpperCase()).id;
          const body = JSON.parse(requestBody);
          body.order.location_id = locationKey;
          requestBody = JSON.stringify(body);
        } else {
          return new Response("Bad Request: Location query param is missing", {
            status: 400,
            headers: { "Content-Type": "text/plain" }
          });
        }
      }
    }
    const forceSandbox = url.searchParams.get("env") === "sandbox";
    const useProduction = !forceSandbox;
    const apiKey = useProduction ? env.SQUARE_PROD_API_KEY : env.SQUARE_SANDBOX_API_KEY;
    const baseUrl = useProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
    const squareUrl = `${baseUrl}${url.pathname.replace("/api/square", "")}`;
    const filteredParams = Array.from(url.searchParams.entries()).filter(([key]) => !key.startsWith("env") && !key.startsWith("location"));
    url.search = new URLSearchParams(filteredParams).toString();
    const queryString = filteredParams.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&");
    const fullSquareUrl = queryString ? `${squareUrl}?${queryString}` : squareUrl;
    const idempotencyKeyHeader = request.headers.get("Idempotency-Key");
    const idempotencyKey = idempotencyKeyHeader || crypto.randomUUID();
    if (request.method === "POST" || request.method === "PUT") {
      const body = JSON.parse(requestBody);
      body.idempotency_key = idempotencyKey;
      requestBody = JSON.stringify(body);
    }
    const isCatalogJsonRequest = url.pathname.includes("catalog.json");
    if (isCatalogJsonRequest) {
      const objects = await fetchCatalog(env, apiKey);
      return new Response(JSON.stringify({ objects }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": originHeader
        }
      });
    }
    if (request.method === "GET" && url.pathname.includes("catalog/list")) {
      const objects = await fetchAllPages(fullSquareUrl, apiKey);
      return new Response(JSON.stringify({ objects }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": originHeader
        }
      });
    }
    const modifiedRequest = new Request(fullSquareUrl, {
      method: request.method,
      headers: {
        // Attach the appropriate API key for authentication
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: request.method !== "GET" && request.method !== "HEAD" ? requestBody : null
    });
    const response = await fetch(modifiedRequest);
    if (request.method === "POST" || request.method === "PUT") {
      const cacheKey = `${idempotencyKey}-${url.pathname}`;
      const clonedResponse = response.clone();
      const responseBody = await clonedResponse.json();
      const responseHeaders = Object.fromEntries(clonedResponse.headers.entries());
      await env.IDEMPOTENCY_STORE.put(
        cacheKey,
        JSON.stringify({
          status: clonedResponse.status,
          body: responseBody,
          headers: responseHeaders
        }),
        { expirationTtl: 3600 }
        // 1 hour expiration
      );
    }
    const corsHeaders = {
      "Access-Control-Allow-Origin": originHeader,
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    };
    const additionalFields = {};
    if (isOrderRequest) {
      additionalFields.applicationId = isSandboxUrl ? SANDBOX_APPLICATION_ID : PROD_APPLICATION_ID;
    }
    const modifiedResponse = new Response(
      JSON.stringify({
        ...await response.json(),
        idempotency_key: idempotencyKey,
        // Include the idempotency key,
        ...additionalFields
      }),
      response
    );
    Object.entries(corsHeaders).forEach(([key, value]) => {
      modifiedResponse.headers.set(key, value);
    });
    return modifiedResponse;
  }
};

// ../../../../.nvm/versions/node/v21.6.1/lib/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// .wrangler/tmp/bundle-NjRPWG/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = square_worker_default;

// ../../../../.nvm/versions/node/v21.6.1/lib/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-NjRPWG/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=square-worker.js.map
