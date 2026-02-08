-- Drop and recreate get_my_group_membership to include group status
DROP FUNCTION IF EXISTS public.get_my_group_membership();

CREATE FUNCTION public.get_my_group_membership()
 RETURNS TABLE(group_id uuid, is_admin boolean, status text, group_name text, group_status text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT gm.group_id, gm.is_admin, gm.status, ig.name, ig.status as group_status
  FROM public.group_members gm
  JOIN public.ikimina_groups ig ON ig.id = gm.group_id
  WHERE gm.user_id = auth.uid() AND gm.status = 'active'
$function$;