import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type CFEnv = {
  SITE_KV?: KVNamespace;
  ADMIN_PASSWORD?: string;
  ADMIN_EMAIL?: string;
  SESSION_SECRET?: string;
  [key: string]: unknown;
};

import { Buffer } from "node:buffer";

/** Maximum upload size: 8 MB */
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Handle GET /api/file/:key — serves a file stored in KV.
 */
async function handleFileServe(key: string, kv: KVNamespace): Promise<Response> {
  const record = await kv.get<{ mimeType: string; base64: string }>(`file:${key}`, { type: "json" });
  if (!record) return new Response("Not found", { status: 404 });
  const buffer = Buffer.from(record.base64, "base64");
  return new Response(buffer, {
    headers: {
      "Content-Type": record.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/**
 * Handle POST /api/upload — stores a file in KV and returns its URL.
 * Expects multipart/form-data with a "file" field.
 */
async function handleFileUpload(request: Request, kv: KVNamespace): Promise<Response> {
  try {
    // Auth check: must have admin_session cookie
    const cookie = request.headers.get("cookie") ?? "";
    if (!cookie.includes("admin_session=")) {
      return new Response("Unauthorized", { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || typeof file === "string") {
      return new Response("No file", { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return new Response("File too large (max 8 MB)", { status: 413 });
    }
    const arrayBuffer = await file.arrayBuffer();
    
    // Fast and safe base64 conversion using Node.js Buffer
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `${Date.now()}-${safeName}`;
    await kv.put(`file:${key}`, JSON.stringify({ mimeType: file.type || "application/octet-stream", base64 }));
    return new Response(JSON.stringify({ url: `/api/file/${key}` }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Upload error:", err);
    return new Response(String((err as Error).message), { status: 500 });
  }
}

type ServerEntry = {
  fetch: (request: Request, env: CFEnv, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => ((m as { default?: ServerEntry }).default ?? (m as unknown as ServerEntry)),
    );
  }
  return serverEntryPromise;
}

function brandedErrorResponse(): Response {
  return new Response(renderErrorPage(), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isCatastrophicSsrErrorBody(body: string, responseStatus: number): boolean {
  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return false;
  }

  if (!payload || Array.isArray(payload) || typeof payload !== "object") {
    return false;
  }

  const fields = payload as Record<string, unknown>;
  const expectedKeys = new Set(["message", "status", "unhandled"]);
  if (!Object.keys(fields).every((key) => expectedKeys.has(key))) {
    return false;
  }

  return (
    fields.unhandled === true &&
    fields.message === "HTTPError" &&
    (fields.status === undefined || fields.status === responseStatus)
  );
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isCatastrophicSsrErrorBody(body, response.status)) {
    return response;
  }

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error: ${body}`));
  return brandedErrorResponse();
}

export default {
  async fetch(request: Request, env: CFEnv, ctx: unknown) {
    // Inject Cloudflare bindings and request into globalThis so server functions can access them
    (globalThis as Record<string, unknown>).__CF_ENV__ = env;
    (globalThis as Record<string, unknown>).__CF_REQUEST__ = request;

    // --- File upload / serve shortcuts (handled before TanStack Start) ---
    const url = new URL(request.url);
    if (env.SITE_KV) {
      if (request.method === "GET" && url.pathname.startsWith("/api/file/")) {
        const key = decodeURIComponent(url.pathname.slice("/api/file/".length));
        return handleFileServe(key, env.SITE_KV);
      }
      if (request.method === "POST" && url.pathname === "/api/upload") {
        return handleFileUpload(request, env.SITE_KV);
      }
    }
    // --- End file shortcuts ---

    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      return await normalizeCatastrophicSsrResponse(response);
    } catch (error) {
      console.error(error);
      return brandedErrorResponse();
    }
  },
};
