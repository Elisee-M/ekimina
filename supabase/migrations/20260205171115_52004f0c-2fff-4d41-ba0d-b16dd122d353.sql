-- Create system announcements table for super admin broadcasts
CREATE TABLE public.system_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  audience text NOT NULL DEFAULT 'all' CHECK (audience IN ('all', 'admins_only')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;

-- Super admins can manage all system announcements
CREATE POLICY "Super admins can manage system announcements"
ON public.system_announcements
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- All authenticated users can view 'all' audience announcements
CREATE POLICY "Users can view public system announcements"
ON public.system_announcements
FOR SELECT
USING (audience = 'all');

-- Group admins can view 'admins_only' announcements
CREATE POLICY "Admins can view admin-only system announcements"
ON public.system_announcements
FOR SELECT
USING (
  audience = 'admins_only' 
  AND (
    has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE user_id = auth.uid() 
      AND is_admin = true 
      AND status = 'active'
    )
  )
);