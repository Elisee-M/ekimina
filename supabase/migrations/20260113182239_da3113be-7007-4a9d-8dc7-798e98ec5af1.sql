-- Create a secure RPC function to find groups where user was previously a member
-- This allows users to discover their old groups without full table access
CREATE OR REPLACE FUNCTION public.get_user_previous_groups(_user_id uuid)
RETURNS TABLE(
  group_id uuid,
  group_name text,
  status text,
  joined_at timestamptz,
  is_admin boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    gm.group_id,
    ig.name as group_name,
    gm.status,
    gm.joined_at,
    gm.is_admin
  FROM public.group_members gm
  JOIN public.ikimina_groups ig ON ig.id = gm.group_id
  WHERE gm.user_id = _user_id
    AND gm.status IN ('inactive', 'removed', 'pending_rejoin')
$$;

-- Create a function to request rejoining a group (sets status to pending_rejoin)
CREATE OR REPLACE FUNCTION public.request_rejoin_group(_group_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _existing_status text;
BEGIN
  -- Check if user has an existing membership record for this group
  SELECT status INTO _existing_status
  FROM public.group_members
  WHERE group_id = _group_id AND user_id = _user_id;
  
  IF _existing_status IS NULL THEN
    -- No previous membership, cannot request rejoin this way
    RETURN false;
  END IF;
  
  IF _existing_status = 'active' THEN
    -- Already active
    RETURN false;
  END IF;
  
  IF _existing_status = 'pending_rejoin' THEN
    -- Already pending
    RETURN true;
  END IF;
  
  -- Update status to pending_rejoin
  UPDATE public.group_members
  SET status = 'pending_rejoin'
  WHERE group_id = _group_id AND user_id = _user_id;
  
  RETURN true;
END;
$$;