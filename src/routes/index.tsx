import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useReveal } from "@/hooks/use-reveal";
import { useTyping } from "@/hooks/use-typing";
import { useTheme } from "@/hooks/use-theme";
import { useLanguage } from "@/hooks/use-language";
import { GitHubProjects } from "@/components/github-projects";
import { SkillsSection } from "@/components/skills-section";
import { ContactForm } from "@/components/contact-form";
import { getPublicSite, type PublicSection } from "@/lib/public-site.functions";
import { initTracker } from "@/lib/tracker";
import avatarUrl from "/avatar.jpg?url";

export const Route = createFileRoute("/")({
  component: Index,
  loader: async () => {
    try {
      return await getPublicSite();
    } catch (e) {
      console.error("getPublicSite failed", e);
      return { profile: null, sections: [] as PublicSection[] };
    }
  },
});

const EMAIL_FALLBACK = "michelerossetti07@gmail.com";
const LINKEDIN = "https://www.linkedin.com/in/michele-rossetti-298561263/";
const DOMAIN = "rossettimichele.com";

type Lang = "en" | "it";

// ============================================================
// Translations
// ============================================================
const T = {
  en: {
    nav: { about: "About", now: "Now", projects: "Projects", contact: "Contact" },
    hero: {
      location: "📍 Rome, Italy · Open to relocate",
      bio: "Economics & Management graduate drawn to the space where technology meets strategy. Currently pursuing a Master's in Digital Transformation at LUISS Business School, Rome.",
      viewProjects: "View Projects",
      downloadCV: "Download CV",
      contact: "Contact",
      typing: [
        "Digital Transformation Student",
        "Innovation & Management",
        "Tech × Business Enthusiast",
        "Global Mindset",
      ],
    },
    about: {
      kicker: "About",
      title: "A curious mind, in motion.",
      body:
        "I'm a curious, adaptable person — shaped by studying and living across Italy, Spain, and the Netherlands. My focus is the managerial side of technological innovation and economics: how companies, markets, and people evolve together. I enjoy being professional, but I also believe a good career is built on everything outside the CV — the trips, the trails, the people, the things you try just because you've never tried them.",
    },
    now: {
      kicker: "Now",
      title: "What I'm up to.",
      sub: "A snapshot of this season — inspired by",
      items: [
        "Studying for my Master in Digital Transformation at LUISS",
        "Reading about innovation management & platform strategy",
        "Training for a half-marathon · weekly calisthenics",
        "Planning the next trekking weekend in central Italy",
        "Tinkering with this portfolio in my free evenings",
      ],
    },
    education: { kicker: "Education", title: "An education without borders." },
    experiences: {
      kicker: "Experiences",
      title: "Beyond the classroom.",
      sub: "Internships, side projects, sport and the things that shaped me outside formal education.",
    },
    projects: {
      kicker: "Projects",
      title: "Things I've been building.",
      sub: "Coding is a personal passion, not my career path — but it's how I stay close to the technology I want to help shape from the business side.",
      sub2: "Shipped sites, work in progress, and live experiments from GitHub.",
      visit: "Visit site →",
      moreTitle: "More on the way",
      moreText:
        "Currently working on improving the existing projects and shipping new ones — this space will keep growing.",
      inProgress: "In progress",
    },
    looking: {
      kicker: "Looking for",
      title: "Where I want to go next.",
      bodyA: "I'm looking for a first role at the intersection of ",
      bodyHL: "strategy, innovation and technology",
      bodyB:
        " — consulting, product, or innovation management inside a company that takes digital transformation seriously. I learn fast, I move between cultures comfortably, and I'd rather ask a hard question than coast on an easy answer.",
      quote: "Non exiguum temporis habemus, sed multum perdidimus.",
      quoteTr: "\"We don't have little time, but we waste much of it.\" — Seneca, ",
      quoteSrc: "De brevitate vitae",
    },
    reading: {
      kicker: "Bookshelf",
      title: "What I'm reading & listening to.",
      sub: "Books and podcasts shape how I think — a small slice of what's on rotation right now.",
    },
    skills: {
      kicker: "Skills",
      title: "Tools & languages.",
      technical: "Technical",
      languages: "Languages",
    },
    passions: {
      kicker: "Beyond the CV",
      title: "What keeps me moving.",
      sub: "I take work seriously, but I'm not only what I study. I'm sportive, emotional, curious — happiest somewhere between a mountain trail, a new city, and a long conversation over food I've never tried before.",
    },
    gallery: {
      kicker: "Off-screen",
      title: "Outside the laptop.",
      sub: "A few frames from trails, trips, training and the moments in between.",
    },
    contact: {
      kicker: "Get in touch",
      titleA: "Let's build ",
      titleEm: "something",
      titleB: ".",
      footer: "Built with care · Rome, 2025",
    },
  },
  it: {
    nav: { about: "Chi sono", now: "Adesso", projects: "Progetti", contact: "Contatti" },
    hero: {
      location: "📍 Roma, Italia · Disponibile a trasferirmi",
      bio: "Laureato in Economia e Management, attratto dallo spazio in cui la tecnologia incontra la strategia. Attualmente Master in Digital Transformation alla LUISS Business School, Roma.",
      viewProjects: "Vedi i progetti",
      downloadCV: "Scarica CV",
      contact: "Contattami",
      typing: [
        "Studente di Digital Transformation",
        "Innovazione & Management",
        "Tech × Business",
        "Mentalità globale",
      ],
    },
    about: {
      kicker: "Chi sono",
      title: "Una mente curiosa, in movimento.",
      body:
        "Sono una persona curiosa e adattabile — formata studiando e vivendo tra Italia, Spagna e Paesi Bassi. Mi interessa il lato manageriale dell'innovazione tecnologica e dell'economia: come aziende, mercati e persone evolvono insieme. Sono professionale, ma penso anche che una buona carriera si costruisca su tutto ciò che sta fuori dal CV — i viaggi, i sentieri, le persone, le cose che provi solo perché non le hai mai provate.",
    },
    now: {
      kicker: "Adesso",
      title: "Cosa sto facendo.",
      sub: "Uno scatto di questa stagione — ispirato a",
      items: [
        "Studio per il Master in Digital Transformation alla LUISS",
        "Leggo di innovation management e platform strategy",
        "Mi alleno per una mezza maratona · calisthenics settimanale",
        "Pianifico il prossimo weekend di trekking nel Centro Italia",
        "Lavoro a questo portfolio nelle serate libere",
      ],
    },
    education: { kicker: "Formazione", title: "Una formazione senza confini." },
    experiences: {
      kicker: "Esperienze",
      title: "Oltre l'aula.",
      sub: "Stage, progetti personali, sport e le cose che mi hanno formato fuori dalla scuola.",
    },
    projects: {
      kicker: "Progetti",
      title: "Cose che ho costruito.",
      sub: "Programmare è una passione personale, non la mia carriera — ma è il modo in cui resto vicino alla tecnologia che voglio aiutare a plasmare dal lato business.",
      sub2: "Siti pubblicati, lavori in corso ed esperimenti live da GitHub.",
      visit: "Visita il sito →",
      moreTitle: "Altro in arrivo",
      moreText:
        "Sto migliorando i progetti esistenti e ne sto creando di nuovi — questo spazio continuerà a crescere.",
      inProgress: "In corso",
    },
    looking: {
      kicker: "Sto cercando",
      title: "Dove voglio andare.",
      bodyA: "Cerco un primo ruolo all'intersezione tra ",
      bodyHL: "strategia, innovazione e tecnologia",
      bodyB:
        " — consulting, prodotto o innovation management in un'azienda che prende sul serio la trasformazione digitale. Imparo in fretta, mi muovo bene tra culture diverse e preferisco fare una domanda difficile che adagiarmi su una risposta facile.",
      quote: "Non exiguum temporis habemus, sed multum perdidimus.",
      quoteTr: "\"Non abbiamo poco tempo, ma ne perdiamo molto.\" — Seneca, ",
      quoteSrc: "De brevitate vitae",
    },
    reading: {
      kicker: "Libreria",
      title: "Cosa sto leggendo e ascoltando.",
      sub: "Libri e podcast danno forma al mio pensiero — una piccola parte di ciò che ruota in questo momento.",
    },
    skills: {
      kicker: "Competenze",
      title: "Strumenti e lingue.",
      technical: "Tecniche",
      languages: "Lingue",
    },
    passions: {
      kicker: "Oltre il CV",
      title: "Cosa mi tiene in movimento.",
      sub: "Prendo il lavoro sul serio, ma non sono solo ciò che studio. Sono sportivo, emotivo, curioso — più felice tra un sentiero di montagna, una città nuova e una lunga chiacchierata davanti a un cibo che non ho mai provato.",
    },
    gallery: {
      kicker: "Off-screen",
      title: "Fuori dal laptop.",
      sub: "Qualche scatto da sentieri, viaggi, allenamenti e momenti in mezzo.",
    },
    contact: {
      kicker: "Mettiamoci in contatto",
      titleA: "Costruiamo ",
      titleEm: "qualcosa",
      titleB: ".",
      footer: "Built with care · Roma, 2025",
    },
  },
} as const;

