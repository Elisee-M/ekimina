-- SECURITY: Provide a controlled way for authenticated users to lookup a group by its UUID
-- without granting broad SELECT access to the entire ikimina_groups table.

CREATE OR REPLACE FUNCTION public.get_group_by_id(_id uuid)
RETURNS TABLE (id uuid, name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT g.id, g.name
  FROM public.ikimina_groups g
  WHERE g.id = _id
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_group_by_id(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_group_by_id(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_group_by_id(uuid) TO authenticated;