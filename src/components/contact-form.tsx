import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitContact } from "@/lib/contact.functions";

type Lang = "en" | "it";

const T = {
  en: {
    name: "Your name",
    email: "Email",
    subject: "Subject (optional)",
    message: "Message",
    send: "Send message",
    sending: "Sending…",
    success: "Thanks! Your message was received.",
    error: "Something went wrong. Try again later.",
    invalidEmail: "Please enter a valid email.",
  },
  it: {
    name: "Il tuo nome",
    email: "Email",
    subject: "Oggetto (opzionale)",
    message: "Messaggio",
    send: "Invia messaggio",
    sending: "Invio…",
    success: "Grazie! Il messaggio è stato ricevuto.",
    error: "Qualcosa è andato storto. Riprova più tardi.",
    invalidEmail: "Inserisci un'email valida.",
  },
} as const;

export function ContactForm({ lang }: { lang: Lang }) {
  const t = T[lang];
  const send = useServerFn(submitContact);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMsg(t.invalidEmail);
      return;
    }
    setStatus("loading");
    try {
      const res = await send({ data: { name, email, subject, message } });
      if (res.ok) {
        setStatus("success");
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      } else {
        setStatus("error");
        setErrorMsg(res.error ?? t.error);
      }
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMsg(t.error);
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-xl border border-white/15 bg-white/5 p-6 text-left">
        <p className="text-sm">{t.success}</p>
      </div>
    );
  }

  const inputCls =
    "w-full rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[oklch(0.78_0.12_162)]";

  return (
    <form onSubmit={onSubmit} className="grid gap-3 text-left max-w-xl mx-auto">
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t.name}
          className={inputCls}
          aria-label={t.name}
          maxLength={200}
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.email}
          className={inputCls}
          aria-label={t.email}
          maxLength={320}
        />
      </div>
      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder={t.subject}
        className={inputCls}
        aria-label={t.subject}
        maxLength={300}
      />
      <textarea
        required
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t.message}
        className={`${inputCls} min-h-[140px] resize-y`}
        aria-label={t.message}
        maxLength={5000}
      />
      {errorMsg ? <p className="text-xs text-red-300">{errorMsg}</p> : null}
      <div>
        <button
          type="submit"
          disabled={status === "loading"}
          className="inline-flex items-center justify-center rounded-md bg-[oklch(0.78_0.12_162)] px-5 py-2.5 text-sm font-medium text-[var(--ink)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {status === "loading" ? t.sending : t.send}
        </button>
      </div>
    </form>
  );
}
