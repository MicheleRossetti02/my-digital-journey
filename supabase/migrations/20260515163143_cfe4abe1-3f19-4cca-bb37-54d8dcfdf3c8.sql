
-- =========================================================
-- ADMINS
-- =========================================================
CREATE TABLE public.admins (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Security definer to avoid recursion
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = _user_id)
$$;

CREATE POLICY "Admins can read admins" ON public.admins
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));

-- =========================================================
-- TIMESTAMP TRIGGER
-- =========================================================
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =========================================================
-- SITE PROFILE (single row)
-- =========================================================
CREATE TABLE public.site_profile (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name TEXT NOT NULL DEFAULT 'Michele Rossetti',
  tagline_en TEXT NOT NULL DEFAULT '',
  tagline_it TEXT NOT NULL DEFAULT '',
  bio_en TEXT NOT NULL DEFAULT '',
  bio_it TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT 'Rome, Italy',
  avatar_url TEXT,
  avatar_position_x NUMERIC NOT NULL DEFAULT 50,
  avatar_position_y NUMERIC NOT NULL DEFAULT 50,
  avatar_scale NUMERIC NOT NULL DEFAULT 1,
  cv_url TEXT,
  email TEXT NOT NULL DEFAULT 'michelerossetti07@gmail.com',
  links JSONB NOT NULL DEFAULT '[]'::jsonb,
  typing_en JSONB NOT NULL DEFAULT '[]'::jsonb,
  typing_it JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.site_profile ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.site_profile
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "Public can read profile" ON public.site_profile
  FOR SELECT USING (true);
CREATE POLICY "Admins can update profile" ON public.site_profile
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert profile" ON public.site_profile
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- =========================================================
-- SECTIONS
-- =========================================================
CREATE TABLE public.sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  section_type TEXT NOT NULL,
  title_en TEXT NOT NULL DEFAULT '',
  title_it TEXT NOT NULL DEFAULT '',
  subtitle_en TEXT NOT NULL DEFAULT '',
  subtitle_it TEXT NOT NULL DEFAULT '',
  kicker_en TEXT NOT NULL DEFAULT '',
  kicker_it TEXT NOT NULL DEFAULT '',
  body_en TEXT NOT NULL DEFAULT '',
  body_it TEXT NOT NULL DEFAULT '',
  position INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sections ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.sections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE POLICY "Public can read visible sections" ON public.sections
  FOR SELECT USING (visible = true);
CREATE POLICY "Admins can read all sections" ON public.sections
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert sections" ON public.sections
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update sections" ON public.sections
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete sections" ON public.sections
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- =========================================================
-- SECTION ITEMS
-- =========================================================
CREATE TABLE public.section_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.sections(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  visible BOOLEAN NOT NULL DEFAULT true,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.section_items ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.section_items
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX idx_section_items_section ON public.section_items(section_id, position);

CREATE POLICY "Public can read visible items" ON public.section_items
  FOR SELECT USING (
    visible = true AND EXISTS (
      SELECT 1 FROM public.sections s
      WHERE s.id = section_id AND s.visible = true
    )
  );
CREATE POLICY "Admins can read all items" ON public.section_items
  FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert items" ON public.section_items
  FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));
CREATE POLICY "Admins can update items" ON public.section_items
  FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete items" ON public.section_items
  FOR DELETE TO authenticated USING (public.is_admin(auth.uid()));

-- =========================================================
-- STORAGE BUCKET
-- =========================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Admins can upload media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'media' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can update media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'media' AND public.is_admin(auth.uid()));
CREATE POLICY "Admins can delete media" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'media' AND public.is_admin(auth.uid()));

