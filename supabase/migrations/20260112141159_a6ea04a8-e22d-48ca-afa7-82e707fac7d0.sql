-- Create announcement_comments table
CREATE TABLE public.announcement_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcement_comments ENABLE ROW LEVEL SECURITY;

-- Members can view comments on announcements in their group
CREATE POLICY "Members can view comments in their group"
ON public.announcement_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = announcement_comments.announcement_id
    AND is_group_member(auth.uid(), a.group_id)
  )
);

-- Members can create comments on announcements in their group
CREATE POLICY "Members can create comments"
ON public.announcement_comments
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = announcement_comments.announcement_id
    AND is_group_member(auth.uid(), a.group_id)
  )
);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.announcement_comments
FOR DELETE
USING (auth.uid() = user_id);

-- Group admins can delete any comment in their group
CREATE POLICY "Group admins can manage comments"
ON public.announcement_comments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.announcements a
    WHERE a.id = announcement_comments.announcement_id
    AND (is_group_admin(auth.uid(), a.group_id) OR has_role(auth.uid(), 'super_admin'::app_role))
  )
);

-- Super admins can view all comments
CREATE POLICY "Super admins can view all comments"
ON public.announcement_comments
FOR SELECT
USING (has_role(auth.uid(), 'super_admin'::app_role));