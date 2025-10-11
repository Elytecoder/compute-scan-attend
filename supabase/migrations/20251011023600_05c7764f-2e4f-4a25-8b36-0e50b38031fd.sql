-- Update the program enum to include the correct programs
-- First, we need to alter the existing enum type

-- Add new values to the enum
ALTER TYPE program_type ADD VALUE IF NOT EXISTS 'BSIS';
ALTER TYPE program_type ADD VALUE IF NOT EXISTS 'BTVTED-CSS';

-- Note: We cannot remove enum values directly in PostgreSQL
-- Instead, we'll create a new enum and migrate the data

-- Create new enum with correct values
CREATE TYPE program_type_new AS ENUM ('BSCS', 'BSIT', 'BSIS', 'BTVTED-CSS');

-- Update the members table to use the new enum
-- First, alter the column to text temporarily
ALTER TABLE public.members 
  ALTER COLUMN program TYPE text;

-- Update any existing 'ACT' values to a valid program (you may want to handle this differently)
UPDATE public.members 
SET program = 'BSIT' 
WHERE program = 'ACT';

-- Now change to the new enum type
ALTER TABLE public.members 
  ALTER COLUMN program TYPE program_type_new USING program::program_type_new;

-- Drop the old enum type
DROP TYPE program_type;

-- Rename the new enum type to the original name
ALTER TYPE program_type_new RENAME TO program_type;