-- =========================================================
-- SEED PROFILE
-- =========================================================
INSERT INTO public.site_profile (
  id, name, tagline_en, tagline_it, bio_en, bio_it, location,
  avatar_url, cv_url, email, links, typing_en, typing_it
) VALUES (
  1,
  'Michele Rossetti',
  'Digital Transformation · Innovation × Strategy',
  'Digital Transformation · Innovazione × Strategia',
  'Economics & Management graduate drawn to the space where technology meets strategy. Currently pursuing a Master''s in Digital Transformation at LUISS Business School, Rome.',
  'Laureato in Economia e Management, attratto dallo spazio in cui la tecnologia incontra la strategia. Attualmente Master in Digital Transformation alla LUISS Business School, Roma.',
  'Rome, Italy · Open to relocate',
  '/avatar.jpg',
  '/cv.pdf',
  'michelerossetti07@gmail.com',
  '[
    {"label":"LinkedIn","url":"https://www.linkedin.com/in/michele-rossetti-298561263/","icon":"linkedin"},
    {"label":"Email","url":"mailto:michelerossetti07@gmail.com","icon":"mail"},
    {"label":"GitHub","url":"https://github.com/MicheleRossetti02","icon":"github"}
  ]'::jsonb,
  '["Digital Transformation Student","Innovation & Management","Tech × Business Enthusiast","Global Mindset"]'::jsonb,
  '["Studente di Digital Transformation","Innovazione & Management","Tech × Business","Mentalità globale"]'::jsonb
);

-- =========================================================
-- SEED SECTIONS
-- =========================================================
INSERT INTO public.sections (section_key, section_type, kicker_en, kicker_it, title_en, title_it, subtitle_en, subtitle_it, body_en, body_it, position) VALUES
  ('about','about','About','Chi sono','A curious mind, in motion.','Una mente curiosa, in movimento.','','',
    'I''m a curious, adaptable person — shaped by studying and living across Italy, Spain, and the Netherlands. My focus is the managerial side of technological innovation and economics: how companies, markets, and people evolve together.',
    'Sono una persona curiosa e adattabile — formata studiando e vivendo tra Italia, Spagna e Paesi Bassi. Mi interessa il lato manageriale dell''innovazione tecnologica e dell''economia: come aziende, mercati e persone evolvono insieme.',
    10),
  ('education','education','Education','Formazione','An education without borders.','Una formazione senza confini.','','','','', 20),
  ('experiences','experiences','Experiences','Esperienze','Beyond the classroom.','Oltre l''aula.',
    'Internships, side projects, sport and the things that shaped me outside formal education.',
    'Stage, progetti personali, sport e le cose che mi hanno formato fuori dalla scuola.','','', 30),
  ('skills','skills','Skills','Competenze','Soft & hard skills.','Soft & hard skills.',
    'Self-assessed levels — a snapshot of where I am today and where I''m growing.',
    'Livelli auto-valutati — uno scatto di dove sono oggi e dove sto crescendo.','','', 40),
  ('projects','projects','Projects','Progetti','Things I''ve been building.','Cose che ho costruito.',
    'Shipped sites, work in progress, and live experiments.',
    'Siti pubblicati, lavori in corso ed esperimenti live.','','', 50),
  ('passions','passions','Beyond the CV','Oltre il CV','What keeps me moving.','Cosa mi tiene in movimento.',
    'I take work seriously, but I''m not only what I study.',
    'Prendo il lavoro sul serio, ma non sono solo ciò che studio.','','', 60),
  ('gallery','gallery','Off-screen','Off-screen','Outside the laptop.','Fuori dal laptop.',
    'A few frames from trails, trips, training and the moments in between.',
    'Qualche scatto da sentieri, viaggi, allenamenti e momenti in mezzo.','','', 70),
  ('contact','contact','Get in touch','Mettiamoci in contatto','Let''s build something.','Costruiamo qualcosa.','','','','', 80);

