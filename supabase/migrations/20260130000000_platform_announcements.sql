-- Platform announcements from super admin (eKimina)
-- target_audience: 'admins' = only group admins see it, 'all_members' = all members see it
-- comments_allowed: whether users can comment on this announcement
CREATE TABLE public.platform_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_audience TEXT NOT NULL CHECK (target_audience IN ('admins', 'all_members')),
  comments_allowed BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform announcement comments
CREATE TABLE public.platform_announcement_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_announcement_id UUID NOT NULL REFERENCES public.platform_announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_platform_announcements_created_at ON public.platform_announcements(created_at DESC);
CREATE INDEX idx_platform_announcement_comments_announcement ON public.platform_announcement_comments(platform_announcement_id);

-- RLS
ALTER TABLE public.platform_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_announcement_comments ENABLE ROW LEVEL SECURITY;

-- Function: user is admin of at least one group
CREATE OR REPLACE FUNCTION public.is_any_group_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = _user_id
      AND is_admin = true
      AND status = 'active'
  )
$$;

-- Super admins can do everything on platform_announcements
CREATE POLICY "Super admins manage platform announcements"
ON public.platform_announcements
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'::app_role));

-- Admins see announcements targeted to admins
CREATE POLICY "Admins can view platform announcements for admins"
ON public.platform_announcements
FOR SELECT
USING (
  target_audience = 'admins'
  AND public.is_any_group_admin(auth.uid())
);

-- Group members see announcements targeted to all_members
CREATE POLICY "Members can view platform announcements for all"
ON public.platform_announcements
FOR SELECT
USING (
  target_audience = 'all_members'
  AND EXISTS (
    SELECT 1 FROM public.group_members
    WHERE user_id = auth.uid() AND status = 'active'
  )
);

-- Platform announcement comments: view if user can see the announcement
CREATE POLICY "Users can view platform announcement comments"
ON public.platform_announcement_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.platform_announcements pa
    WHERE pa.id = platform_announcement_comments.platform_announcement_id
    AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR (pa.target_audience = 'admins' AND public.is_any_group_admin(auth.uid()))
      OR (
        pa.target_audience = 'all_members'
        AND EXISTS (SELECT 1 FROM public.group_members WHERE user_id = auth.uid() AND status = 'active')
      )
    )
  )
);

-- Users can add comments only when comments_allowed
CREATE POLICY "Users can create platform announcement comments"
ON public.platform_announcement_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.platform_announcements pa
    WHERE pa.id = platform_announcement_id
    AND pa.comments_allowed = true
    AND (
      public.has_role(auth.uid(), 'super_admin'::app_role)
      OR (pa.target_audience = 'admins' AND public.is_any_group_admin(auth.uid()))
      OR (
        pa.target_audience = 'all_members'
        AND EXISTS (SELECT 1 FROM public.group_members WHERE user_id = auth.uid() AND status = 'active')
      )
    )
  )
);

-- Users can delete own comments
CREATE POLICY "Users can delete own platform comments"
ON public.platform_announcement_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Super admins can delete any comment
CREATE POLICY "Super admins manage platform comments"
ON public.platform_announcement_comments
FOR ALL
USING (public.has_role(auth.uid(), 'super_admin'::app_role));
