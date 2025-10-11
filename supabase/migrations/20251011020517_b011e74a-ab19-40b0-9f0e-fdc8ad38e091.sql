-- Add DELETE policies for attendance and members tables
-- These policies ensure only admins can delete records, preventing unauthorized data tampering

-- Add DELETE policy for attendance table
CREATE POLICY "Only admins can delete attendance"
ON public.attendance
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Add DELETE policy for members table
CREATE POLICY "Only admins can delete members"
ON public.members
FOR DELETE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Update the handle_new_user trigger to automatically assign officer role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Create profile
  INSERT INTO profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  
  -- Assign default officer role to new users
  INSERT INTO user_roles (user_id, role)
  VALUES (NEW.id, 'officer'::user_role);
  
  RETURN NEW;
END;
$$;