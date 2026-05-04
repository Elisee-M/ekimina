-- Remove user INSERT on notifications; only edge functions (service role) can create notifications
DROP POLICY IF EXISTS "Users can insert own notifications" ON public.notifications;

-- Make group_members admin policy WITH CHECK explicit to prevent cross-group escalation
DROP POLICY IF EXISTS "Group admins can manage members" ON public.group_members;
CREATE POLICY "Group admins can manage members"
  ON public.group_members
  FOR ALL
  TO authenticated
  USING (is_group_admin(auth.uid(), group_id) OR has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (is_group_admin(auth.uid(), group_id) OR has_role(auth.uid(), 'super_admin'::app_role));