// ============================================================
// Data (language-aware where it matters)
// ============================================================
// HIGHLIGHTS are now managed via the "about" section items

const EDUCATION = {
  en: [
    { school: "LUISS Business School", program: "Master in Digital Transformation", when: "2025 — present", where: "Rome, Italy" },
    { school: "Universidad de Navarra", program: "Erasmus+ Exchange", when: "2024 — 2025", where: "Pamplona, Spain" },
    { school: "Hogeschool Saxion", program: "Erasmus+ Exchange", when: "2023 — 2024", where: "Netherlands" },
    { school: "Università di Roma Tor Vergata", program: "BSc in Economics & Management", when: "2021 — 2025", where: "Rome, Italy" },
    { school: "Boolean", program: "Full-Stack Web Developer Course", when: "2022 — 2023", where: "Italy · personal interest" },
  ],
  it: [
    { school: "LUISS Business School", program: "Master in Digital Transformation", when: "2025 — oggi", where: "Roma, Italia" },
    { school: "Universidad de Navarra", program: "Scambio Erasmus+", when: "2024 — 2025", where: "Pamplona, Spagna" },
    { school: "Hogeschool Saxion", program: "Scambio Erasmus+", when: "2023 — 2024", where: "Paesi Bassi" },
    { school: "Università di Roma Tor Vergata", program: "Laurea in Economia e Management", when: "2021 — 2025", where: "Roma, Italia" },
    { school: "Boolean", program: "Corso Full-Stack Web Developer", when: "2022 — 2023", where: "Italia · interesse personale" },
  ],
};

