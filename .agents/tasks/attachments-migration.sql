-- Migration: Add attachments table for issue file attachments
-- This table stores metadata about files uploaded to Supabase Storage

CREATE TABLE IF NOT EXISTS attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  size INTEGER NOT NULL,
  mime_type TEXT,
  storage_path TEXT NOT NULL,
  url TEXT,
  uploaded_by UUID REFERENCES users(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attachments_issue_id ON attachments(issue_id);

-- Enable RLS
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read attachments for issues in projects they have access to
CREATE POLICY attachments_select_policy ON attachments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM issues i
      JOIN project_members pm ON pm.project_id = i.project_id
      WHERE i.id = attachments.issue_id
        AND pm.user_id = auth.uid()
    )
  );

-- RLS Policy: Users with member/admin/owner role can insert attachments
CREATE POLICY attachments_insert_policy ON attachments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM issues i
      JOIN project_members pm ON pm.project_id = i.project_id
      WHERE i.id = attachments.issue_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('member', 'admin', 'owner')
    )
  );

-- RLS Policy: Users can delete their own attachments, or admins/owners can delete any
CREATE POLICY attachments_delete_policy ON attachments
  FOR DELETE
  USING (
    uploaded_by = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM issues i
      JOIN project_members pm ON pm.project_id = i.project_id
      WHERE i.id = attachments.issue_id
        AND pm.user_id = auth.uid()
        AND pm.role IN ('admin', 'owner')
    )
  );
