import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { isSupabaseServiceConfigured, supabaseAdmin } from "@/integrations/supabase/client.server";
import { getKV } from "@/lib/kv.server";

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  subject: z.string().max(300).optional().default(""),
  message: z.string().min(1).max(5000),
});

const RATE_LIMIT_TTL = 120; // seconds cooldown per email address

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input) => ContactSchema.parse(input))
  .handler(async ({ data }) => {
    // ── Rate limiting per email ────────────────────────────────
    try {
      const kv = getKV();
      if (kv) {
        // normalise email to lower-case before using as key
        const emailKey = `rate:contact:${data.email.toLowerCase()}`;
        const existing = await kv.get(emailKey);
        if (existing) {
          return { ok: false as const, error: "Aspetta un paio di minuti prima di inviare un altro messaggio." };
        }
        await kv.put(emailKey, "1", { expirationTtl: RATE_LIMIT_TTL });
      }
    } catch {
      // non-blocking — if rate limit check fails, allow the request
    }

    if (!isSupabaseServiceConfigured()) {
      return { ok: false as const, error: "Contatti non configurati al momento. Scrivimi via email diretta." };
    }

    const { error } = await supabaseAdmin.from("contact_messages").insert({
      name: data.name,
      email: data.email,
      subject: data.subject ?? "",
      message: data.message,
    });
    if (error) {
      console.error("contact insert error", error);
      return { ok: false as const, error: "Could not send message. Please try again." };
    }
    return { ok: true as const };
  });
