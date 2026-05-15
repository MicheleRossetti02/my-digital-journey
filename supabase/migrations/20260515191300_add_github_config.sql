-- Add github_config column to site_profile for admin-controlled GitHub display
ALTER TABLE public.site_profile
  ADD COLUMN IF NOT EXISTS github_config JSONB NOT NULL
  DEFAULT '{"username":"MicheleRossetti02","pinned":[],"max":6}'::jsonb;
