-- Analytics tables for portfolio
create table if not exists analytics_sessions (
  id text primary key,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_ms integer,
  referrer text,
  device text,
  language text,
  screen_width integer
);

create table if not exists analytics_section_views (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  section_key text not null,
  duration_ms integer not null,
  viewed_at timestamptz not null default now()
);

create table if not exists analytics_clicks (
  id uuid primary key default gen_random_uuid(),
  session_id text not null,
  section_key text not null,
  x_pct numeric not null,
  y_pct numeric not null,
  target_tag text,
  clicked_at timestamptz not null default now()
);

-- Indexes for common query patterns
create index if not exists idx_sessions_started_at on analytics_sessions(started_at);
create index if not exists idx_section_views_session on analytics_section_views(session_id);
create index if not exists idx_section_views_key on analytics_section_views(section_key);
create index if not exists idx_section_views_viewed_at on analytics_section_views(viewed_at);
create index if not exists idx_clicks_section on analytics_clicks(section_key);
create index if not exists idx_clicks_at on analytics_clicks(clicked_at);

-- RLS: enabled but no anon policies (service role bypasses RLS)
alter table analytics_sessions enable row level security;
alter table analytics_section_views enable row level security;
alter table analytics_clicks enable row level security;

-- Foreign keys (idempotent)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'analytics_section_views_session_id_fkey'
  ) then
    alter table analytics_section_views
      add constraint analytics_section_views_session_id_fkey
      foreign key (session_id) references analytics_sessions(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'analytics_clicks_session_id_fkey'
  ) then
    alter table analytics_clicks
      add constraint analytics_clicks_session_id_fkey
      foreign key (session_id) references analytics_sessions(id) on delete cascade;
  end if;
end $$;
