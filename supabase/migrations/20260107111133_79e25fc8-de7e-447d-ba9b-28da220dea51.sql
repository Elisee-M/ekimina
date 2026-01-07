-- Add status column to ikimina_groups for enabling/disabling groups
ALTER TABLE public.ikimina_groups 
ADD COLUMN status text NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'disabled'));