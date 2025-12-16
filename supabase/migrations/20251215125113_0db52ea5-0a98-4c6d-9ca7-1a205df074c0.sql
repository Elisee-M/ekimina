-- Create app roles enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'group_admin', 'member');

-- Create loan status enum
CREATE TYPE public.loan_status AS ENUM ('pending', 'active', 'completed', 'overdue');

-- Create contribution status enum
CREATE TYPE public.contribution_status AS ENUM ('paid', 'pending', 'late', 'missed');

-- Create user_roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ikimina_groups table
CREATE TABLE public.ikimina_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    contribution_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    contribution_frequency TEXT NOT NULL DEFAULT 'monthly',
    interest_rate NUMERIC(5, 2) NOT NULL DEFAULT 5.00,
    constitution TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create group_members table (links users to groups)
CREATE TABLE public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.ikimina_groups(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,
    joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active',
    UNIQUE (group_id, user_id)
);

-- Create contributions table
CREATE TABLE public.contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.ikimina_groups(id) ON DELETE CASCADE NOT NULL,
    member_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE,
    status contribution_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create loans table
CREATE TABLE public.loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.ikimina_groups(id) ON DELETE CASCADE NOT NULL,
    borrower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    principal_amount NUMERIC(15, 2) NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    total_payable NUMERIC(15, 2) NOT NULL,
    profit NUMERIC(15, 2) NOT NULL,
    duration_months INTEGER NOT NULL DEFAULT 3,
    start_date DATE NOT NULL,
    due_date DATE NOT NULL,
    status loan_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create repayments table
CREATE TABLE public.repayments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID REFERENCES public.loans(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(15, 2) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    recorded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.ikimina_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create announcements table
CREATE TABLE public.announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES public.ikimina_groups(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ikimina_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repayments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Function to check if user is member of a group
CREATE OR REPLACE FUNCTION public.is_group_member(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND status = 'active'
  )
$$;

-- Function to check if user is admin of a group
CREATE OR REPLACE FUNCTION public.is_group_admin(_user_id UUID, _group_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE user_id = _user_id
      AND group_id = _group_id
      AND is_admin = true
      AND status = 'active'
  )
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Group members can view profiles in their group"
ON public.profiles FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.group_members gm1
    JOIN public.group_members gm2 ON gm1.group_id = gm2.group_id
    WHERE gm1.user_id = auth.uid()
      AND gm2.user_id = profiles.id
      AND gm1.status = 'active'
      AND gm2.status = 'active'
  )
);

CREATE POLICY "Super admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

-- RLS Policies for ikimina_groups
CREATE POLICY "Members can view their groups"
ON public.ikimina_groups FOR SELECT
TO authenticated
USING (public.is_group_member(auth.uid(), id));

CREATE POLICY "Super admins can view all groups"
ON public.ikimina_groups FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can manage all groups"
ON public.ikimina_groups FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Group admins can update their group"
ON public.ikimina_groups FOR UPDATE
TO authenticated
USING (public.is_group_admin(auth.uid(), id));

-- RLS Policies for group_members
CREATE POLICY "Members can view members in their group"
ON public.group_members FOR SELECT
TO authenticated
USING (
  public.is_group_member(auth.uid(), group_id)
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Group admins can manage members"
ON public.group_members FOR ALL
TO authenticated
USING (
  public.is_group_admin(auth.uid(), group_id)
  OR public.has_role(auth.uid(), 'super_admin')
);

-- RLS Policies for contributions
CREATE POLICY "Members can view their own contributions"
ON public.contributions FOR SELECT
TO authenticated
USING (member_id = auth.uid());

CREATE POLICY "Group admins can view all contributions in their group"
ON public.contributions FOR SELECT
TO authenticated
USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Super admins can view all contributions"
ON public.contributions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Group admins can manage contributions"
ON public.contributions FOR ALL
TO authenticated
USING (
  public.is_group_admin(auth.uid(), group_id)
  OR public.has_role(auth.uid(), 'super_admin')
);

-- RLS Policies for loans
CREATE POLICY "Borrowers can view their own loans"
ON public.loans FOR SELECT
TO authenticated
USING (borrower_id = auth.uid());

CREATE POLICY "Group admins can view all loans in their group"
ON public.loans FOR SELECT
TO authenticated
USING (public.is_group_admin(auth.uid(), group_id));

CREATE POLICY "Super admins can view all loans"
ON public.loans FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Group admins can manage loans"
ON public.loans FOR ALL
TO authenticated
USING (
  public.is_group_admin(auth.uid(), group_id)
  OR public.has_role(auth.uid(), 'super_admin')
);

-- RLS Policies for repayments
CREATE POLICY "Borrowers can view their loan repayments"
ON public.repayments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.loans
    WHERE loans.id = repayments.loan_id
      AND loans.borrower_id = auth.uid()
  )
);

CREATE POLICY "Group admins can view repayments in their group"
ON public.repayments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.loans
    WHERE loans.id = repayments.loan_id
      AND public.is_group_admin(auth.uid(), loans.group_id)
  )
);

CREATE POLICY "Super admins can view all repayments"
ON public.repayments FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Group admins can manage repayments"
ON public.repayments FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.loans
    WHERE loans.id = repayments.loan_id
      AND (public.is_group_admin(auth.uid(), loans.group_id) OR public.has_role(auth.uid(), 'super_admin'))
  )
);

-- RLS Policies for activity_logs
CREATE POLICY "Group admins can view logs for their group"
ON public.activity_logs FOR SELECT
TO authenticated
USING (
  public.is_group_admin(auth.uid(), group_id)
  OR public.has_role(auth.uid(), 'super_admin')
);

CREATE POLICY "Authenticated users can insert logs"
ON public.activity_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for announcements
CREATE POLICY "Members can view announcements in their group"
ON public.announcements FOR SELECT
TO authenticated
USING (public.is_group_member(auth.uid(), group_id));

CREATE POLICY "Super admins can view all announcements"
ON public.announcements FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Group admins can manage announcements"
ON public.announcements FOR ALL
TO authenticated
USING (
  public.is_group_admin(auth.uid(), group_id)
  OR public.has_role(auth.uid(), 'super_admin')
);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    NEW.email
  );
  
  -- Assign default member role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ikimina_groups_updated_at
  BEFORE UPDATE ON public.ikimina_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_loans_updated_at
  BEFORE UPDATE ON public.loans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX idx_contributions_group_id ON public.contributions(group_id);
CREATE INDEX idx_contributions_member_id ON public.contributions(member_id);
CREATE INDEX idx_loans_group_id ON public.loans(group_id);
CREATE INDEX idx_loans_borrower_id ON public.loans(borrower_id);
CREATE INDEX idx_repayments_loan_id ON public.repayments(loan_id);
CREATE INDEX idx_activity_logs_group_id ON public.activity_logs(group_id);
CREATE INDEX idx_announcements_group_id ON public.announcements(group_id);