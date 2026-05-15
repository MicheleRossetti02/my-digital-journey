/**
 * Simple cookie-based admin auth — no Supabase.
 * ADMIN_PASSWORD and SESSION_SECRET come from Cloudflare env vars
 * (injected into globalThis.__CF_ENV__ by server.ts).
 */
import { createServerFn } from "@tanstack/react-start";
import { getCFAdminPassword, getCFSessionSecret } from "@/lib/kv.server";

const SESSION_COOKIE = "admin_session";

async function sign(value: string, secret: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(value));
  const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return `${value}.${b64}`;
}

async function verify(signed: string, secret: string): Promise<string | null> {
  const dot = signed.lastIndexOf(".");
  if (dot < 0) return null;
  const value = signed.slice(0, dot);
  const expected = await sign(value, secret);
  return expected === signed ? value : null;
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k) cookies[k.trim()] = decodeURIComponent(v.join("="));
  }
  return cookies;
}

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => data as { password: string })
  .handler(async ({ data }) => {
    const password = getCFAdminPassword();
    if (!password) throw new Error("ADMIN_PASSWORD non configurata — aggiungila nelle env vars di Cloudflare");
    if (data.password !== password) throw new Error("Password errata");
    const secret = getCFSessionSecret();
    const token = await sign(`admin:${Date.now()}`, secret);
    return { token, cookie: `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800` };
  });

export const checkAuthFn = createServerFn({ method: "GET" }).handler(async () => {
  // In Cloudflare Workers, we can read request headers via the Request object
  // TanStack Start server functions have access to the request via globalThis.__request__
  // which is set by the Nitro adapter. As fallback we check a query-param token.
  try {
    const req = (globalThis as Record<string, unknown>).__CF_REQUEST__ as Request | undefined;
    const cookieHeader = req?.headers.get("cookie") ?? "";
    const cookies = parseCookies(cookieHeader);
    const token = cookies[SESSION_COOKIE];
    if (!token) return { authed: false };
    const secret = getCFSessionSecret();
    const value = await verify(token, secret);
    return { authed: value?.startsWith("admin:") ?? false };
  } catch {
    return { authed: false };
  }
});
