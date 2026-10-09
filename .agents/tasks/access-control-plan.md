# Implementation Plan: Project-Level Access Control & User Invitation System

## Overview
Implement a complete project-level access control system for the Vision project management app by adding Supabase backend while maintaining Clerk authentication and graceful localStorage fallback for development.

## Architecture Decisions

### Database Choice: Supabase PostgreSQL
- **Rationale**: Supabase provides PostgreSQL with built-in Row Level Security (RLS), real-time subscriptions, and REST API generation. Perfect for multi-tenant project access control where users should only see their own projects.
- **Integration**: @supabase/supabase-js client library, no migration from Clerk (Clerk stays for auth, Supabase for data).

### Access Control Model: Role-Based (RBAC)
- **Roles**: Owner (creator, full control) → Admin (manage team) → Member (create/edit content) → Viewer (read-only)
- **Enforcement**: Backend via RLS policies (database-level), frontend via permission utility functions (UI-level).
- **Storage**: project_members join table with role column.

### Fallback Strategy
- **When**: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY missing from environment.
- **Behavior**: ProjectContext checks `isSupabaseConfigured` flag. If false, falls back to localStorage + mockData loading. All features work in degraded mode for local development.
- **Implementation**: Wrap all API calls in try-catch, on error revert to localStorage operations.

---

## Feature Breakdown (FEAT-001 through FEAT-004)

This plan has been decomposed into 4 features for sequential implementation. See individual FEAT-NNN.json files in .agents/tasks/task-access-control/features/ for detailed steps.

### FEAT-001: Supabase Integration & Database Schema
**Files**: 
- src/lib/supabase.ts (new)
- .agents/tasks/supabase-schema.sql (new)
- .agents/tasks/setup-instructions.md (new)
- .env.example (modify)
- package.json (add dependency)

**What**: Install Supabase client, define complete database schema with users, projects, project_members, issues, sprints, comments tables. Implement Row Level Security policies. Create migration SQL and setup docs.

**Verification**: `npm run build` succeeds, supabase-schema.sql is syntactically valid.

---

### FEAT-002: Backend API Endpoints
**Files**:
- server.ts (extensive modifications)

**What**: Implement 15+ REST endpoints for project CRUD, member invitations, issue/sprint/comment operations. Integrate Supabase client in server.ts using SUPABASE_SERVICE_KEY for admin operations. Use existing @clerk/express requireAuth middleware to verify JWT. Auto-upsert Clerk users into Supabase users table on first auth.

