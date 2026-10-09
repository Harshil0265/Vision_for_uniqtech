-- Supabase Database Schema for Vision Project Management System
-- This schema includes all tables, relationships, and Row Level Security (RLS) policies

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- USERS TABLE
-- =====================================================
-- Stores user profiles synced from Clerk authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_genera/*  */te_v4(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar TEXT,
  role TEXT,
  department TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROJECTS TABLE
-- =====================================================
-- Stores project information
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  key TEXT UNIQUE NOT NULL,
  description TEXT,
  lead_user_id UUID REFERENCES users(id),
  template TEXT,
  allowed_issue_types JSONB DEFAULT '[]'::jsonb,
  default_assignee TEXT,
  icon_gradient TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PROJECT_MEMBERS TABLE
-- =====================================================
-- Stores project membership and roles
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(project_id, user_id)
);

-- =====================================================
-- ISSUES TABLE
-- =====================================================
-- Stores project issues/tickets
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT,
  priority TEXT,
  status TEXT,
  assignee_id UUID REFERENCES users(id),
  reporter_id UUID REFERENCES users(id),
  sprint_id UUID,
  story_points INTEGER,
  labels JSONB DEFAULT '[]'::jsonb,
  subtasks JSONB DEFAULT '[]'::jsonb,
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SPRINTS TABLE
-- =====================================================
-- Stores sprint information for agile project management
CREATE TABLE IF NOT EXISTS sprints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT,
  completed_at TIMESTAMPTZ,
  planned_points INTEGER,
  completed_points INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMENTS TABLE
-- =====================================================
-- Stores comments on issues
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  mentions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INVITATION_TOKENS TABLE
-- =====================================================
-- Stores pending invitations for users who don't have accounts yet
CREATE TABLE IF NOT EXISTS invitation_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitation_tokens ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- USERS TABLE POLICIES
-- -----------------------------------------------------
-- Users can view all other users (team directory functionality)
CREATE POLICY "users_select_policy" ON users
  FOR SELECT
  USING (true);

-- Users can insert their own profile when first signing up
CREATE POLICY "users_insert_policy" ON users
  FOR INSERT
  WITH CHECK (auth.uid()::text = clerk_user_id);

-- Users can update their own profile
CREATE POLICY "users_update_policy" ON users
  FOR UPDATE
  USING (auth.uid()::text = clerk_user_id);

-- -----------------------------------------------------
-- PROJECTS TABLE POLICIES
-- -----------------------------------------------------
-- Users can view projects where they are the lead OR they are a member
CREATE POLICY "projects_select_policy" ON projects
  FOR SELECT
  USING (
    lead_user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    OR EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Authenticated users can create projects
CREATE POLICY "projects_insert_policy" ON projects
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Only project owners can update projects
CREATE POLICY "projects_update_policy" ON projects
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
        AND project_members.role = 'owner'
    )
  );

-- Only project owners can delete projects
CREATE POLICY "projects_delete_policy" ON projects
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = projects.id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
        AND project_members.role = 'owner'
    )
  );

-- -----------------------------------------------------
-- PROJECT_MEMBERS TABLE POLICIES
-- -----------------------------------------------------
-- Users can view members of projects they have access to
CREATE POLICY "project_members_select_policy" ON project_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members AS pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Project admins and owners can invite new members
CREATE POLICY "project_members_insert_policy" ON project_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members AS pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
        AND pm.role IN ('owner', 'admin')
    )
  );

-- Project owners and admins can remove members
CREATE POLICY "project_members_delete_policy" ON project_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members AS pm
      WHERE pm.project_id = project_members.project_id
        AND pm.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
        AND pm.role IN ('owner', 'admin')
    )
  );

