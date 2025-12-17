-- Allow group creators to read the group immediately after creation (needed for INSERT ... RETURNING)
CREATE POLICY "Creators can view groups they created"
ON public.ikimina_groups
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);