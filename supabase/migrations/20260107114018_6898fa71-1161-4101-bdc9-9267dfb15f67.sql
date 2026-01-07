-- Fix RLS policies to be PERMISSIVE instead of RESTRICTIVE
-- This allows members to see their own data

-- Drop and recreate ikimina_groups SELECT policies as PERMISSIVE
DROP POLICY IF EXISTS "Creators can view groups they created" ON public.ikimina_groups;
DROP POLICY IF EXISTS "Members can view their groups" ON public.ikimina_groups;
DROP POLICY IF EXISTS "Super admins can view all groups" ON public.ikimina_groups;

CREATE POLICY "Creators can view groups they created" 
ON public.ikimina_groups 
FOR SELECT 
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "Members can view their groups" 
ON public.ikimina_groups 
FOR SELECT 
TO authenticated
USING (is_group_member(auth.uid(), id));

CREATE POLICY "Super admins can view all groups" 
ON public.ikimina_groups 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix contributions SELECT policies
DROP POLICY IF EXISTS "Members can view their own contributions" ON public.contributions;
DROP POLICY IF EXISTS "Group admins can view all contributions in their group" ON public.contributions;
DROP POLICY IF EXISTS "Super admins can view all contributions" ON public.contributions;

CREATE POLICY "Members can view their own contributions" 
ON public.contributions 
FOR SELECT 
TO authenticated
USING (member_id = auth.uid());

CREATE POLICY "Group admins can view all contributions in their group" 
ON public.contributions 
FOR SELECT 
TO authenticated
USING (is_group_admin(auth.uid(), group_id));

CREATE POLICY "Super admins can view all contributions" 
ON public.contributions 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix loans SELECT policies
DROP POLICY IF EXISTS "Borrowers can view their own loans" ON public.loans;
DROP POLICY IF EXISTS "Group admins can view all loans in their group" ON public.loans;
DROP POLICY IF EXISTS "Super admins can view all loans" ON public.loans;

CREATE POLICY "Borrowers can view their own loans" 
ON public.loans 
FOR SELECT 
TO authenticated
USING (borrower_id = auth.uid());

CREATE POLICY "Group admins can view all loans in their group" 
ON public.loans 
FOR SELECT 
TO authenticated
USING (is_group_admin(auth.uid(), group_id));

CREATE POLICY "Super admins can view all loans" 
ON public.loans 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix repayments SELECT policies
DROP POLICY IF EXISTS "Borrowers can view their loan repayments" ON public.repayments;
DROP POLICY IF EXISTS "Group admins can view repayments in their group" ON public.repayments;
DROP POLICY IF EXISTS "Super admins can view all repayments" ON public.repayments;

CREATE POLICY "Borrowers can view their loan repayments" 
ON public.repayments 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM loans 
  WHERE loans.id = repayments.loan_id 
  AND loans.borrower_id = auth.uid()
));

CREATE POLICY "Group admins can view repayments in their group" 
ON public.repayments 
FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM loans 
  WHERE loans.id = repayments.loan_id 
  AND is_group_admin(auth.uid(), loans.group_id)
));

CREATE POLICY "Super admins can view all repayments" 
ON public.repayments 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Fix announcements SELECT policies
DROP POLICY IF EXISTS "Members can view announcements in their group" ON public.announcements;
DROP POLICY IF EXISTS "Super admins can view all announcements" ON public.announcements;

CREATE POLICY "Members can view announcements in their group" 
ON public.announcements 
FOR SELECT 
TO authenticated
USING (is_group_member(auth.uid(), group_id));

CREATE POLICY "Super admins can view all announcements" 
ON public.announcements 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'super_admin'::app_role));