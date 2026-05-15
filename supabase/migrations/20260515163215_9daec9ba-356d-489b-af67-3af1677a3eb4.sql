
-- is_admin must be callable by authenticated for RLS policies that use it
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;
