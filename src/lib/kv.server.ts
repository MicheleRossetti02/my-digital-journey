/**
 * Cloudflare KV helper — reads SITE_KV from globalThis.__CF_ENV__
 * which is injected by server.ts at request time.
 */

type CFEnv = {
  SITE_KV?: KVNamespace;
  ADMIN_PASSWORD?: string;
  SESSION_SECRET?: string;
  BREVO_API_KEY?: string;
  RESEND_API_KEY?: string;
  MAIL_PROVIDER?: string;
  NOTIFICATION_EMAIL?: string;
};

export function getMailApiKey(): string {
  // supports BREVO_API_KEY or RESEND_API_KEY
  return (
    getCFEnv().BREVO_API_KEY ??
    process.env.BREVO_API_KEY ??
    getCFEnv().RESEND_API_KEY ??
    process.env.RESEND_API_KEY ??
    ""
  );
}

export function getMailProvider(): "brevo" | "resend" {
  const p = (getCFEnv().MAIL_PROVIDER ?? process.env.MAIL_PROVIDER ?? "brevo").toLowerCase();
  return p === "resend" ? "resend" : "brevo";
}

export function getNotificationEmail(): string {
  return getCFEnv().NOTIFICATION_EMAIL ?? process.env.NOTIFICATION_EMAIL ?? "michelerossetti07@gmail.com";
}

function getCFEnv(): CFEnv {
  return ((globalThis as Record<string, unknown>).__CF_ENV__ as CFEnv) ?? {};
}

export function getKV(): KVNamespace | null {
  return getCFEnv().SITE_KV ?? null;
}

export function getCFAdminPassword(): string {
  return getCFEnv().ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "";
}

export function getCFAdminEmail(): string {
  return getCFEnv().ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "";
}

export function getCFSessionSecret(): string {
  return getCFEnv().SESSION_SECRET ?? process.env.SESSION_SECRET ?? "dev-secret-change-me";
}

// ─── Default content (shown when KV is empty on first deploy) ───────────────

export const DEFAULT_PROFILE = {
  name: "Michele Rossetti",
  email: "michelerossetti07@gmail.com",
  location: "Rome, Italy · Open to relocate",
  avatar_url: null as string | null,
  cv_url: "/cv.pdf",
  bio_en:
    "Economics & Management graduate drawn to the space where technology meets strategy. Currently pursuing a Master's in Digital Transformation at LUISS Business School, Rome.",
  bio_it:
    "Laureato in Economia e Management, attratto dallo spazio in cui la tecnologia incontra la strategia. Attualmente Master in Digital Transformation alla LUISS Business School, Roma.",
  tagline_en: "Digital Transformation · Innovation × Strategy",
  tagline_it: "Digital Transformation · Innovazione × Strategia",
  typing_en: [
    "Digital Transformation Student",
    "Innovation & Management",
    "Tech × Business Enthusiast",
    "Global Mindset",
  ],
  typing_it: [
    "Studente di Digital Transformation",
    "Innovazione & Management",
    "Tech × Business",
    "Mentalità globale",
  ],
  links: [
    { label: "LinkedIn", url: "https://www.linkedin.com/in/michele-rossetti-298561263/" },
    { label: "Email", url: "mailto:michelerossetti07@gmail.com" },
  ],
  github_config: {
    username: "MicheleRossetti02",
    pinned: [] as string[],
    max: 6,
  },
};

export type SiteProfile = typeof DEFAULT_PROFILE;

export type SectionItem = {
  id: string;
  position: number;
  visible: boolean;
  data: Record<string, unknown>;
};

export type Section = {
  id: string;
  section_key: string;
  section_type: string;
  title_en: string;
  title_it: string;
  subtitle_en: string;
  subtitle_it: string;
  kicker_en: string;
  kicker_it: string;
  body_en: string;
  body_it: string;
  position: number;
  visible: boolean;
  config: Record<string, unknown>;
  items: SectionItem[];
};

function mkSection(
  key: string, type: string, position: number,
  kickerEn: string, kickerIt: string, titleEn: string, titleIt: string,
): Section {
  return {
    id: key, section_key: key, section_type: type,
    title_en: titleEn, title_it: titleIt,
    subtitle_en: "", subtitle_it: "",
    kicker_en: kickerEn, kicker_it: kickerIt,
    body_en: "", body_it: "",
    position, visible: true, config: {}, items: [],
  };
}