const EXPERIENCES = {
  en: [
    { title: "Otium Bookshelf — Founder", org: "Personal venture", when: "2024 — present", text: "Building a quiet companion app and site for readers, from idea to product. Currently iterating on existing projects and shipping new ones in parallel." },
    { title: "Web build for 2P Centro Revisioni", org: "Client work", when: "2024", text: "Designed and shipped a booking site for a friend's local vehicle inspection business." },
    { title: "Sales assistant — Boutique", org: "Retail · part-time", when: "2023", text: "Customer-facing role in a fashion boutique. Learned how to read people quickly, handle objections and close with care." },
    { title: "Waiter — Hospitality", org: "Restaurant · seasonal", when: "2022 — 2023", text: "Service shifts during the summer season. Speed under pressure, teamwork, and a real respect for the people on the floor." },
    { title: "Erasmus+ × 2 — Spain & Netherlands", org: "Universidad de Navarra · Saxion", when: "2023 — 2025", text: "Two exchanges that reshaped how I work in international teams and read different cultures." },
    { title: "Calisthenics & Running", org: "Long-term practice", when: "Ongoing", text: "Consistent training as a discipline — the same patience and reps I bring to work." },
  ],
  it: [
    { title: "Otium Bookshelf — Founder", org: "Progetto personale", when: "2024 — oggi", text: "Sto costruendo un'app e un sito 'silenziosi' per lettori, dall'idea al prodotto. Attualmente miglioro i progetti esistenti e ne sto avviando altri in parallelo." },
    { title: "Sito per 2P Centro Revisioni", org: "Lavoro per cliente", when: "2024", text: "Ho progettato e pubblicato un sito di prenotazione per il centro revisioni di un amico." },
    { title: "Commesso — Boutique", org: "Retail · part-time", when: "2023", text: "Ruolo a contatto con il cliente in una boutique. Ho imparato a leggere le persone in fretta, gestire obiezioni e chiudere con attenzione." },
    { title: "Cameriere — Ristorazione", org: "Ristorante · stagionale", when: "2022 — 2023", text: "Turni in sala durante la stagione estiva. Velocità sotto pressione, lavoro di squadra e rispetto vero per chi sta in sala." },
    { title: "Erasmus+ × 2 — Spagna e Paesi Bassi", org: "Universidad de Navarra · Saxion", when: "2023 — 2025", text: "Due scambi che hanno cambiato il mio modo di lavorare in team internazionali." },
    { title: "Calisthenics & corsa", org: "Pratica costante", when: "In corso", text: "Allenamento come disciplina — la stessa pazienza e ripetizione che porto nel lavoro." },
  ],
};

const TECHNICAL = ["Digital Strategy", "Excel & VBA", "CRM & Sales Tools", "Financial Reporting", "Data Analysis", "Web Dev (for fun)", "EIPASS Certified"];

const LANGUAGES = {
  en: [
    { name: "Italian", level: "Native", value: 100 },
    { name: "English", level: "C1 — Fluent", value: 88 },
    { name: "Spanish", level: "B2 — Intermediate", value: 70 },
  ],
  it: [
    { name: "Italiano", level: "Madrelingua", value: 100 },
    { name: "Inglese", level: "C1 — Fluente", value: 88 },
    { name: "Spagnolo", level: "B2 — Intermedio", value: 70 },
  ],
};

