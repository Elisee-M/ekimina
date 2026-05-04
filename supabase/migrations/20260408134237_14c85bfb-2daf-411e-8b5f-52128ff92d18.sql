DROP POLICY IF EXISTS "Users can join groups" ON public.group_members;
CREATE POLICY "Users can join groups as members"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND is_admin = false
  AND status = 'active'
);

CREATE POLICY "Creators can add themselves as group admins"
ON public.group_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND is_admin = true
  AND status = 'active'
  AND EXISTS (
    SELECT 1
    FROM public.ikimina_groups g
    WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
  )
);

DROP POLICY IF EXISTS "Users can view public system announcements" ON public.system_announcements;
CREATE POLICY "Authenticated users can view public system announcements"
ON public.system_announcements
FOR SELECT
TO authenticated
USING (audience = 'all');

DROP POLICY IF EXISTS "Admins can view admin-only system announcements" ON public.system_announcements;
CREATE POLICY "Admins can view admin-only system announcements"
ON public.system_announcements
FOR SELECT
TO authenticated
USING (
  audience = 'admins_only'
  AND (
    has_role(auth.uid(), 'super_admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.group_members
      WHERE group_members.user_id = auth.uid()
        AND group_members.is_admin = true
        AND group_members.status = 'active'
    )
  )
);

DROP POLICY IF EXISTS "Super admins can manage system announcements" ON public.system_announcements;
CREATE POLICY "Super admins can manage system announcements"
ON public.system_announcements
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);