-- -----------------------------------------------------
-- ISSUES TABLE POLICIES
-- -----------------------------------------------------
-- Users can view issues from projects they are members of
CREATE POLICY "issues_select_policy" ON issues
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issues.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Users can create issues in projects they are members of
CREATE POLICY "issues_insert_policy" ON issues
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issues.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Users can update issues in projects they are members of
CREATE POLICY "issues_update_policy" ON issues
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issues.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Users can delete issues in projects they are members of
CREATE POLICY "issues_delete_policy" ON issues
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = issues.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- -----------------------------------------------------
-- SPRINTS TABLE POLICIES
-- -----------------------------------------------------
-- Users can view sprints from projects they are members of
CREATE POLICY "sprints_select_policy" ON sprints
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = sprints.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Users can create sprints in projects they are members of
CREATE POLICY "sprints_insert_policy" ON sprints
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = sprints.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Users can update sprints in projects they are members of
CREATE POLICY "sprints_update_policy" ON sprints
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = sprints.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Users can delete sprints in projects they are members of
CREATE POLICY "sprints_delete_policy" ON sprints
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = sprints.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- -----------------------------------------------------
-- COMMENTS TABLE POLICIES
-- -----------------------------------------------------
-- Users can view comments on issues from projects they are members of
CREATE POLICY "comments_select_policy" ON comments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM issues
      JOIN project_members ON project_members.project_id = issues.project_id
      WHERE issues.id = comments.issue_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Users can create comments on issues from projects they are members of
CREATE POLICY "comments_insert_policy" ON comments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM issues
      JOIN project_members ON project_members.project_id = issues.project_id
      WHERE issues.id = comments.issue_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    )
  );

-- Users can update their own comments
CREATE POLICY "comments_update_policy" ON comments
  FOR UPDATE
  USING (author_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));

-- Users can delete their own comments
CREATE POLICY "comments_delete_policy" ON comments
  FOR DELETE
  USING (author_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text));

-- -----------------------------------------------------
-- INVITATION_TOKENS TABLE POLICIES
-- -----------------------------------------------------
-- Users can view invitations sent to their email
CREATE POLICY "invitation_tokens_select_policy" ON invitation_tokens
  FOR SELECT
  USING (
    email = (SELECT email FROM users WHERE clerk_user_id = auth.uid()::text)
    OR invited_by = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
  );

-- Project admins/owners can create invitation tokens
CREATE POLICY "invitation_tokens_insert_policy" ON invitation_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = invitation_tokens.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
        AND project_members.role IN ('owner', 'admin')
    )
  );

-- System can update invitation tokens (mark as accepted)
CREATE POLICY "invitation_tokens_update_policy" ON invitation_tokens
  FOR UPDATE
  USING (true);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON users(clerk_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_projects_key ON projects(key);
CREATE INDEX IF NOT EXISTS idx_projects_lead_user_id ON projects(lead_user_id);
CREATE INDEX IF NOT EXISTS idx_project_members_project_id ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user_id ON project_members(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_project_id ON issues(project_id);
CREATE INDEX IF NOT EXISTS idx_issues_key ON issues(key);
CREATE INDEX IF NOT EXISTS idx_issues_assignee_id ON issues(assignee_id);
CREATE INDEX IF NOT EXISTS idx_issues_sprint_id ON issues(sprint_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project_id ON sprints(project_id);
CREATE INDEX IF NOT EXISTS idx_comments_issue_id ON comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_token ON invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_email ON invitation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_project_id ON invitation_tokens(project_id);


-- =====================================================
-- INVITATION_TOKENS TABLE
-- =====================================================
-- Stores pending invitations for users who haven't signed up yet
CREATE TABLE IF NOT EXISTS invitation_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'viewer')),
  token TEXT UNIQUE NOT NULL,
  invited_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ
);

-- Enable RLS on invitation_tokens
ALTER TABLE invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view invitations they sent
CREATE POLICY "invitation_tokens_select_policy" ON invitation_tokens
  FOR SELECT
  USING (
    invited_by = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
    OR email = (SELECT email FROM users WHERE clerk_user_id = auth.uid()::text)
  );

-- Only the invited user can accept their invitation (update accepted_at)
CREATE POLICY "invitation_tokens_update_policy" ON invitation_tokens
  FOR UPDATE
  USING (email = (SELECT email FROM users WHERE clerk_user_id = auth.uid()::text));

-- Project admins and owners can create invitation tokens
CREATE POLICY "invitation_tokens_insert_policy" ON invitation_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = invitation_tokens.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
        AND project_members.role IN ('owner', 'admin')
    )
  );

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_email ON invitation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_token ON invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_project_id ON invitation_tokens(project_id);
