-- Create enum for programs
CREATE TYPE program_type AS ENUM ('BSIT', 'BSCS', 'ACT');

-- Create members table
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  program program_type NOT NULL,
  block TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  time_in TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  time_out TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, member_id, time_in)
);

-- Create user roles table for officers
CREATE TYPE user_role AS ENUM ('admin', 'officer');

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'officer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- RLS Policies for members
CREATE POLICY "Officers can view all members"
  ON members FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'officer') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can insert members"
  ON members FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'officer') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can update members"
  ON members FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'officer') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for events
CREATE POLICY "Officers can view all events"
  ON events FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'officer') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can create events"
  ON events FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'officer') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can update events"
  ON events FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'officer') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can delete events"
  ON events FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for attendance
CREATE POLICY "Officers can view all attendance"
  ON attendance FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'officer') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can insert attendance"
  ON attendance FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'officer') OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Officers can update attendance"
  ON attendance FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'officer') OR has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
  ON user_roles FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger for auto-creating profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Create indexes for better performance
CREATE INDEX idx_members_school_id ON members(school_id);
CREATE INDEX idx_members_program ON members(program);
CREATE INDEX idx_members_block ON members(block);
CREATE INDEX idx_attendance_event_id ON attendance(event_id);
CREATE INDEX idx_attendance_member_id ON attendance(member_id);
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);