const PASSIONS = {
  en: [
    { icon: "🥾", title: "Trekking & Nature", text: "I recharge outdoors. Long walks, mountain trails, the silence of forests — they put everything else into perspective." },
    { icon: "🏃", title: "Running & Calisthenics", text: "Training is my daily reset. I love any sport someone puts in front of me — the curiosity to try is half the fun." },
    { icon: "🌍", title: "Travel & New Perspectives", text: "Two Erasmus, three countries, countless trips. Different cuisines, different ways of thinking — that's how the world moves forward." },
    { icon: "💡", title: "Curiosity, Always", text: "If I've never tried it, I want to. From a new sport to a side project to a new city — putting myself out there is the point." },
    { icon: "📊", title: "Tech × Business", text: "Fascinated by how innovation reshapes companies and markets. The space where strategy, people, and technology meet." },
    { icon: "❤️", title: "People & Connection", text: "I'm an emotional, people-first person. The best ideas, meals, and memories all come from the conversations around them." },
    { icon: "📚", title: "Books & Ideas", text: "Books are how I slow down and think long-term — from innovation and strategy to novels that shift how I see the world. Otium Bookshelf was born from this." },
    { icon: "🌱", title: "Passions Yet to Come", text: "The next passion will start the moment I discover it. I want to keep growing — staying open to what I haven't tried yet is part of who I am." },
  ],
  it: [
    { icon: "🥾", title: "Trekking & natura", text: "Mi ricarico all'aperto. Lunghe camminate, sentieri di montagna, il silenzio dei boschi — rimettono tutto in prospettiva." },
    { icon: "🏃", title: "Corsa & calisthenics", text: "L'allenamento è il mio reset quotidiano. Amo qualsiasi sport mi venga proposto — la curiosità di provare è già metà del gusto." },
    { icon: "🌍", title: "Viaggi & nuove prospettive", text: "Due Erasmus, tre paesi, tanti viaggi. Cucine diverse, modi diversi di pensare — è così che il mondo va avanti." },
    { icon: "💡", title: "Curiosità, sempre", text: "Se non l'ho mai provato, voglio farlo. Dal nuovo sport al side project, alla città nuova — mettermi in gioco è il punto." },
    { icon: "📊", title: "Tech × business", text: "Mi affascina come l'innovazione cambia aziende e mercati. Lo spazio dove strategia, persone e tecnologia si incontrano." },
    { icon: "❤️", title: "Persone & connessioni", text: "Sono emotivo, parto sempre dalle persone. Le idee migliori, i pasti migliori, i ricordi migliori nascono dalle conversazioni intorno." },
    { icon: "📚", title: "Libri & idee", text: "I libri sono il mio modo di rallentare e pensare nel lungo periodo — da innovazione e strategia ai romanzi che cambiano sguardo. Otium Bookshelf nasce da qui." },
    { icon: "🌱", title: "Passioni ancora da scoprire", text: "La prossima passione inizierà nel momento in cui la scoprirò. Voglio continuare a crescere — restare aperto a ciò che non ho ancora provato." },
  ],
};

const CASE_STUDIES = {
  en: [
    { title: "Otium Bookshelf", tag: "In development · Live", description: "An app and companion site for readers — a quiet place to track, organize and rediscover your library. Born from my own passion for books and the calm of reading.", role: "Founder · Product & Development", stack: ["Product", "Web App", "Books"], href: "https://otiumbookshelf.com", image: "/case-otium.png" },
    { title: "2P Centro Revisioni", tag: "Live · Client work", description: "Booking site built for a friend's vehicle inspection business — clear info, easy appointment requests, mobile-first. Real product for a real local business.", role: "Design & Development", stack: ["Web", "Booking", "Local business"], href: "https://2pcentrorevisioni.com", image: "/case-2p.png" },
  ],
  it: [
    { title: "Otium Bookshelf", tag: "In sviluppo · Online", description: "Un'app e un sito per lettori — un posto tranquillo per tracciare, organizzare e riscoprire la propria libreria. Nato dalla mia passione per i libri e dalla calma del leggere.", role: "Founder · Prodotto & Sviluppo", stack: ["Prodotto", "Web App", "Libri"], href: "https://otiumbookshelf.com", image: "/case-otium.png" },
    { title: "2P Centro Revisioni", tag: "Online · Lavoro per cliente", description: "Sito di prenotazione per il centro revisioni di un amico — informazioni chiare, richieste di appuntamento semplici, mobile-first. Prodotto reale per un'attività locale reale.", role: "Design & Sviluppo", stack: ["Web", "Prenotazioni", "Attività locale"], href: "https://2pcentrorevisioni.com", image: "/case-2p.png" },
  ],
};

const READING = {
  en: [
    { title: "The Innovator's Dilemma", author: "Clayton Christensen", tag: "Reading" },
    { title: "De brevitate vitae", author: "Seneca", tag: "Re-reading" },
    { title: "Acquired", author: "Podcast", tag: "Listening" },
    { title: "a16z", author: "Podcast", tag: "Listening" },
  ],
  it: [
    { title: "The Innovator's Dilemma", author: "Clayton Christensen", tag: "In lettura" },
    { title: "De brevitate vitae", author: "Seneca", tag: "Rilettura" },
    { title: "Acquired", author: "Podcast", tag: "In ascolto" },
    { title: "a16z", author: "Podcast", tag: "In ascolto" },
  ],
};

const GALLERY = [
  { src: "/gallery/lake.jpg", alt: "Lake and mountains, camera in hand" },
  { src: "/gallery/handstand.jpg", alt: "Calisthenics handstand on parallel bars" },
  { src: "/gallery/bbq.jpg", alt: "BBQ outdoors with friends, snowy mountains in the background" },
  { src: "/gallery/concert.jpg", alt: "On stage at a concert" },
  { src: "/gallery/heic1.jpg", alt: "Personal photo" },
  { src: "/gallery/heic2.jpg", alt: "Personal photo" },
  { src: "/gallery/heic3.jpg", alt: "Personal photo" },
];

// ============================================================
// Icons
// ============================================================
function LinkedInIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.37V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  );
}
function ArrowDown() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}
function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

