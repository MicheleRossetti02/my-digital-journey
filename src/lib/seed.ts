import type { Section } from "./kv.server";

export const defaultSections: Section[] = [
  {
    id: "about", section_key: "about", section_type: "about",
    title_en: "A curious mind, in motion.", title_it: "Una mente curiosa, in movimento.",
    kicker_en: "About", kicker_it: "Chi sono",
    subtitle_en: "", subtitle_it: "",
    body_en: "I'm a curious, adaptable person — shaped by studying and living across Italy, Spain, and the Netherlands. My focus is the managerial side of technological innovation and economics: how companies, markets, and people evolve together. I enjoy being professional, but I also believe a good career is built on everything outside the CV — the trips, the trails, the people, the things you try just because you've never tried them.",
    body_it: "Sono una persona curiosa e adattabile — formata studiando e vivendo tra Italia, Spagna e Paesi Bassi. Mi interessa il lato manageriale dell'innovazione tecnologica e dell'economia: come aziende, mercati e persone evolvono insieme. Sono professionale, ma penso anche che una buona carriera si costruisca su tutto ciò che sta fuori dal CV — i viaggi, i sentieri, le persone, le cose che provi solo perché non le hai mai provate.",
    position: 10, visible: true, config: {}, items: [
      { id: "hl1", position: 10, visible: true, data: { text_en: "Digital Strategy", text_it: "Digital Strategy" } },
      { id: "hl2", position: 20, visible: true, data: { text_en: "Innovation Management", text_it: "Innovation Management" } },
      { id: "hl3", position: 30, visible: true, data: { text_en: "FinTech", text_it: "FinTech" } },
      { id: "hl4", position: 40, visible: true, data: { text_en: "Erasmus × 2", text_it: "Erasmus × 2" } },
      { id: "hl5", position: 50, visible: true, data: { text_en: "Data & Analytics", text_it: "Data & Analytics" } },
      { id: "hl6", position: 60, visible: true, data: { text_en: "Curious Builder", text_it: "Curious Builder" } },
    ]
  },
  {
    id: "education", section_key: "education", section_type: "education",
    title_en: "An education without borders.", title_it: "Una formazione senza confini.",
    kicker_en: "Education", kicker_it: "Formazione",
    subtitle_en: "", subtitle_it: "", body_en: "", body_it: "",
    position: 20, visible: true, config: {},
    items: [
      { id: "edu1", position: 10, visible: true, data: { school: "LUISS Business School", program_en: "Master in Digital Transformation", program_it: "Master in Digital Transformation", when_en: "2025 — present", when_it: "2025 — oggi", where_en: "Rome, Italy", where_it: "Roma, Italia" } },
      { id: "edu2", position: 20, visible: true, data: { school: "Universidad de Navarra", program_en: "Erasmus+ Exchange", program_it: "Scambio Erasmus+", when_en: "2024 — 2025", when_it: "2024 — 2025", where_en: "Pamplona, Spain", where_it: "Pamplona, Spagna" } },
      { id: "edu3", position: 30, visible: true, data: { school: "Hogeschool Saxion", program_en: "Erasmus+ Exchange", program_it: "Scambio Erasmus+", when_en: "2023 — 2024", when_it: "2023 — 2024", where_en: "Netherlands", where_it: "Paesi Bassi" } },
      { id: "edu4", position: 40, visible: true, data: { school: "Università di Roma Tor Vergata", program_en: "BSc in Economics & Management", program_it: "Laurea in Economia e Management", when_en: "2021 — 2025", when_it: "2021 — 2025", where_en: "Rome, Italy", where_it: "Roma, Italia" } },
      { id: "edu5", position: 50, visible: true, data: { school: "Boolean", program_en: "Full-Stack Web Developer Course", program_it: "Corso Full-Stack Web Developer", when_en: "2022 — 2023", when_it: "2022 — 2023", where_en: "Italy · personal interest", where_it: "Italia · interesse personale" } }
    ]
  },
  {
    id: "experiences", section_key: "experiences", section_type: "experiences",
    title_en: "Beyond the classroom.", title_it: "Oltre l'aula.",
    kicker_en: "Experiences", kicker_it: "Esperienze",
    subtitle_en: "Internships, side projects, sport and the things that shaped me outside formal education.", subtitle_it: "Stage, progetti personali, sport e le cose che mi hanno formato fuori dalla scuola.",
    body_en: "", body_it: "",
    position: 30, visible: true, config: {},
    items: [
      { id: "exp1", position: 10, visible: true, data: { title_en: "Otium Bookshelf — Founder", title_it: "Otium Bookshelf — Founder", org_en: "Personal venture", org_it: "Progetto personale", when_en: "2024 — present", when_it: "2024 — oggi", text_en: "Building a quiet companion app and site for readers, from idea to product.", text_it: "Sto costruendo un'app e un sito 'silenziosi' per lettori, dall'idea al prodotto." } },
      { id: "exp2", position: 20, visible: true, data: { title_en: "Web build for 2P Centro Revisioni", title_it: "Sito per 2P Centro Revisioni", org_en: "Client work", org_it: "Lavoro per cliente", when_en: "2024", when_it: "2024", text_en: "Designed and shipped a booking site for a friend's local vehicle inspection business.", text_it: "Ho progettato e pubblicato un sito di prenotazione per il centro revisioni di un amico." } },
      { id: "exp3", position: 30, visible: true, data: { title_en: "Sales assistant — Boutique", title_it: "Commesso — Boutique", org_en: "Retail · part-time", org_it: "Retail · part-time", when_en: "2023", when_it: "2023", text_en: "Customer-facing role in a fashion boutique.", text_it: "Ruolo a contatto con il cliente in una boutique." } },
      { id: "exp4", position: 40, visible: true, data: { title_en: "Waiter — Hospitality", title_it: "Cameriere — Ristorazione", org_en: "Restaurant · seasonal", org_it: "Ristorante · stagionale", when_en: "2022 — 2023", when_it: "2022 — 2023", text_en: "Service shifts during the summer season.", text_it: "Turni in sala durante la stagione estiva." } }
    ]
  },
  {
    id: "projects", section_key: "projects", section_type: "projects",
    title_en: "Things I've been building.", title_it: "Cose che ho costruito.",
    kicker_en: "Projects", kicker_it: "Progetti",
    subtitle_en: "Coding is a personal passion, not my career path — but it's how I stay close to the technology I want to help shape from the business side.", subtitle_it: "Programmare è una passione personale, non la mia carriera — ma è il modo in cui resto vicino alla tecnologia che voglio aiutare a plasmare dal lato business.",
    body_en: "Shipped sites, work in progress, and live experiments from GitHub.", body_it: "Siti pubblicati, lavori in corso ed esperimenti live da GitHub.",
    position: 40, visible: true, config: {},
    items: [
      { id: "proj1", position: 10, visible: true, data: { title: "Otium Bookshelf", tag_en: "In development · Live", tag_it: "In sviluppo · Online", desc_en: "An app and companion site for readers.", desc_it: "Un'app e un sito per lettori.", role_en: "Founder · Product & Development", role_it: "Founder · Prodotto & Sviluppo", stack: ["Product", "Web App", "Books"], href: "https://otiumbookshelf.com", image: "/case-otium.png" } },
      { id: "proj2", position: 20, visible: true, data: { title: "2P Centro Revisioni", tag_en: "Live · Client work", tag_it: "Online · Lavoro per cliente", desc_en: "Booking site built for a friend's vehicle inspection business.", desc_it: "Sito di prenotazione per il centro revisioni di un amico.", role_en: "Design & Development", role_it: "Design & Sviluppo", stack: ["Web", "Booking", "Local business"], href: "https://2pcentrorevisioni.com", image: "/case-2p.png" } }
    ]
  },
  {
    id: "now", section_key: "now", section_type: "custom",
    title_en: "What I'm up to.", title_it: "Cosa sto facendo.",
    kicker_en: "Now", kicker_it: "Adesso",
    subtitle_en: "A snapshot of this season — inspired by", subtitle_it: "Uno scatto di questa stagione — ispirato a",
    body_en: "", body_it: "",
    position: 15, visible: true, config: {},
    items: [
      { id: "now1", position: 10, visible: true, data: { text_en: "Studying for my Master in Digital Transformation at LUISS", text_it: "Studio per il Master in Digital Transformation alla LUISS" } },
      { id: "now2", position: 20, visible: true, data: { text_en: "Reading about innovation management & platform strategy", text_it: "Leggo di innovation management e platform strategy" } },
      { id: "now3", position: 30, visible: true, data: { text_en: "Training for a half-marathon · weekly calisthenics", text_it: "Mi alleno per una mezza maratona · calisthenics settimanale" } },
      { id: "now4", position: 40, visible: true, data: { text_en: "Planning the next trekking weekend in central Italy", text_it: "Pianifico il prossimo weekend di trekking nel Centro Italia" } },
      { id: "now5", position: 50, visible: true, data: { text_en: "Tinkering with this portfolio in my free evenings", text_it: "Lavoro a questo portfolio nelle serate libere" } }
    ]
  },
  {
    id: "passions", section_key: "passions", section_type: "passions",
    title_en: "What keeps me moving.", title_it: "Cosa mi tiene in movimento.",
    kicker_en: "Beyond the CV", kicker_it: "Oltre il CV",
    subtitle_en: "I take work seriously, but I'm not only what I study. I'm sportive, emotional, curious — happiest somewhere between a mountain trail, a new city, and a long conversation over food I've never tried before.", subtitle_it: "Prendo il lavoro sul serio, ma non non sono solo ciò che studio. Sono sportivo, emotivo, curioso — più felice tra un sentiero di montagna, una città nuova e una lunga chiacchierata davanti a un cibo che non ho mai provato.",
    body_en: "", body_it: "",
    position: 60, visible: true, config: {},
    items: [
      { id: "pass1", position: 10, visible: true, data: { icon: "🥾", title_en: "Trekking & Nature", title_it: "Trekking & natura", text_en: "I recharge outdoors.", text_it: "Mi ricarico all'aperto." } },
      { id: "pass2", position: 20, visible: true, data: { icon: "🏃", title_en: "Running & Calisthenics", title_it: "Corsa & calisthenics", text_en: "Training is my daily reset.", text_it: "L'allenamento è il mio reset quotidiano." } },
      { id: "pass3", position: 30, visible: true, data: { icon: "🌍", title_en: "Travel & New Perspectives", title_it: "Viaggi & nuove prospettive", text_en: "Two Erasmus, three countries, countless trips.", text_it: "Due Erasmus, tre paesi, tanti viaggi." } },
      { id: "pass4", position: 40, visible: true, data: { icon: "💡", title_en: "Curiosity, Always", title_it: "Curiosità, sempre", text_en: "If I've never tried it, I want to.", text_it: "Se non l'ho mai provato, voglio farlo." } },
      { id: "pass5", position: 50, visible: true, data: { icon: "📊", title_en: "Tech × Business", title_it: "Tech × business", text_en: "Fascinated by how innovation reshapes companies.", text_it: "Mi affascina come l'innovazione cambia aziende." } },
      { id: "pass6", position: 60, visible: true, data: { icon: "❤️", title_en: "People & Connection", title_it: "Persone & connessioni", text_en: "I'm an emotional, people-first person.", text_it: "Sono emotivo, parto sempre dalle persone." } }
    ]
  },
  {
    id: "gallery", section_key: "gallery", section_type: "gallery",
    title_en: "Outside the laptop.", title_it: "Fuori dal laptop.",
    kicker_en: "Off-screen", kicker_it: "Off-screen",
    subtitle_en: "A few frames from trails, trips, training and the moments in between.", subtitle_it: "Qualche scatto da sentieri, viaggi, allenamenti e momenti in mezzo.",
    body_en: "", body_it: "",
    position: 70, visible: true, config: {},
    items: [
      { id: "gal1", position: 10, visible: true, data: { src: "/gallery/lake.jpg", alt_en: "Lake", alt_it: "Lago" } },
      { id: "gal2", position: 20, visible: true, data: { src: "/gallery/handstand.jpg", alt_en: "Handstand", alt_it: "Verticale" } },
      { id: "gal3", position: 30, visible: true, data: { src: "/gallery/bbq.jpg", alt_en: "BBQ", alt_it: "BBQ" } },
      { id: "gal4", position: 40, visible: true, data: { src: "/gallery/concert.jpg", alt_en: "Concert", alt_it: "Concerto" } }
    ]
  }
];
