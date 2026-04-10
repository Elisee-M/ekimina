-- Fix 1: activity_logs - add group membership check to INSERT policy
DROP POLICY IF EXISTS "Authenticated users can insert logs" ON public.activity_logs;
CREATE POLICY "Authenticated users can insert logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND (group_id IS NULL OR is_group_member(auth.uid(), group_id))
  );

-- Fix 2: Remove redundant self-insert policy on user_roles
-- The handle_new_user trigger (SECURITY DEFINER) already assigns the member role
DROP POLICY IF EXISTS "Users can add own member role" ON public.user_roles;