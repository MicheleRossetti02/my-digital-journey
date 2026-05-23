import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getKV, getMailApiKey, getMailProvider, getNotificationEmail, kvAddMessage } from "@/lib/kv.server";

const ContactSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email().max(320),
  subject: z.string().max(300).optional().default(""),
  message: z.string().min(1).max(5000),
});

const RATE_LIMIT_TTL = 120; // seconds cooldown per email address

async function sendEmailNotification(msg: {
  name: string;
  email: string;
  subject: string;
  message: string;
}): Promise<void> {
  const apiKey = getMailApiKey();
  if (!apiKey) return; // silently skip if not configured

  const to = getNotificationEmail();
  const provider = getMailProvider();
  const subjectLine = msg.subject
    ? `[Portfolio] ${msg.subject} — da ${msg.name}`
    : `[Portfolio] Nuovo messaggio da ${msg.name}`;

  const html = `
    <p><strong>Nome:</strong> ${msg.name}</p>
    <p><strong>Email:</strong> <a href="mailto:${msg.email}">${msg.email}</a></p>
    ${msg.subject ? `<p><strong>Oggetto:</strong> ${msg.subject}</p>` : ""}
    <hr />
    <p style="white-space:pre-wrap">${msg.message.replace(/</g, "&lt;")}</p>
    <hr />
    <p style="color:#888;font-size:12px">
      Ricevuto da <a href="https://rossettimichele.com">rossettimichele.com</a>
    </p>
  `;

  if (provider === "resend") {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Portfolio Contact <onboarding@resend.dev>",
        to: [to],
        subject: subjectLine,
        html,
      }),
    });
  } else {
    // Brevo (default) — free 300 emails/day, no SDK needed
    // Sender must be verified in Brevo dashboard (use same email as `to`)
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Portfolio Contact", email: to },
        to: [{ email: to }],
        subject: subjectLine,
        htmlContent: html,
        replyTo: { email: msg.email, name: msg.name },
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Brevo error ${res.status}:`, body);
    }
  }
}

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input) => ContactSchema.parse(input))
  .handler(async ({ data }) => {
    // ── Rate limiting per email ──────────────────────────────────
    try {
      const kv = getKV();
      if (kv) {
        const emailKey = `rate:contact:${data.email.toLowerCase()}`;
        const existing = await kv.get(emailKey);
        if (existing) {
          return {
            ok: false as const,
            error: "Aspetta un paio di minuti prima di inviare un altro messaggio.",
          };
        }
        await kv.put(emailKey, "1", { expirationTtl: RATE_LIMIT_TTL });
      }
    } catch {
      // non-blocking
    }

    // ── Save to KV ───────────────────────────────────────────────
    try {
      await kvAddMessage({
        name: data.name,
        email: data.email,
        subject: data.subject ?? "",
        message: data.message,
      });
    } catch (e) {
      console.error("kvAddMessage error", e);
      return { ok: false as const, error: "Errore nel salvataggio. Riprova più tardi." };
    }

    // ── Email notification (non-blocking — don't fail submission) ─
    sendEmailNotification({
      name: data.name,
      email: data.email,
      subject: data.subject ?? "",
      message: data.message,
    }).catch((e) => console.error("sendEmailNotification error", e));

    return { ok: true as const };
  });
