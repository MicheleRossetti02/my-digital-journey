-- Contact messages
CREATE TABLE public.contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NOT NULL DEFAULT '',
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages FOR INSERT TO anon, authenticated
WITH CHECK (
  length(name) BETWEEN 1 AND 200
  AND length(email) BETWEEN 3 AND 320
  AND length(subject) <= 300
  AND length(message) BETWEEN 1 AND 5000
);

CREATE POLICY "Admins can read messages"
ON public.contact_messages FOR SELECT TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update messages"
ON public.contact_messages FOR UPDATE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete messages"
ON public.contact_messages FOR DELETE TO authenticated
USING (public.is_admin(auth.uid()));

CREATE INDEX idx_contact_messages_created ON public.contact_messages (created_at DESC);
