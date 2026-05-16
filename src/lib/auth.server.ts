/**
 * Simple cookie-based admin auth — no Supabase.
 * ADMIN_PASSWORD and SESSION_SECRET come from Cloudflare env vars
 * (injected into globalThis.__CF_ENV__ by server.ts).
 */
import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie } from "@tanstack/react-start/server";
import { getCFAdminPassword, getCFSessionSecret, getCFAdminEmail } from "@/lib/kv.server";

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
  .handler(async ({ data }: { data: { email: string; password: string } }) => {
    const adminEmail = getCFAdminEmail();
    const adminPassword = getCFAdminPassword();
    if (!adminPassword) throw new Error("ADMIN_PASSWORD non configurata");
    if (adminEmail && data.email.toLowerCase() !== adminEmail.toLowerCase()) throw new Error("Email non riconosciuta");
    if (data.password !== adminPassword) throw new Error("Password errata");
    const secret = getCFSessionSecret();
    const token = await sign(`admin:${Date.now()}`, secret);
    // Set cookie server-side via Set-Cookie header (HttpOnly cookies cannot be set via document.cookie)
    setCookie(SESSION_COOKIE, encodeURIComponent(token), {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 604800,
    });
    return { ok: true };
  });

export const checkAuthFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    // getCookie() reads from the incoming browser request — works correctly in TanStack Start server fns
    const token = getCookie(SESSION_COOKIE);
    if (!token) return { authed: false };
    const secret = getCFSessionSecret();
    const value = await verify(decodeURIComponent(token), secret);
    return { authed: value?.startsWith("admin:") ?? false };
  } catch {
    return { authed: false };
  }
});