-- =========================================================
-- SEED ITEMS: EDUCATION
-- =========================================================
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 10, '{"school":"LUISS Business School","program_en":"Master in Digital Transformation","program_it":"Master in Digital Transformation","when_en":"2025 — present","when_it":"2025 — oggi","where_en":"Rome, Italy","where_it":"Roma, Italia"}'::jsonb FROM public.sections WHERE section_key='education';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 20, '{"school":"Universidad de Navarra","program_en":"Erasmus+ Exchange","program_it":"Scambio Erasmus+","when_en":"2024 — 2025","when_it":"2024 — 2025","where_en":"Pamplona, Spain","where_it":"Pamplona, Spagna"}'::jsonb FROM public.sections WHERE section_key='education';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 30, '{"school":"Hogeschool Saxion","program_en":"Erasmus+ Exchange","program_it":"Scambio Erasmus+","when_en":"2023 — 2024","when_it":"2023 — 2024","where_en":"Netherlands","where_it":"Paesi Bassi"}'::jsonb FROM public.sections WHERE section_key='education';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 40, '{"school":"Università di Roma Tor Vergata","program_en":"BSc in Economics & Management","program_it":"Laurea in Economia e Management","when_en":"2021 — 2025","when_it":"2021 — 2025","where_en":"Rome, Italy","where_it":"Roma, Italia"}'::jsonb FROM public.sections WHERE section_key='education';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 50, '{"school":"Boolean","program_en":"Full-Stack Web Developer Course","program_it":"Corso Full-Stack Web Developer","when_en":"2022 — 2023","when_it":"2022 — 2023","where_en":"Italy · personal interest","where_it":"Italia · interesse personale"}'::jsonb FROM public.sections WHERE section_key='education';

-- =========================================================
-- SEED ITEMS: EXPERIENCES
-- =========================================================
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 10, '{"title_en":"Otium Bookshelf — Founder","title_it":"Otium Bookshelf — Founder","org_en":"Personal venture","org_it":"Progetto personale","when_en":"2024 — present","when_it":"2024 — oggi","text_en":"Building a quiet companion app and site for readers, from idea to product. Currently iterating on existing projects and shipping new ones in parallel.","text_it":"Sto costruendo un''app e un sito ''silenziosi'' per lettori, dall''idea al prodotto. Attualmente miglioro i progetti esistenti e ne sto avviando altri in parallelo."}'::jsonb FROM public.sections WHERE section_key='experiences';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 20, '{"title_en":"Web build for 2P Centro Revisioni","title_it":"Sito per 2P Centro Revisioni","org_en":"Client work","org_it":"Lavoro per cliente","when_en":"2024","when_it":"2024","text_en":"Designed and shipped a booking site for a friend''s local vehicle inspection business.","text_it":"Ho progettato e pubblicato un sito di prenotazione per il centro revisioni di un amico."}'::jsonb FROM public.sections WHERE section_key='experiences';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 30, '{"title_en":"Sales assistant — Boutique","title_it":"Commesso — Boutique","org_en":"Retail · part-time","org_it":"Retail · part-time","when_en":"2023","when_it":"2023","text_en":"Customer-facing role in a fashion boutique. Learned how to read people quickly, handle objections and close with care.","text_it":"Ruolo a contatto con il cliente in una boutique. Ho imparato a leggere le persone in fretta, gestire obiezioni e chiudere con attenzione."}'::jsonb FROM public.sections WHERE section_key='experiences';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 40, '{"title_en":"Waiter — Hospitality","title_it":"Cameriere — Ristorazione","org_en":"Restaurant · seasonal","org_it":"Ristorante · stagionale","when_en":"2022 — 2023","when_it":"2022 — 2023","text_en":"Service shifts during the summer season. Speed under pressure, teamwork, and a real respect for the people on the floor.","text_it":"Turni in sala durante la stagione estiva. Velocità sotto pressione, lavoro di squadra e rispetto vero per chi sta in sala."}'::jsonb FROM public.sections WHERE section_key='experiences';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 50, '{"title_en":"Erasmus+ × 2 — Spain & Netherlands","title_it":"Erasmus+ × 2 — Spagna e Paesi Bassi","org_en":"Universidad de Navarra · Saxion","org_it":"Universidad de Navarra · Saxion","when_en":"2023 — 2025","when_it":"2023 — 2025","text_en":"Two exchanges that reshaped how I work in international teams and read different cultures.","text_it":"Due scambi che hanno cambiato il mio modo di lavorare in team internazionali."}'::jsonb FROM public.sections WHERE section_key='experiences';

