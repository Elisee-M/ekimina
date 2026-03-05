
-- Loan votes table for member voting on loan requests
CREATE TABLE public.loan_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES public.loans(id) ON DELETE CASCADE,
  voter_id uuid NOT NULL,
  vote text NOT NULL CHECK (vote IN ('approve', 'reject')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (loan_id, voter_id)
);

ALTER TABLE public.loan_votes ENABLE ROW LEVEL SECURITY;

-- Members can vote on loans in their group
CREATE POLICY "Members can vote on loans in their group"
ON public.loan_votes FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = voter_id
  AND EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_votes.loan_id
    AND is_group_member(auth.uid(), l.group_id)
  )
  AND voter_id != (SELECT borrower_id FROM public.loans WHERE id = loan_votes.loan_id)
);

-- Members can view votes on loans in their group
CREATE POLICY "Members can view votes in their group"
ON public.loan_votes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_votes.loan_id
    AND is_group_member(auth.uid(), l.group_id)
  )
);

-- Group admins and super admins can manage votes
CREATE POLICY "Admins can manage votes"
ON public.loan_votes FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.loans l
    WHERE l.id = loan_votes.loan_id
    AND (is_group_admin(auth.uid(), l.group_id) OR has_role(auth.uid(), 'super_admin'::app_role))
  )
);

-- Add vote_approval_threshold to groups
ALTER TABLE public.ikimina_groups ADD COLUMN IF NOT EXISTS vote_approval_threshold integer NOT NULL DEFAULT 60;

-- Penalty rules table
CREATE TABLE public.penalty_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.ikimina_groups(id) ON DELETE CASCADE,
  penalty_type text NOT NULL DEFAULT 'percentage',
  penalty_value numeric NOT NULL DEFAULT 5,
  grace_period_days integer NOT NULL DEFAULT 7,
  enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id)
);

ALTER TABLE public.penalty_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group admins can manage penalty rules"
ON public.penalty_rules FOR ALL
TO authenticated
USING (is_group_admin(auth.uid(), group_id) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Members can view their group penalty rules"
ON public.penalty_rules FOR SELECT
TO authenticated
USING (is_group_member(auth.uid(), group_id));

-- Penalties table for tracking applied penalties
CREATE TABLE public.penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.ikimina_groups(id) ON DELETE CASCADE,
  member_id uuid NOT NULL,
  contribution_id uuid REFERENCES public.contributions(id) ON DELETE SET NULL,
  amount numeric NOT NULL,
  reason text NOT NULL DEFAULT 'late_contribution',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.penalties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Group admins can manage penalties"
ON public.penalties FOR ALL
TO authenticated
USING (is_group_admin(auth.uid(), group_id) OR has_role(auth.uid(), 'super_admin'::app_role));

CREATE POLICY "Members can view own penalties"
ON public.penalties FOR SELECT
TO authenticated
USING (member_id = auth.uid());