**Endpoints**:
- POST /api/projects (create + auto-add creator as owner)
- GET /api/projects (user's accessible projects only)
- POST /api/projects/:id/invite (email + role)
- GET /api/projects/:id/members
- DELETE /api/projects/:id/members/:userId
- PATCH /api/projects/:id/members/:userId (change role)
- GET /api/projects/:id/issues
- POST /api/projects/:id/issues
- PATCH /api/issues/:issueId
- DELETE /api/issues/:issueId
- GET /api/projects/:id/sprints
- POST /api/projects/:id/sprints
- POST /api/projects/:id/issues/:issueId/comments

**Verification**: `npm run build`, start dev server, test endpoints via curl/Postman with Clerk token.

---

### FEAT-003: Frontend State Management & UI
**Files**:
- src/context/ProjectContext.tsx (major refactor)
- src/types/index.ts (add ProjectMember, ProjectRole types)
- src/utils/permissions.ts (new)
- src/components/InviteMemberModal.tsx (new)
- src/components/ProjectsView.tsx (modify)
- src/components/HomePage.tsx (modify)

**What**: Replace localStorage-first loading with API-first (when configured). Add fetchUserProjects(), inviteMember(), removeMember() functions to context. Create permission utility with canInviteMembers, canEditIssue, etc. Build InviteMemberModal component for team management. Update ProjectsView to show Invite button and member count. Update HomePage to show welcome screen for new users with no projects.

**Verification**: `npm run build`, `npm run dev`. Test with Supabase env vars: new user sees empty state. Test without env vars: localStorage fallback works.

---

### FEAT-004: Permission Gates Throughout UI
**Files**:
- src/components/KanbanBoard.tsx (modify)
- src/components/BacklogView.tsx (modify)
- src/components/IssueDetailModal.tsx (modify)
- src/components/CreateIssueModal.tsx (modify)
- src/components/Navbar.tsx (modify)
- src/components/Sidebar.tsx (verify)
- src/utils/permissions.ts (add getUserRoleInProject helper)

**What**: Apply role-based restrictions to all UI actions. Viewers cannot edit anything. Members can manage issues but not team. Admins can invite/remove members. Owners can delete projects. Disable/hide buttons, show permission tooltips, add role badges.

**Verification**: `npm run build`, manual testing with multiple users of different roles. Create project as owner, invite viewer, verify viewer cannot edit. Invite member, verify member can create issues but not invite others.

---

## Implementation Order & Dependencies

1. **FEAT-001** (Supabase setup) - No dependencies, foundational
2. **FEAT-002** (Backend APIs) - Depends on FEAT-001 (needs Supabase client)
3. **FEAT-003** (Frontend state) - Depends on FEAT-002 (needs API endpoints)
4. **FEAT-004** (Permission gates) - Depends on FEAT-003 (needs permission utils and member data)

Sequential execution required - each feature builds on the previous.

---

## TypeScript Type Additions

```typescript
// src/types/index.ts additions

export type ProjectRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface ProjectMember {
  id: string;
  userId: string;
  projectId: string;
  user: User;
  role: ProjectRole;
  invitedBy?: string;
  invitedAt: string;
}

// Update existing Project interface
export interface Project {
  id: string;
  name: string;
  key: string;
  description: string;
  lead: User;
  template: 'Scrum' | 'Kanban' | 'Bug Tracking';
  allowedIssueTypes: WorkItemType[];
  defaultAssignee: 'unassigned' | 'lead';
  iconGradient: string;
  createdAt: string;
  members?: ProjectMember[]; // NEW
}
```

---

## Database Schema Summary

**users**: id (uuid), clerk_user_id (text unique), email, name, avatar, role, department, created_at

**projects**: id (uuid), name, key (unique), description, lead_user_id (fk users), template, allowed_issue_types (jsonb), default_assignee, icon_gradient, created_at

**project_members**: id (uuid), project_id (fk projects cascade), user_id (fk users cascade), role (owner/admin/member/viewer), invited_by (fk users), invited_at, unique(project_id, user_id)

**issues**: id (uuid), project_id (fk projects cascade), key (unique), title, description, type, priority, status, assignee_id (fk users), reporter_id (fk users), sprint_id (uuid), story_points, labels (jsonb), subtasks (jsonb), due_date, created_at, updated_at

**sprints**: id (uuid), project_id (fk projects cascade), name, goal, start_date, end_date, status, completed_at, planned_points, completed_points

**comments**: id (uuid), issue_id (fk issues cascade), author_id (fk users), content, mentions (jsonb), created_at

**RLS Policies**:
- users: all authenticated can SELECT (team directory)
- projects: SELECT where user is lead OR in project_members; INSERT by authenticated; UPDATE/DELETE by owners only
- project_members: SELECT where user can see project; INSERT by admins/owners; DELETE by admins/owners
- issues/sprints/comments: all operations only if user in project_members of parent project

---

## API Endpoint Contracts

### POST /api/projects
**Request**: 
```json
{
  "name": "New Project",
  "key": "NP",
  "description": "...",
  "template": "Scrum",
  "allowedIssueTypes": ["story", "bug"],
  "defaultAssignee": "unassigned",
  "iconGradient": "from-blue-600..."
}
```
**Response**: 
```json
{
  "id": "uuid",
  "name": "New Project",
  "key": "NP",
  "lead": { user object },
  "members": [{ user object with role: "owner" }],
  ...
}
```

### GET /api/projects
**Request**: Headers: `Authorization: Bearer <clerk-jwt>`
**Response**: 
```json
[
  {
    "id": "uuid",
    "name": "Project A",
    "members": [{ id, userId, user, role, invitedAt }],
    ...
  }
]
```

### POST /api/projects/:id/invite
**Request**:
```json
{
  "email": "user@example.com",
  "role": "member"
}
```
**Response**:
```json
{
  "success": true,
  "member": { id, userId, user, role, invitedAt }
}
```

### Other endpoints follow REST conventions: GET returns data, POST creates, PATCH updates, DELETE removes.

---

## Environment Variables

Add to .env (not committed):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

Add to .env.example (committed):
```
# Supabase (optional - app falls back to localStorage if not configured)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Server also needs (for admin operations):
```
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc... (service_role key, not anon key)
```

---

## Testing Strategy

### Build Verification
- Run `npm run build` after each feature
- Run `npm run lint` (tsc --noEmit) to catch type errors

### Manual Testing Checklist (FEAT-004)
1. **New User Flow**: Sign up with Clerk → See empty projects list + Create Project button
2. **Project Creation**: Create project → Verify saved via API (Network tab)
3. **Owner Permissions**: All features accessible
4. **Invite Viewer**: Invite user as viewer → Sign in as viewer → Verify cannot create/edit
5. **Invite Member**: Invite as member → Verify can create issues but not invite others
6. **Invite Admin**: Invite as admin → Verify can manage team
7. **Fallback Mode**: Remove Supabase env vars → App still works via localStorage

### No Automated Tests
- No test framework exists in package.json
- All verification is manual + build checks

---

## Risks & Mitigations

**Risk**: Supabase RLS policies too restrictive, block legitimate operations
**Mitigation**: Use service_role key on server-side for admin operations, test policies thoroughly

**Risk**: Breaking existing localStorage-based workflow
**Mitigation**: Graceful fallback when Supabase not configured, maintain localStorage code paths

**Risk**: Clerk user sync to Supabase fails
**Mitigation**: Auto-upsert middleware on every authenticated request, idempotent INSERT ON CONFLICT

**Risk**: Migration complexity for existing data
**Mitigation**: Fresh install assumed (no existing production data to migrate)

---

## Success Criteria

- New users logging in with Clerk see empty project list with "Create Project" prompt
- Users can only see projects they own or are invited to (no leaked data)
- Project owners can invite members with specific roles (owner/admin/member/viewer)
- Viewers cannot create or edit any content (UI disabled)
- Members can create and edit issues but not manage team
- Admins can invite/remove members
- Owners can delete projects
- App works in localhost dev mode without Supabase (localStorage fallback)
- Build passes: `npm run build` succeeds

