var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// cloudflare/worker.js
var ALLOWED_ORIGINS = [
  "localhost:3000",
  // Local development
  "--site--normal-icecream.aem.page",
  // Preview domain/
  "--site--normal-icecream.aem.live"
  // Production domain/
];
var SANDBOX_ROUTES = [
  "localhost:3000",
  // Local development
  "--site--normal-icecream.aem.page"
  // Preview domain/
];
var worker_default = {
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
    const forceSandbox = url.searchParams.get("env") === "sandbox";
    const forceProd = url.searchParams.get("env") === "prod";
    const isSandboxEnvironment = SANDBOX_ROUTES.some((element) => originHeader.endsWith(element));
    const useProduction = forceProd || !forceSandbox && !isSandboxEnvironment;
    const apiKey = useProduction ? env.SQUARE_PROD_API_KEY : env.SQUARE_SANDBOX_API_KEY;
    const baseUrl = useProduction ? "https://connect.squareup.com" : "https://connect.squareupsandbox.com";
    const squareUrl = `${baseUrl}${url.pathname.replace("/api/square", "")}`;
    let requestBody = {};
    if (request.body) {
      const bodyText = await request.text();
      console.log("Original body text:", bodyText);
      try {
        requestBody = JSON.parse(bodyText);
      } catch (error) {
        return new Response("Invalid JSON in request body", { status: 400 });
      }
    }
    const idempotencyKeyHeader = request.headers.get("Idempotency-Key");
    if (request.method === "POST" || request.method === "PUT") {
      const idempotencyKey = idempotencyKeyHeader || crypto.randomUUID();
      const test = JSON.parse(requestBody);
      test.idempotency_key = idempotencyKey;
      requestBody = test;
      const cacheKey = `${idempotencyKey}-${url.pathname}`;
      const storedResponse = await env.IDEMPOTENCY_STORE.get(cacheKey, { type: "json" });
      if (storedResponse) {
        return new Response(JSON.stringify(storedResponse.body), {
          status: storedResponse.status,
          headers: {
            ...storedResponse.headers,
            "Access-Control-Allow-Origin": originHeader
          }
        });
      }
    }
    const modifiedRequest = new Request(squareUrl, {
      method: request.method,
      headers: {
        // Attach the appropriate API key for authentication
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: request.method !== "GET" && request.method !== "HEAD" ? JSON.stringify(requestBody) : null
    });
    const response = await fetch(modifiedRequest);
    if (request.method === "POST" || request.method === "PUT") {
      const cacheKey = `${idempotencyKeyHeader || crypto.randomUUID()}-${url.pathname}`;
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
    const modifiedResponse = new Response(response.body, response);
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

// .wrangler/tmp/bundle-w1gUEF/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default
];
var middleware_insertion_facade_default = worker_default;

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

// .wrangler/tmp/bundle-w1gUEF/middleware-loader.entry.ts
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
//# sourceMappingURL=worker.js.map
