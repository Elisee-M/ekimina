
-- Allow members to request loans (insert with borrower_id = their own user id, status must be 'pending')
CREATE POLICY "Members can request loans in their group"
ON public.loans
FOR INSERT
TO authenticated
WITH CHECK (
  borrower_id = auth.uid()
  AND status = 'pending'
  AND is_group_member(auth.uid(), group_id)
);
