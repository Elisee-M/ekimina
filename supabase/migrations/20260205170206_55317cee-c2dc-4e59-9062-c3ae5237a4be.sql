-- 1. Create security definer function to get own roles (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_roles()
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
$$;

-- 2. Create security definer function to get own group membership (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_group_membership()
RETURNS TABLE(group_id uuid, is_admin boolean, status text, group_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gm.group_id, gm.is_admin, gm.status, ig.name
  FROM public.group_members gm
  JOIN public.ikimina_groups ig ON ig.id = gm.group_id
  WHERE gm.user_id = auth.uid() AND gm.status = 'active'
$$;