-- =========================================================
-- SEED ITEMS: SKILLS (from photo - 6 soft skills groups, levels 1-6)
-- =========================================================
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 10, '{"category":"soft","group_en":"People Facilitation","group_it":"People Facilitation","name_en":"Facilitates group work","name_it":"Facilita il lavoro di gruppo","level":5}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 20, '{"category":"soft","group_en":"People Facilitation","group_it":"People Facilitation","name_en":"Listens & integrates others'' views","name_it":"Ascolta e integra punti di vista altrui","level":6}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 30, '{"category":"soft","group_en":"People Facilitation","group_it":"People Facilitation","name_en":"Understands relationship dynamics & mediates","name_it":"Comprende le dinamiche relazionali e media","level":4}'::jsonb FROM public.sections WHERE section_key='skills';

INSERT INTO public.section_items (section_id, position, data)
SELECT id, 40, '{"category":"soft","group_en":"Coordinating with Others","group_it":"Coordinarsi con gli altri","name_en":"Values others'' ideas & inputs","name_it":"Valorizza idee e contributi altrui","level":6}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 50, '{"category":"soft","group_en":"Coordinating with Others","group_it":"Coordinarsi con gli altri","name_en":"Offers & receives constructive feedback","name_it":"Offre e riceve feedback costruttivi","level":4}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 60, '{"category":"soft","group_en":"Coordinating with Others","group_it":"Coordinarsi con gli altri","name_en":"Supports group/team decisions","name_it":"Supporta le decisioni del gruppo","level":5}'::jsonb FROM public.sections WHERE section_key='skills';

INSERT INTO public.section_items (section_id, position, data)
SELECT id, 70, '{"category":"soft","group_en":"Emotional Intelligence","group_it":"Intelligenza emotiva","name_en":"Self-awareness & emotional control","name_it":"Consapevolezza e controllo emotivo","level":2}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 80, '{"category":"soft","group_en":"Emotional Intelligence","group_it":"Intelligenza emotiva","name_en":"Active listening (verbal & non-verbal)","name_it":"Ascolto attivo (verbale e non)","level":5}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 90, '{"category":"soft","group_en":"Emotional Intelligence","group_it":"Intelligenza emotiva","name_en":"Adapts style to others'' reactions","name_it":"Adatta lo stile alle reazioni altrui","level":4}'::jsonb FROM public.sections WHERE section_key='skills';

INSERT INTO public.section_items (section_id, position, data)
SELECT id, 100, '{"category":"soft","group_en":"Critical Thinking","group_it":"Pensiero critico","name_en":"Integrates diverse perspectives","name_it":"Integra prospettive diverse","level":5}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 110, '{"category":"soft","group_en":"Critical Thinking","group_it":"Pensiero critico","name_en":"Constructively analyses facts & implications","name_it":"Analizza fatti e implicazioni costruttivamente","level":4}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 120, '{"category":"soft","group_en":"Critical Thinking","group_it":"Pensiero critico","name_en":"Articulates viewpoints clearly","name_it":"Articola i punti di vista con chiarezza","level":5}'::jsonb FROM public.sections WHERE section_key='skills';

INSERT INTO public.section_items (section_id, position, data)
SELECT id, 130, '{"category":"soft","group_en":"Decision Making","group_it":"Capacità decisionale","name_en":"Manages biases & impulsiveness","name_it":"Gestisce bias e impulsività","level":5}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 140, '{"category":"soft","group_en":"Decision Making","group_it":"Capacità decisionale","name_en":"Aware of risks, develops mitigations","name_it":"Consapevole dei rischi, sviluppa mitigazioni","level":4}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 150, '{"category":"soft","group_en":"Decision Making","group_it":"Capacità decisionale","name_en":"Concrete decisions integrating others","name_it":"Decisioni concrete integrando gli altri","level":4}'::jsonb FROM public.sections WHERE section_key='skills';

