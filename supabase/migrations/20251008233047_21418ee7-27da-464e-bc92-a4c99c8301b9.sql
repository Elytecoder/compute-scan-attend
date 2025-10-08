-- Add session type enum
CREATE TYPE public.session_type AS ENUM ('morning', 'afternoon');

-- Add session column to attendance table
ALTER TABLE public.attendance 
ADD COLUMN session public.session_type NOT NULL DEFAULT 'morning';

-- Create unique constraint to prevent multiple time-ins for same session
CREATE UNIQUE INDEX attendance_member_event_session_active_idx 
ON public.attendance (member_id, event_id, session) 
WHERE time_out IS NULL;