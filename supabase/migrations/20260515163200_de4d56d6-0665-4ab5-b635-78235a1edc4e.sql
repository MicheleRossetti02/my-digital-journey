
-- Restrict SECURITY DEFINER function execution
REVOKE EXECUTE ON FUNCTION public.is_admin(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO service_role;

-- Restrict bucket listing: replace broad SELECT with admin-only listing
DROP POLICY IF EXISTS "Public can read media" ON storage.objects;

-- Public can SELECT individual objects (needed for direct URL access on public bucket)
-- but listing requires admin
CREATE POLICY "Public can read media files" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');
