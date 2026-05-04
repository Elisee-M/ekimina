DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

DROP POLICY IF EXISTS "Super admins can read contact messages" ON public.contact_messages;
CREATE POLICY "Super admins can read contact messages"
ON public.contact_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can update contact messages" ON public.contact_messages;
CREATE POLICY "Super admins can update contact messages"
ON public.contact_messages
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));