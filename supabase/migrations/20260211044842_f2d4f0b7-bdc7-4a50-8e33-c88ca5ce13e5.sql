
-- Add plan column to ikimina_groups
ALTER TABLE public.ikimina_groups 
ADD COLUMN plan text NOT NULL DEFAULT 'starter';

-- Add payment_confirmed_at and payment_confirmed_by columns
ALTER TABLE public.ikimina_groups 
ADD COLUMN payment_confirmed_at timestamptz,
ADD COLUMN payment_confirmed_by uuid;
