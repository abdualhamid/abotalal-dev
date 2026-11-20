CREATE OR REPLACE FUNCTION public.get_support_admin_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT user_id FROM public.user_roles
  WHERE role = 'admin'::public.app_role AND auth.uid() IS NOT NULL
  ORDER BY created_at, user_id LIMIT 1
$$;
REVOKE ALL ON FUNCTION public.get_support_admin_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_support_admin_id() TO authenticated, service_role;