INSERT INTO public.section_items (section_id, position, data)
SELECT id, 160, '{"category":"soft","group_en":"Negotiation Skills","group_it":"Capacità negoziali","name_en":"Clear ideas based on facts & numbers","name_it":"Idee chiare basate su fatti e numeri","level":3}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 170, '{"category":"soft","group_en":"Negotiation Skills","group_it":"Capacità negoziali","name_en":"Explores team needs, manages conflicts","name_it":"Esplora bisogni del team, gestisce conflitti","level":4}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 180, '{"category":"soft","group_en":"Negotiation Skills","group_it":"Capacità negoziali","name_en":"Active participation toward shared solutions","name_it":"Partecipazione attiva verso soluzioni condivise","level":5}'::jsonb FROM public.sections WHERE section_key='skills';

-- HARD SKILLS (from current site)
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 200, '{"category":"hard","group_en":"Tools & Tech","group_it":"Strumenti e Tech","name_en":"Excel & VBA","name_it":"Excel e VBA","level":5}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 210, '{"category":"hard","group_en":"Tools & Tech","group_it":"Strumenti e Tech","name_en":"Data Analysis","name_it":"Analisi dati","level":4}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 220, '{"category":"hard","group_en":"Tools & Tech","group_it":"Strumenti e Tech","name_en":"CRM & Sales Tools","name_it":"CRM e strumenti vendita","level":4}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 230, '{"category":"hard","group_en":"Tools & Tech","group_it":"Strumenti e Tech","name_en":"Web Development (HTML/CSS/JS)","name_it":"Sviluppo Web (HTML/CSS/JS)","level":4}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 240, '{"category":"hard","group_en":"Tools & Tech","group_it":"Strumenti e Tech","name_en":"Financial Reporting","name_it":"Reportistica finanziaria","level":4}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 250, '{"category":"hard","group_en":"Languages","group_it":"Lingue","name_en":"Italian — Native","name_it":"Italiano — Madrelingua","level":6}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 260, '{"category":"hard","group_en":"Languages","group_it":"Lingue","name_en":"English — C1","name_it":"Inglese — C1","level":5}'::jsonb FROM public.sections WHERE section_key='skills';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 270, '{"category":"hard","group_en":"Languages","group_it":"Lingue","name_en":"Spanish — B2","name_it":"Spagnolo — B2","level":4}'::jsonb FROM public.sections WHERE section_key='skills';

-- =========================================================
-- SEED ITEMS: PROJECTS
-- =========================================================
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 10, '{"title":"Otium Bookshelf","tag_en":"In development · Live","tag_it":"In sviluppo · Online","desc_en":"An app and companion site for readers — a quiet place to track, organize and rediscover your library.","desc_it":"Un''app e un sito per lettori — un posto tranquillo per tracciare, organizzare e riscoprire la propria libreria.","role_en":"Founder · Product & Development","role_it":"Founder · Prodotto & Sviluppo","stack":["Product","Web App","Books"],"href":"https://otiumbookshelf.com","image":"/case-otium.png"}'::jsonb FROM public.sections WHERE section_key='projects';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 20, '{"title":"2P Centro Revisioni","tag_en":"Live · Client work","tag_it":"Online · Lavoro cliente","desc_en":"Booking site built for a friend''s vehicle inspection business — clear info, easy appointment requests, mobile-first.","desc_it":"Sito di prenotazione per il centro revisioni di un amico — info chiare, prenotazioni facili, mobile-first.","role_en":"Design & Development","role_it":"Design & Sviluppo","stack":["Web","Booking","Local business"],"href":"https://2pcentrorevisioni.com","image":"/case-2p.png"}'::jsonb FROM public.sections WHERE section_key='projects';