export const DEFAULT_SECTIONS: Section[] = [
  mkSection("about", "about", 10, "About", "Chi sono", "A curious mind, in motion.", "Una mente curiosa, in movimento."),
  mkSection("now", "now", 15, "Now", "Adesso", "What I'm up to.", "Cosa sto facendo."),
  mkSection("education", "education", 20, "Education", "Formazione", "An education without borders.", "Una formazione senza confini."),
  mkSection("experiences", "experiences", 30, "Experiences", "Esperienze", "Beyond the classroom.", "Oltre l'aula."),
  mkSection("skills", "skills", 40, "Skills", "Competenze", "Soft & hard skills.", "Soft & hard skills."),
  mkSection("projects", "projects", 50, "Projects", "Progetti", "Things I've been building.", "Cose che ho costruito."),
  mkSection("looking", "looking", 55, "Looking for", "Sto cercando", "Where I want to go next.", "Dove voglio andare."),
  mkSection("passions", "passions", 60, "Beyond the CV", "Oltre il CV", "What keeps me moving.", "Cosa mi tiene in movimento."),
  mkSection("reading", "reading", 65, "Bookshelf", "Libreria", "What I'm reading & listening to.", "Cosa sto leggendo e ascoltando."),
  mkSection("gallery", "gallery", 70, "Off-screen", "Off-screen", "Outside the laptop.", "Fuori dal laptop."),
];

// ─── KV read/write ────────────────────────────────────────────────────────────

export async function kvGetProfile(): Promise<SiteProfile> {
  const kv = getKV();
  if (!kv) return DEFAULT_PROFILE;
  try {
    const raw = await kv.get("site:profile");
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) } as SiteProfile;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function kvSetProfile(profile: SiteProfile): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error("KV binding not available — add SITE_KV to wrangler.jsonc");
  await kv.put("site:profile", JSON.stringify(profile));
}

export async function kvGetSections(): Promise<Section[]> {
  const kv = getKV();
  if (!kv) return DEFAULT_SECTIONS;
  try {
    const raw = await kv.get("site:sections");
    if (!raw) return DEFAULT_SECTIONS;
    const stored = JSON.parse(raw) as Section[];
    // Merge: inject any default sections not yet in KV (new sections added over time)
    const storedKeys = new Set(stored.map((s) => s.section_key));
    const missing = DEFAULT_SECTIONS.filter((s) => !storedKeys.has(s.section_key));
    return missing.length > 0 ? [...stored, ...missing] : stored;
  } catch {
    return DEFAULT_SECTIONS;
  }
}

export async function kvSetSections(sections: Section[]): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error("KV binding not available — add SITE_KV to wrangler.jsonc");
  await kv.put("site:sections", JSON.stringify(sections));
}

// ─── Contact messages ─────────────────────────────────────────────────────────

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  created_at: string;
};

const MESSAGES_KEY = "site:messages";
const MAX_MESSAGES = 200;

export async function kvGetMessages(): Promise<ContactMessage[]> {
  const kv = getKV();
  if (!kv) return [];
  try {
    const raw = await kv.get(MESSAGES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ContactMessage[];
  } catch {
    return [];
  }
}

export async function kvAddMessage(
  msg: Omit<ContactMessage, "id" | "read" | "created_at">,
): Promise<ContactMessage> {
  const kv = getKV();
  if (!kv) throw new Error("KV not available");
  const newMsg: ContactMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ...msg,
    read: false,
    created_at: new Date().toISOString(),
  };
  const existing = await kvGetMessages();
  const updated = [newMsg, ...existing].slice(0, MAX_MESSAGES);
  await kv.put(MESSAGES_KEY, JSON.stringify(updated));
  return newMsg;
}

export async function kvUpdateMessage(
  id: string,
  patch: Partial<Pick<ContactMessage, "read">>,
): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error("KV not available");
  const existing = await kvGetMessages();
  const updated = existing.map((m) => (m.id === id ? { ...m, ...patch } : m));
  await kv.put(MESSAGES_KEY, JSON.stringify(updated));
}

export async function kvDeleteMessage(id: string): Promise<void> {
  const kv = getKV();
  if (!kv) throw new Error("KV not available");
  const existing = await kvGetMessages();
  await kv.put(MESSAGES_KEY, JSON.stringify(existing.filter((m) => m.id !== id)));
}
