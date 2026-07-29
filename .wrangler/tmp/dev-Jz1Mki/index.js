var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker/index.js
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" }
  });
}
__name(json, "json");
var idCounter = Date.now();
function generateId() {
  return (idCounter++).toString(36) + Math.random().toString(36).substring(2, 8);
}
__name(generateId, "generateId");
var worker_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not Found", { status: 404 });
    }
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }
    const db = env.DB;
    try {
      if (method === "GET" && path === "/api/locations") {
        const search = url.searchParams.get("search") || "";
        const dimension = url.searchParams.get("dimension") || "all";
        const sort = url.searchParams.get("sort") || "newest";
        let sql = "SELECT * FROM locations";
        const conditions = [];
        const params = [];
        if (dimension && dimension !== "all") {
          conditions.push("dimension = ?");
          params.push(dimension);
        }
        if (search) {
          conditions.push("(name LIKE ? OR description LIKE ?)");
          const q = `%${search}%`;
          params.push(q, q);
        }
        if (conditions.length > 0) sql += " WHERE " + conditions.join(" AND ");
        switch (sort) {
          case "oldest":
            sql += " ORDER BY created_at ASC";
            break;
          case "name":
            sql += " ORDER BY name COLLATE NOCASE ASC";
            break;
          case "name-desc":
            sql += " ORDER BY name COLLATE NOCASE DESC";
            break;
          default:
            sql += " ORDER BY created_at DESC";
        }
        const { results } = await db.prepare(sql).bind(...params).all();
        return json(results);
      }
      if (method === "GET" && path.startsWith("/api/locations/")) {
        const id = path.split("/").pop();
        const result = await db.prepare("SELECT * FROM locations WHERE id = ?").bind(id).first();
        if (!result) return json({ error: "\u672A\u627E\u5230" }, 404);
        return json(result);
      }
      if (method === "POST" && path === "/api/locations") {
        const body = await request.json();
        const { name, dimension, x, y, z, description } = body;
        if (!name || !name.trim()) return json({ error: "\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A" }, 400);
        if (!["overworld", "nether", "end"].includes(dimension)) {
          return json({ error: "\u7EF4\u5EA6\u65E0\u6548" }, 400);
        }
        const now = Date.now();
        const loc = {
          id: generateId(),
          name: name.trim(),
          dimension,
          x: parseFloat(x) || 0,
          y: y !== void 0 && y !== "" ? parseFloat(y) : 64,
          z: parseFloat(z) || 0,
          description: (description || "").trim(),
          created_at: now,
          updated_at: now
        };
        await db.prepare(
          "INSERT INTO locations (id, name, dimension, x, y, z, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(loc.id, loc.name, loc.dimension, loc.x, loc.y, loc.z, loc.description, loc.created_at, loc.updated_at).run();
        return json(loc, 201);
      }
      if (method === "PUT" && path.startsWith("/api/locations/")) {
        const id = path.split("/").pop();
        const existing = await db.prepare("SELECT * FROM locations WHERE id = ?").bind(id).first();
        if (!existing) return json({ error: "\u672A\u627E\u5230" }, 404);
        const body = await request.json();
        await db.prepare(
          "UPDATE locations SET name = ?, dimension = ?, x = ?, y = ?, z = ?, description = ?, updated_at = ? WHERE id = ?"
        ).bind(
          body.name !== void 0 ? body.name.trim() : existing.name,
          body.dimension !== void 0 ? body.dimension : existing.dimension,
          body.x !== void 0 ? parseFloat(body.x) : existing.x,
          body.y !== void 0 ? body.y !== "" ? parseFloat(body.y) : 64 : existing.y,
          body.z !== void 0 ? parseFloat(body.z) : existing.z,
          body.description !== void 0 ? (body.description || "").trim() : existing.description,
          Date.now(),
          id
        ).run();
        const updated = await db.prepare("SELECT * FROM locations WHERE id = ?").bind(id).first();
        return json(updated);
      }
      if (method === "DELETE" && path.startsWith("/api/locations/")) {
        const id = path.split("/").pop();
        await db.prepare("DELETE FROM locations WHERE id = ?").bind(id).run();
        return json({ success: true });
      }
      return json({ error: "Not Found" }, 404);
    } catch (err) {
      return json({ error: err.message }, 500);
    }
  }
};

// C:/Users/Administrator/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
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

// C:/Users/Administrator/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-MKkjd7/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// C:/Users/Administrator/AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
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

// .wrangler/tmp/bundle-MKkjd7/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
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
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
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
//# sourceMappingURL=index.js.map
