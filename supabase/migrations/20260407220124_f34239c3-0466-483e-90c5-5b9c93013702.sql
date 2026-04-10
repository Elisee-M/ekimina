
-- Fix 1: Notifications - remove overly permissive INSERT, restrict to own user_id
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert own notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Fix 2: User roles - restrict self-insert to 'member' only (prevent group_admin self-escalation)
DROP POLICY IF EXISTS "Users can add own member role" ON public.user_roles;
CREATE POLICY "Users can add own member role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND (role = 'member'::app_role));

-- Fix 3: Announcement comments - change policies from {public} to {authenticated}
DROP POLICY IF EXISTS "Group admins can manage comments" ON public.announcement_comments;
CREATE POLICY "Group admins can manage comments"
  ON public.announcement_comments FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM announcements a
    WHERE a.id = announcement_comments.announcement_id
    AND (is_group_admin(auth.uid(), a.group_id) OR has_role(auth.uid(), 'super_admin'::app_role))
  ));

DROP POLICY IF EXISTS "Members can create comments" ON public.announcement_comments;
CREATE POLICY "Members can create comments"
  ON public.announcement_comments FOR INSERT
  TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND (EXISTS (
    SELECT 1 FROM announcements a
    WHERE a.id = announcement_comments.announcement_id
    AND is_group_member(auth.uid(), a.group_id)
  )));

DROP POLICY IF EXISTS "Members can view comments in their group" ON public.announcement_comments;
CREATE POLICY "Members can view comments in their group"
  ON public.announcement_comments FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM announcements a
    WHERE a.id = announcement_comments.announcement_id
    AND is_group_member(auth.uid(), a.group_id)
  ));

DROP POLICY IF EXISTS "Super admins can view all comments" ON public.announcement_comments;
CREATE POLICY "Super admins can view all comments"
  ON public.announcement_comments FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Users can delete own comments" ON public.announcement_comments;
CREATE POLICY "Users can delete own comments"
  ON public.announcement_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
