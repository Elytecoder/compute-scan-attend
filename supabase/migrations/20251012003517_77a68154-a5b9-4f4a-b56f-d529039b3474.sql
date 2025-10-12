-- Add year_level column to members table
ALTER TABLE public.members
ADD COLUMN year_level INTEGER NOT NULL DEFAULT 1;