-- =========================================================
-- SEED ITEMS: GALLERY
-- =========================================================
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 10, '{"src":"/gallery/lake.jpg","alt_en":"Lake landscape","alt_it":"Paesaggio lacustre","caption_en":"Recharging by the lake","caption_it":"Ricaricarsi al lago","position_x":50,"position_y":50,"scale":1}'::jsonb FROM public.sections WHERE section_key='gallery';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 20, '{"src":"/gallery/concert.jpg","alt_en":"Concert","alt_it":"Concerto","caption_en":"Live music","caption_it":"Musica dal vivo","position_x":50,"position_y":50,"scale":1}'::jsonb FROM public.sections WHERE section_key='gallery';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 30, '{"src":"/gallery/handstand.jpg","alt_en":"Calisthenics handstand","alt_it":"Verticale calisthenics","caption_en":"Daily training","caption_it":"Allenamento quotidiano","position_x":50,"position_y":50,"scale":1}'::jsonb FROM public.sections WHERE section_key='gallery';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 40, '{"src":"/gallery/bbq.jpg","alt_en":"BBQ with friends","alt_it":"BBQ con amici","caption_en":"People matter","caption_it":"Le persone contano","position_x":50,"position_y":50,"scale":1}'::jsonb FROM public.sections WHERE section_key='gallery';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 50, '{"src":"/gallery/heic1.jpg","alt_en":"Travel moment","alt_it":"Momento di viaggio","caption_en":"On the road","caption_it":"In viaggio","position_x":50,"position_y":50,"scale":1}'::jsonb FROM public.sections WHERE section_key='gallery';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 60, '{"src":"/gallery/heic2.jpg","alt_en":"Travel moment","alt_it":"Momento di viaggio","caption_en":"New places","caption_it":"Posti nuovi","position_x":50,"position_y":50,"scale":1}'::jsonb FROM public.sections WHERE section_key='gallery';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 70, '{"src":"/gallery/heic3.jpg","alt_en":"Travel moment","alt_it":"Momento di viaggio","caption_en":"Curiosity","caption_it":"Curiosità","position_x":50,"position_y":50,"scale":1}'::jsonb FROM public.sections WHERE section_key='gallery';

-- =========================================================
-- SEED ITEMS: PASSIONS
-- =========================================================
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 10, '{"icon":"🥾","title_en":"Trekking & Nature","title_it":"Trekking & natura","text_en":"I recharge outdoors. Long walks, mountain trails, the silence of forests.","text_it":"Mi ricarico all''aperto. Lunghe camminate, sentieri di montagna, il silenzio dei boschi."}'::jsonb FROM public.sections WHERE section_key='passions';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 20, '{"icon":"🏃","title_en":"Running & Calisthenics","title_it":"Corsa & calisthenics","text_en":"Training is my daily reset.","text_it":"L''allenamento è il mio reset quotidiano."}'::jsonb FROM public.sections WHERE section_key='passions';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 30, '{"icon":"🌍","title_en":"Travel & New Perspectives","title_it":"Viaggi & nuove prospettive","text_en":"Two Erasmus, three countries, countless trips.","text_it":"Due Erasmus, tre paesi, tanti viaggi."}'::jsonb FROM public.sections WHERE section_key='passions';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 40, '{"icon":"📚","title_en":"Books & Ideas","title_it":"Libri & idee","text_en":"Books are how I slow down and think long-term. Otium Bookshelf was born from this.","text_it":"I libri sono il mio modo di rallentare e pensare nel lungo periodo. Otium Bookshelf nasce da qui."}'::jsonb FROM public.sections WHERE section_key='passions';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 50, '{"icon":"📊","title_en":"Tech × Business","title_it":"Tech × business","text_en":"Fascinated by how innovation reshapes companies and markets.","text_it":"Mi affascina come l''innovazione cambia aziende e mercati."}'::jsonb FROM public.sections WHERE section_key='passions';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 60, '{"icon":"❤️","title_en":"People & Connection","title_it":"Persone & connessioni","text_en":"I''m an emotional, people-first person.","text_it":"Sono emotivo, parto sempre dalle persone."}'::jsonb FROM public.sections WHERE section_key='passions';
INSERT INTO public.section_items (section_id, position, data)
SELECT id, 70, '{"icon":"🌱","title_en":"Passions Yet to Come","title_it":"Passioni ancora da scoprire","text_en":"The next passion will start the moment I discover it.","text_it":"La prossima passione inizierà nel momento in cui la scoprirò."}'::jsonb FROM public.sections WHERE section_key='passions';