// ============================================================
// Lang + Theme toggles
// ============================================================
function LangToggle({ lang, setLang }: { lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] p-0.5 text-xs font-medium">
      {(["en", "it"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={`px-2.5 py-1 rounded-full transition-colors uppercase tracking-wider ${
            lang === l ? "bg-[var(--ink)] text-[var(--paper)]" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={lang === l}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="inline-flex items-center justify-center w-9 h-9 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] text-foreground/70 hover:text-[var(--accent-hue)] hover:border-[var(--accent-hue)] transition-colors"
    >
      {isDark ? (
        // Sun
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}

// ============================================================
// Page
// ============================================================
function Index() {
  useReveal();
  useEffect(() => { initTracker(); }, []);

  const data = Route.useLoaderData();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash?.replace(/^#/, "");
    if (!hash) return;
    const tryScroll = () => {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ block: "start" });
    };
    tryScroll();
    const t = window.setTimeout(tryScroll, 120);
    return () => window.clearTimeout(t);
  }, [data?.sections?.length]);
  const profile = data?.profile;
  const dbSections = useMemo(() => {
    const map = new Map<string, PublicSection>();
    (data?.sections ?? []).forEach((s: PublicSection) => map.set(s.section_key, s));
    return map;
  }, [data]);

  // section is visible unless DB explicitly has a row marked invisible
  const isVisible = (key: string) => {
    if (!data?.sections?.length) return true;
    return dbSections.has(key);
  };

  const [lang, setLang] = useLanguage("en");

  const t = T[lang];

  // Dynamic Content Helpers
  const sec = (key: string) => {
    const s = dbSections.get(key);
    const fallback = (t as any)[key] || {};
    return {
      kicker: (lang === "it" ? s?.kicker_it : s?.kicker_en) || fallback.kicker,
      title: (lang === "it" ? s?.title_it : s?.title_en) || fallback.title,
      sub: (lang === "it" ? s?.subtitle_it : s?.subtitle_en) || fallback.sub,
      body: (lang === "it" ? s?.body_it : s?.body_en) || fallback.body,
    };
  };

  const getItems = (key: string, fallback: any[]) => {
    const s = dbSections.get(key);
    if (!s || !s.items || s.items.length === 0) return fallback;
    const mappedItems = s.items
      .filter((i) => i.visible !== false)
      .sort((a, b) => a.position - b.position)
      .map((i) => {
        const d = i.data as Record<string, any>;
        const mapped: Record<string, any> = { _id: i.id };
        const localized: Record<string, { en?: any; it?: any }> = {};
        for (const k in d) {
          if (k.endsWith("_en") || k.endsWith("_it")) {
            const base = k.slice(0, -3);
            if (!localized[base]) localized[base] = {};
            if (k.endsWith("_en")) localized[base].en = d[k];
            if (k.endsWith("_it")) localized[base].it = d[k];
          } else {
            mapped[k] = d[k];
          }
        }
        for (const base in localized) {
          const pair = localized[base];
          mapped[base] = lang === "it"
            ? (pair.it || pair.en || "")
            : (pair.en || pair.it || "");
        }
        return mapped;
      })
      .filter(mapped => {
        // Only keep items that have at least some visible content
        return mapped.title || mapped.text || mapped.school || mapped.org || mapped.src || mapped.name || mapped.group || mapped.category || mapped.icon;
      });

    return mappedItems.length > 0 ? mappedItems : fallback;
  };

  const dbTyping = lang === "it" ? profile?.typing_it : profile?.typing_en;
  const typingSource =
    dbTyping && dbTyping.length > 0 ? dbTyping : (t.hero.typing as unknown as string[]);
  const typed = useTyping(typingSource);

  const EMAIL = profile?.email || EMAIL_FALLBACK;
  const AVATAR_SRC = profile?.avatar_url || avatarUrl;
  const CV_HREF = profile?.cv_url || "/cv.pdf";
  const NAME = profile?.name || "Michele Rossetti";
  const HERO_BIO = (lang === "it" ? profile?.bio_it : profile?.bio_en) || t.hero.bio;
  const skillsSectionDb = dbSections.get("skills");

  return (
    <main className="min-h-screen">
      {/* ===== HERO ===== */}
      <header data-section="hero" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 opacity-60"
          style={{ background: "radial-gradient(60% 50% at 50% 0%, oklch(0.92 0.04 162 / 0.6), transparent 70%)" }}
        />
        <nav className="max-w-5xl mx-auto px-6 pt-8 flex items-center justify-between text-sm">
          <span className="font-serif text-xl">MR.</span>
          <div className="flex items-center gap-5 text-muted-foreground">
            <a href="#about" className="hover:text-foreground transition-colors">{t.nav.about}</a>
            <a href="#now" className="hover:text-foreground transition-colors">{t.nav.now}</a>
            <a href="#projects" className="hover:text-foreground transition-colors">{t.nav.projects}</a>
            <a href="#contact" className="hover:text-foreground transition-colors">{t.nav.contact}</a>
            <LangToggle lang={lang} setLang={setLang} />
            <ThemeToggle />
          </div>
        </nav>

        <section className="max-w-5xl mx-auto px-6 pt-16 pb-28 md:pt-20 md:pb-36">
          <div className="grid md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-center">
            <div className="reveal order-2 md:order-1">
              <span className="pill mb-6">{t.hero.location}</span>
              <h1 className="font-serif text-5xl md:text-7xl lg:text-[5.5rem] leading-[1.02] tracking-tight">
                {NAME.split(" ")[0]} <br className="hidden md:block" />
                <em className="text-[var(--accent-hue)]">{NAME.split(" ").slice(1).join(" ") || NAME}</em>.
              </h1>
              <p className="mt-6 text-xl md:text-2xl text-muted-foreground min-h-[1.6em]">
                <span className="caret">{typed}</span>
              </p>
              <p className="mt-8 max-w-xl text-base md:text-lg text-foreground/80 leading-relaxed">
                {HERO_BIO}
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a href="#projects" className="btn btn-primary">
                  {t.hero.viewProjects} <ArrowDown />
                </a>
                <a href={CV_HREF} download={`${NAME.replace(/\s+/g, "-")}-CV.pdf`} className="btn btn-ghost">
                  <DownloadIcon /> {t.hero.downloadCV}
                </a>
                <a href={`mailto:${EMAIL}`} className="btn btn-ghost">
                  <MailIcon /> {t.hero.contact}
                </a>
                <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                  className="ml-1 inline-flex items-center justify-center w-11 h-11 rounded-full border border-[var(--color-border)] text-foreground/70 hover:text-[var(--accent-hue)] hover:border-[var(--accent-hue)] transition-colors">
                  <LinkedInIcon />
                </a>
              </div>
            </div>

            {/* Avatar */}
            <div className="reveal order-1 md:order-2 flex md:block justify-start">
              <div className="relative">
                <div className="absolute -inset-3 rounded-full -z-10 blur-2xl opacity-60"
                  style={{ background: "var(--accent-soft)" }} aria-hidden />
                <img
                  src={AVATAR_SRC}
                  alt={`Portrait of ${NAME}`}
                  width={224}
                  height={224}
                  className="w-36 h-36 md:w-56 md:h-56 rounded-full object-cover object-center border border-[var(--color-border)] shadow-[0_20px_60px_-20px_oklch(0.18_0.01_60/0.25)]"
                />
              </div>
            </div>
          </div>
        </section>
      </header>

      {/* ===== ABOUT ===== */}
      {isVisible("about") && (
      <section id="about" data-section="about" className="py-24 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[1fr_2fr] gap-12">
          <div className="reveal">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{sec("about").kicker}</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">{sec("about").title}</h2>
          </div>
          <div className="reveal space-y-6">
            <p className="text-lg leading-relaxed text-foreground/85">{sec("about").body}</p>
            <div className="flex flex-wrap gap-2">
              {(dbSections.get("about")?.items.length ? getItems("about", []) : [
                { text: "Digital Strategy" }, { text: "Innovation Management" },
                { text: "FinTech" }, { text: "Erasmus × 2" },
                { text: "Data & Analytics" }, { text: "Curious Builder" }
              ]).map((item: any) => (
                <span key={item.text || item.title} className="pill">{item.text || item.title}</span>
              ))}
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ===== NOW ===== */}
      {isVisible("now") && (
      <section id="now" data-section="now" className="py-24 border-t border-[var(--color-border)] bg-[var(--cream)]/50">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[1fr_2fr] gap-12">
          <div className="reveal">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{sec("now").kicker}</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">{sec("now").title}</h2>
            <p className="text-sm text-muted-foreground mt-4">
              {sec("now").sub}{" "}
              <a href="https://nownownow.com" target="_blank" rel="noopener noreferrer"
                className="underline underline-offset-2 hover:text-[var(--accent-hue)]">
                nownownow.com
              </a>.
            </p>
          </div>
          <ul className="reveal space-y-4">
            {(dbSections.get("now")?.items.length ? getItems("now", []) : t.now.items.map((text: string) => ({ text }))).map((item: any) => (
              <li key={item.text} className="flex gap-4 items-start">
                <span className="mt-2 w-2 h-2 rounded-full bg-[var(--accent-hue)] shrink-0" aria-hidden />
                <span className="text-lg text-foreground/85">{item.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* ===== EDUCATION ===== */}
      {isVisible("education") && (
      <section id="education" data-section="education" className="py-24 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal mb-14">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{sec("education").kicker}</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">{sec("education").title}</h2>
          </div>
          <ol className="relative ml-3 md:ml-6 border-l border-[var(--color-border)]">
            {getItems("education", EDUCATION[lang]).map((e: any) => (
              <li key={e.school} className="reveal relative pl-8 md:pl-12 pb-10 last:pb-0">
                <span className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-[var(--paper)] border-2 border-[var(--accent-hue)]" aria-hidden />
                <h3 className="font-semibold text-lg">{e.school}</h3>
                <p className="text-foreground/80 mt-0.5">{e.program}</p>
                <p className="text-sm text-muted-foreground mt-1">{e.when} · {e.where}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
      )}

      {/* ===== EXPERIENCES ===== */}
      {isVisible("experiences") && (
      <section id="experiences" data-section="experiences" className="py-24 border-t border-[var(--color-border)] bg-[var(--cream)]/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal mb-14 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{sec("experiences").kicker}</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">{sec("experiences").title}</h2>
            <p className="text-sm text-muted-foreground mt-4">{sec("experiences").sub}</p>
          </div>
          <ol className="relative ml-3 md:ml-6 border-l border-[var(--color-border)]">
            {getItems("experiences", EXPERIENCES[lang]).map((e: any, idx: number) => {
              const title = e.title || e.role || e.name || e.school || e.org || "Esperienza";
              const org = e.org || e.organization || e.company || "";
              const when = e.when || e.period || "";
              const text = e.text || e.description || e.desc || "";
              return (
              <li key={e._id || `${title}-${idx}`} className="reveal relative pl-8 md:pl-12 pb-10 last:pb-0">
                <span className="absolute -left-[7px] top-1.5 w-3.5 h-3.5 rounded-full bg-[var(--paper)] border-2 border-[var(--accent-hue)]" aria-hidden />
                <h3 className="font-semibold text-lg">{title}</h3>
                {org ? <p className="text-foreground/80 mt-0.5">{org}</p> : null}
                {when ? <p className="text-sm text-muted-foreground mt-1">{when}</p> : null}
                {text ? <p className="text-foreground/75 mt-3 leading-relaxed">{text}</p> : null}
              </li>
              );
            })}
          </ol>
        </div>
      </section>
      )}

      {/* ===== PROJECTS ===== */}
      {isVisible("projects") && (
      <section id="projects" data-section="projects" className="py-24 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{sec("projects").kicker}</p>
              <h2 className="font-serif text-4xl md:text-5xl mt-3">{sec("projects").title}</h2>
              <p className="text-sm text-muted-foreground mt-3 max-w-lg">{sec("projects").sub}</p>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm">{sec("projects").body}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {getItems("projects", CASE_STUDIES[lang]).map((c: any) => (
              <a key={c.title} href={c.href} target="_blank" rel="noopener noreferrer"
                className="reveal card-surface group flex flex-col !p-0 overflow-hidden">
                <div className="aspect-[16/10] overflow-hidden bg-[var(--cream)] border-b border-[var(--color-border)] relative">
                  {c.image ? (
                    <img src={c.image} alt={`${c.title} screenshot`} loading="lazy"
                      className="w-full h-full object-cover object-top group-hover:scale-[1.03] transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">Anteprima non disponibile</div>
                  )}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-wider text-[var(--accent-hue)] font-medium">{c.tag}</span>
                    <span className="text-muted-foreground group-hover:text-[var(--accent-hue)] transition-colors" aria-hidden>↗</span>
                  </div>
                  <h3 className="font-serif text-2xl">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{c.desc || c.description}</p>
                  <p className="text-xs text-foreground/60 mt-4">{c.role}</p>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {(c.stack || []).map((s: string) => (
                      <span key={s} className="pill text-xs">{s}</span>
                    ))}
                  </div>
                  <span className="mt-5 text-sm font-medium text-foreground/80 group-hover:text-[var(--accent-hue)] transition-colors">
                    {t.projects.visit}
                  </span>
                </div>
              </a>
            ))}

            <div className="reveal card-surface flex flex-col justify-center items-center text-center border-dashed">
              <div className="text-3xl mb-3" aria-hidden>🛠️</div>
              <h3 className="font-serif text-2xl">{t.projects.moreTitle}</h3>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xs">{t.projects.moreText}</p>
              <span className="mt-5 text-xs uppercase tracking-wider text-[var(--accent-hue)] font-medium">
                {t.projects.inProgress}
              </span>
            </div>
          </div>

          <div className="reveal">
            <GitHubProjects config={profile?.github_config} />
          </div>
        </div>
      </section>
      )}

      {/* ===== LOOKING FOR ===== */}
      {isVisible("looking") && (
      <section id="looking" data-section="looking" className="py-24 border-t border-[var(--color-border)] bg-[var(--cream)]/50">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[1fr_2fr] gap-12">
          <div className="reveal">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{sec("looking").kicker}</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">{sec("looking").title}</h2>
          </div>
          <div className="reveal space-y-6">
            <p className="text-lg leading-relaxed text-foreground/85">
              {sec("looking").body || (
                <>
                  {t.looking.bodyA}
                  <span className="text-[var(--accent-hue)] font-medium">{t.looking.bodyHL}</span>
                  {t.looking.bodyB}
                </>
              )}
            </p>
            <figure className="border-l-2 border-[var(--accent-hue)] pl-5 py-1">
              <blockquote className="font-serif text-xl md:text-2xl italic leading-snug text-foreground/90">
                "{sec("looking").sub || t.looking.quote}"
              </blockquote>
              <figcaption className="mt-3 text-sm text-muted-foreground">
                {t.looking.quoteTr}<em>{t.looking.quoteSrc}</em>
              </figcaption>
            </figure>
          </div>
        </div>
      </section>
      )}

      {/* ===== READING ===== */}
      {isVisible("reading") && (
      <section id="reading" data-section="reading" className="py-24 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal mb-12 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{sec("reading").kicker}</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">{sec("reading").title}</h2>
            <p className="text-sm text-muted-foreground mt-4">{sec("reading").sub}</p>
          </div>
          <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {getItems("reading", READING[lang]).map((r: any) => (
              <li key={r.title} className="reveal card-surface">
                <span className="text-xs uppercase tracking-wider text-[var(--accent-hue)] font-medium">{r.tag}</span>
                <h3 className="font-serif text-xl mt-2 leading-tight">{r.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.author || r.org}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
      )}

      {/* ===== SKILLS (new no-bars design from DB) ===== */}
      {skillsSectionDb && skillsSectionDb.items.length > 0 ? (
        <SkillsSection section={skillsSectionDb} lang={lang} />
      ) : (
      <section id="skills" data-section="skills" className="py-24 border-t border-[var(--color-border)] bg-[var(--cream)]/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal mb-14">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{t.skills.kicker}</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">{t.skills.title}</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-12">
            <div className="reveal">
              <h3 className="font-semibold mb-5 text-foreground/70 text-sm uppercase tracking-wider">{t.skills.technical}</h3>
              <div className="flex flex-wrap gap-2">
                {TECHNICAL.map((s) => (
                  <span key={s} className="pill">{s}</span>
                ))}
              </div>
            </div>
            <div className="reveal">
              <h3 className="font-semibold mb-5 text-foreground/70 text-sm uppercase tracking-wider">{t.skills.languages}</h3>
              <div className="space-y-3">
                {LANGUAGES[lang].map((l) => (
                  <div key={l.name} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3">
                    <span className="font-medium">{l.name}</span>
                    <span className="text-xs uppercase tracking-wider text-[var(--accent-hue)] font-medium">{l.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ===== PASSIONS ===== */}
      {isVisible("passions") && (
      <section id="passions" data-section="passions" className="py-24 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal mb-14 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{sec("passions").kicker}</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">{sec("passions").title}</h2>
            <p className="mt-5 text-foreground/75 leading-relaxed">{sec("passions").sub}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {getItems("passions", PASSIONS[lang]).map((p: any, idx: number) => {
              const title = p.title || p.name || "Passione";
              const text = p.text || p.description || p.desc || "";
              const icon = p.icon || "✨";
              return (
              <div key={p._id || `${title}-${idx}`} className="reveal card-surface">
                <div className="text-3xl mb-4" aria-hidden>{icon}</div>
                <h3 className="font-semibold mb-2">{title}</h3>
                {text ? <p className="text-sm text-muted-foreground leading-relaxed">{text}</p> : null}
              </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* ===== GALLERY ===== */}
      {isVisible("gallery") && (
      <section id="gallery" data-section="gallery" className="py-24 border-t border-[var(--color-border)] bg-[var(--cream)]/50">
        <div className="max-w-5xl mx-auto px-6">
          <div className="reveal mb-10 max-w-2xl">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">{sec("gallery").kicker}</p>
            <h2 className="font-serif text-4xl md:text-5xl mt-3">{sec("gallery").title}</h2>
            <p className="text-sm text-muted-foreground mt-4">{sec("gallery").sub}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {getItems("gallery", GALLERY).map((g: any, idx: number) => (
              <figure key={g.src || idx} className="reveal aspect-square overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--cream)]">
                {g.src ? (
                  <img src={g.src} alt={g.alt || g.caption} loading="lazy"
                    className="w-full h-full object-cover hover:scale-[1.04] transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] text-muted-foreground p-2 text-center">Nessuna Immagine</div>
                )}
              </figure>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ===== CONTACT / FOOTER ===== */}
      <footer id="contact" data-section="contact" className="py-28 border-t border-[var(--color-border)]" style={{ background: "oklch(0.18 0.01 60)", color: "oklch(0.98 0.008 85)" }}>
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="reveal">
            <p className="text-sm uppercase tracking-[0.18em] opacity-60">{t.contact.kicker}</p>
            <h2 className="font-serif text-5xl md:text-6xl mt-4">
              {t.contact.titleA}<em className="text-[oklch(0.78_0.12_162)]">{t.contact.titleEm}</em>{t.contact.titleB}
            </h2>
            <a href={`mailto:${EMAIL}`}
              className="inline-block mt-8 font-serif text-2xl md:text-3xl underline decoration-1 underline-offset-[6px] hover:text-[oklch(0.78_0.12_162)] transition-colors">
              {EMAIL}
            </a>
            <div className="mt-10 flex justify-center">
              <a href={LINKEDIN} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn"
                className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-white/20 hover:border-white hover:bg-white/5 transition-colors">
                <LinkedInIcon />
              </a>
            </div>
            <div className="mt-12">
              <ContactForm lang={lang} />
            </div>
            <p className="mt-16 text-xs opacity-50">{DOMAIN} · {t.contact.footer}</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
