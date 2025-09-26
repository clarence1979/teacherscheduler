/*
  # Motion AI Database Schema

  1. New Tables
    - `profiles` - User profiles and preferences
    - `workspaces` - User workspaces for organizing projects
    - `projects` - Projects within workspaces
    - `tasks` - Individual tasks with dependencies
    - `events` - Calendar events and meetings
    - `ai_workflows` - AI employee workflow executions
    - `booking_links` - Meeting booking links
    - `meetings` - Scheduled meetings from booking links

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Ensure proper data isolation between users

  3. Features
    - Task dependencies and relationships
    - Real-time subscriptions for live updates
    - Workspace and project organization
    - AI workflow tracking
    - Meeting scheduling system
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) PRIMARY KEY,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  timezone text DEFAULT 'UTC',
  working_hours jsonb DEFAULT '{"monday":[9,17],"tuesday":[9,17],"wednesday":[9,17],"thursday":[9,17],"friday":[9,17]}',
  preferences jsonb DEFAULT '{"focusTimeBlocks":120,"bufferBetweenTasks":15,"preferredTaskTimes":{"ASAP":"morning","High":"morning","Medium":"afternoon","Low":"anytime"}}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  type text DEFAULT 'individual' CHECK (type IN ('individual', 'team')),
  color text DEFAULT '#007bff',
  settings jsonb DEFAULT '{"defaultSchedule":"Work Hours","autoSchedule":true,"notificationPreferences":{"taskAssigned":true,"deadlineApproaching":true,"projectCompleted":true}}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  status text DEFAULT 'Planning' CHECK (status IN ('Planning', 'In Progress', 'On Hold', 'Completed')),
  priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'ASAP')),
  start_date timestamptz DEFAULT now(),
  due_date timestamptz,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  workspace_id uuid REFERENCES workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text DEFAULT '',
  priority text DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'ASAP')),
  estimated_minutes integer DEFAULT 60,
  actual_minutes integer,
  deadline timestamptz,
  scheduled_time timestamptz,
  end_time timestamptz,
  state text DEFAULT 'To Do' CHECK (state IN ('To Do', 'In Progress', 'Done')),
  task_type text DEFAULT 'general' CHECK (task_type IN ('marking', 'lesson_prep', 'admin', 'communication', 'pastoral', 'extracurricular', 'professional_development', 'conference', 'general')),
  is_flexible boolean DEFAULT true,
  chunkable boolean DEFAULT true,
  min_chunk_minutes integer DEFAULT 15,
  max_chunk_minutes integer,
  dependencies uuid[] DEFAULT '{}',
  happiness_contribution numeric DEFAULT 0.5,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  source text DEFAULT 'manual' CHECK (source IN ('manual', 'booking', 'external', 'task_chunk')),
  external_id text,
  provider text,
  busy boolean DEFAULT true,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Booking links table
CREATE TABLE IF NOT EXISTS booking_links (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  slug text UNIQUE NOT NULL,
  duration integer DEFAULT 60,
  buffer_before integer DEFAULT 15,
  buffer_after integer DEFAULT 15,
  meeting_type text DEFAULT 'video' CHECK (meeting_type IN ('video', 'phone', 'in-person')),
  max_meetings_per_day integer DEFAULT 8,
  advance_notice integer DEFAULT 24,
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{"requireConfirmation":false,"allowRescheduling":true,"sendReminders":true,"collectAttendeeInfo":true}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Meetings table
CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_link_id uuid REFERENCES booking_links(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  attendee_name text NOT NULL,
  attendee_email text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  meeting_link text,
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI workflows table
CREATE TABLE IF NOT EXISTS ai_workflows (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  employee_id text NOT NULL,
  workflow_type text NOT NULL,
  parameters jsonb DEFAULT '{}',
  status text DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'requires_approval')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  result jsonb,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_workflows ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Workspaces policies
CREATE POLICY "Users can manage own workspaces"
  ON workspaces FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Projects policies
CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Tasks policies
CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Events policies
CREATE POLICY "Users can manage own events"
  ON events FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Booking links policies
CREATE POLICY "Users can manage own booking links"
  ON booking_links FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active booking links"
  ON booking_links FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Meetings policies
CREATE POLICY "Users can manage own meetings"
  ON meetings FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can create meetings"
  ON meetings FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- AI workflows policies
CREATE POLICY "Users can manage own AI workflows"
  ON ai_workflows FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_time ON tasks(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_tasks_state ON tasks(state);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_time_range ON events(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX IF NOT EXISTS idx_booking_links_slug ON booking_links(slug);
CREATE INDEX IF NOT EXISTS idx_meetings_booking_link_id ON meetings(booking_link_id);
CREATE INDEX IF NOT EXISTS idx_ai_workflows_user_id ON ai_workflows(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_booking_links_updated_at BEFORE UPDATE ON booking_links FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_meetings_updated_at BEFORE UPDATE ON meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();