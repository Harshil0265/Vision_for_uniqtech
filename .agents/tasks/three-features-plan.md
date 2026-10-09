# Implementation Plan: Three Features for Vision Project Management

## Overview
Implement three features for the Vision project management app:
1. **Persistent Project Storage**: Fix localStorage inconsistency and wire Supabase persistence for projects
2. **Due Date & Assignment Date**: Add date/time fields to issues with visual indicators and sorting
3. **File Attachments**: Enable file uploads to issues via Supabase Storage with role-based access

This plan is also available as FEAT artifacts under `h:\vision for uniqtech\.agents\tasks\three-features/` for decomposed execution.

---

## Current State Assessment

### Existing Server Endpoints (server.ts)
Based on code inspection, the following endpoints are **already implemented**:
- ✅ **GET /api/projects** - Fetch user's projects (line 732)
- ✅ **POST /api/projects** - Create new project (line 565)
- ✅ **GET /api/projects/:id/issues** - Fetch project issues (line 875)
- ✅ **POST /api/projects/:id/issues** - Create issue (line 920)
- ✅ **PATCH /api/issues/:issueId** - Update issue (line 1022)
- ✅ **DELETE /api/issues/:issueId** - Delete issue (line 1087)
- ✅ **POST /api/projects/:id/issues/:issueId/comments** - Add comment (line 1233)

### Endpoints to Add
- ❌ **PUT /api/projects/:id** - Update project (needed for FEAT-001)
- ❌ **DELETE /api/projects/:id** - Delete project (needed for FEAT-001)
- ❌ **POST /api/projects/:projectId/issues/:issueId/attachments** - Upload attachment (needed for FEAT-003)
- ❌ **GET /api/projects/:projectId/issues/:issueId/attachments** - List attachments (needed for FEAT-003)
- ❌ **DELETE /api/projects/:projectId/issues/:issueId/attachments/:attachmentId** - Delete attachment (needed for FEAT-003)

### NPM Packages to Add
- **multer** + **@types/multer** (for multipart file uploads in FEAT-003)

### Database Schema Status
- ✅ **users** table exists (supabase-schema.sql line 10)
- ✅ **projects** table exists (line 22)
- ✅ **project_members** table exists (line 37)
- ✅ **issues** table exists with **due_date** column (line 51, 207)
- ✅ **sprints** table exists (line 62)
- ✅ **comments** table exists (line 74)
- ❌ **issues.assigned_at** column missing (needed for FEAT-002)
- ❌ **attachments** table missing (needed for FEAT-003)

---

## Feature 1: Persistent Project Storage via Supabase

### Problem
- localStorage keys are inconsistent: 'omniplane_projects' vs 'vision_projects' in ProjectContext.tsx
- Projects created in one session disappear after browser refresh (localStorage-only in fallback mode)
- createProject, updateProject, deleteProject do not persist to Supabase even when configured

### Solution
1. Standardize all localStorage keys to 'vision_' prefix
2. Wire ProjectContext to call API endpoints when Supabase is configured
3. Add missing PUT and DELETE endpoints to server.ts
4. Maintain localStorage as cache and fallback

### Files to Modify
- **src/context/ProjectContext.tsx** (lines 60, 160, 470, 480)
- **server.ts** (add PUT /api/projects/:id and DELETE /api/projects/:id after line 730)

### Implementation Steps
1. **Fix localStorage keys in ProjectContext.tsx**
   - Line 60: Change `localStorage.getItem('omniplane_projects')` to `'vision_projects'`
   - Line 160: Change `localStorage.setItem('omniplane_projects', ...)` to `'vision_projects'`
   - Line 166 (estimated): Change `'omniplane_active_project_id'` to `'vision_active_project_id'`
   
2. **Add PUT /api/projects/:id endpoint in server.ts** (after line 730)
   ```typescript
   app.put('/api/projects/:id', flexAuth, upsertClerkUser, async (req, res) => {
     // Verify user is owner via verifyProjectAdmin
     // Update projects table with { name, key, description, template, allowedIssueTypes, defaultAssignee, iconGradient }
     // Return updated project with lead user joined
   });
   ```

3. **Add DELETE /api/projects/:id endpoint in server.ts** (after PUT)
   ```typescript
   app.delete('/api/projects/:id', flexAuth, upsertClerkUser, async (req, res) => {
     // Verify user is owner
     // Delete from projects table (cascade deletes issues/sprints via foreign keys)
     // Return success
   });
   ```

4. **Wire updateProject to API in ProjectContext.tsx** (around line 470)
   - Check `isSupabaseConfigured && clerkSession`
   - Call `PUT /api/projects/:id` with updates
   - On success, update local state
   - On error, log warning and fall back to localStorage-only

5. **Wire deleteProject to API in ProjectContext.tsx** (around line 480)
   - Check `isSupabaseConfigured && clerkSession`
   - Call `DELETE /api/projects/:id`
   - On success, update local state and cascade delete issues/sprints
   - On error, log warning and fall back to localStorage-only

### Verification
- Run `npm run lint` (must pass with zero errors)
- Run `npm run dev` and open http://localhost:5173
- Create a project, check DevTools Network tab for POST /api/projects
- Refresh page, verify GET /api/projects loads project
- Edit project name, check PUT /api/projects/:id
- Delete project (if allowed), check DELETE /api/projects/:id
- Test localStorage fallback: clear VITE_SUPABASE_URL env var, restart, create project, verify no API calls

---

## Feature 2: Due Date & Assignment Date on Issues

### Problem
- Issues have no due date tracking or overdue indicators
- No visual cue for when an issue was assigned
- BacklogView has no due date sorting

### Solution
1. Add `assignedAt?: string` to Issue interface (dueDate already exists)
2. Add datetime-local input to CreateIssueModal
3. Display and edit dueDate in IssueDetailModal; display assignedAt (read-only)
4. Auto-set assignedAt when assignee is first set
5. Show overdue indicator (red border/badge) on KanbanBoard cards
6. Show due date badge on cards
7. Add due date sort dropdown in BacklogView
8. Add assigned_at column to Supabase issues table

### Files to Modify
- **src/types/index.ts** (add assignedAt field to Issue interface, around line 76)
- **src/components/CreateIssueModal.tsx** (add datetime-local input, around line 140)
- **src/components/IssueDetailModal.tsx** (add dueDate and assignedAt display/edit, around line 400-500)
- **src/components/KanbanBoard.tsx** (add overdue indicator and due date badge, around line 145, 155)
- **src/components/BacklogView.tsx** (add due date sort dropdown, around line 50)
- **src/context/ProjectContext.tsx** (auto-set assignedAt in createIssue and updateIssue, lines 550, 620)
- **server.ts** (update PATCH /api/issues/:issueId to accept assigned_at, around line 1022)
- **h:\vision for uniqtech\.agents\tasks\date-fields-migration.sql** (new file)

### Implementation Steps
1. **Add assignedAt field to Issue interface** in src/types/index.ts
   ```typescript
   export interface Issue {
     // ... existing fields
     dueDate?: string;
     assignedAt?: string;  // NEW
     createdAt: string;
     updatedAt: string;
   }
   ```

2. **Create migration SQL** at h:\vision for uniqtech\.agents\tasks\date-fields-migration.sql
   ```sql
   -- Add assigned_at column to issues table (due_date already exists)
   ALTER TABLE issues ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
   ```

3. **Add dueDate input to CreateIssueModal.tsx** (after description field, around line 140)
   - Add state: `const [dueDate, setDueDate] = useState<string>('')`
   - Add input: `<input type="datetime-local" value={dueDate} onChange={e => setDueDate(e.target.value)} />`
   - Pass in createIssue call: `dueDate: dueDate ? new Date(dueDate).toISOString() : undefined`

4. **Display and edit dueDate in IssueDetailModal.tsx** (right sidebar, around line 400-500)
   - Add a 'Due Date' row with formatted date display
   - If canEdit, make it editable via datetime-local input
   - On change, call updateIssue with new dueDate
   - Add an 'Assigned At' row below (read-only, formatted date)

5. **Auto-set assignedAt in ProjectContext.tsx**
   - In `createIssue` (around line 550): if assignee is set, add `assignedAt: new Date().toISOString()` to newIssue
   - In `updateIssue` (around line 620): if updates.assignee is set and old issue.assignee was null, set `updates.assignedAt = new Date().toISOString()`

6. **Add overdue indicator in KanbanBoard.tsx** (renderCard function, around line 145)
   - Check: `if (issue.dueDate && new Date(issue.dueDate) < new Date() && issue.status !== 'done')`
   - Add red border or red clock icon badge

7. **Add due date badge on cards in KanbanBoard.tsx** (around line 155)
   - If `issue.dueDate` exists, show compact badge: `Due: Jan 15` (use date formatting)

8. **Add due date sort in BacklogView.tsx** (around line 50)
   - Add dropdown with options: 'Due Date ↑', 'Due Date ↓'
   - Use `filteredIssues.sort((a, b) => ...)` to sort by dueDate before rendering

9. **Update server.ts PATCH /api/issues/:issueId** (around line 1022)
   - Add `assigned_at` to accepted fields in req.body
   - Update issues table with assigned_at if provided

10. **Update server.ts POST /api/projects/:id/issues** (around line 920)
    - Add `assigned_at` to accepted fields in req.body
    - Insert with assigned_at if provided

### Verification
- Run `npm run lint` (must pass)
- Create issue with due date, verify display in modal and on card
- Set past due date, verify overdue indicator (red border/badge)
- Assign issue, verify assignedAt is set and displayed
- Sort backlog by due date, verify ordering
- Refresh page, verify persistence

---

## Feature 3: File Attachments on Issues

### Problem
- No way to attach files (screenshots, documents, code snippets) to issues
- Users rely on external file sharing services

### Solution
1. Add Attachment interface and attachments array to Issue type
2. Add upload UI to IssueDetailModal (drag-drop + browse, multi-file, 10 MB limit, progress)
3. Create server endpoints for upload/delete/list using Supabase Storage
4. Create attachments table in Supabase
5. Display attachments with thumbnails, download/delete actions (role-based)
6. Show attachment count badge on KanbanBoard cards
7. localStorage fallback: store as base64 data URIs (1 MB limit)

### Files to Modify
- **src/types/index.ts** (add Attachment interface and attachments array to Issue)
- **src/components/IssueDetailModal.tsx** (add upload UI and attachment display, around line 350)
- **src/components/KanbanBoard.tsx** (add attachment count badge, around line 155)
- **src/context/ProjectContext.tsx** (fetch attachments, localStorage fallback)
- **server.ts** (add 3 endpoints for attachments)
- **h:\vision for uniqtech\.agents\tasks\attachments-migration.sql** (new file)
- **package.json** (add multer dependency)

### Implementation Steps
1. **Install multer for file uploads**
   ```bash
   npm install multer @types/multer --save
   ```

2. **Add Attachment interface** in src/types/index.ts
   ```typescript
   export interface Attachment {
     id: string;
     filename: string;
     size: number;
     mimeType: string;
     url: string;
     uploadedBy: User;
     uploadedAt: string;
   }

   export interface Issue {
     // ... existing fields
     attachments?: Attachment[];
   }
   ```

3. **Create migration SQL** at h:\vision for uniqtech\.agents\tasks\attachments-migration.sql
   ```sql
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
   ```

4. **Add POST /api/projects/:projectId/issues/:issueId/attachments** in server.ts (after line 1280)
   - Import multer: `import multer from 'multer'`
   - Configure multer with memory storage: `const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })`
   - Use middleware: `app.post('/api/projects/:projectId/issues/:issueId/attachments', requireAuth(), upsertClerkUser, upload.single('file'), async (req, res) => { ... })`
   - Validate file type (images, PDF, text, code, Office docs)
   - Upload to Supabase Storage bucket 'issue-attachments' with path `{projectId}/{issueId}/{uuid}-{originalFilename}`
   - Insert row into attachments table
   - Return attachment metadata

5. **Add GET /api/projects/:projectId/issues/:issueId/attachments** in server.ts
   - Verify user has project access
   - Select from attachments table with uploaded_by user joined
   - Return array

6. **Add DELETE /api/projects/:projectId/issues/:issueId/attachments/:attachmentId** in server.ts
   - Verify user has member/admin/owner role (not viewer)
   - Fetch attachment row, extract storage_path
   - Delete from Supabase Storage
   - Delete row from attachments table
   - Return success

7. **Add upload UI to IssueDetailModal.tsx** (after subtasks section, around line 350)
   - Add state: `const [uploading, setUploading] = useState(false)`, `const fileInputRef = useRef<HTMLInputElement>(null)`
   - Add hidden file input: `<input type="file" multiple accept="image/*,application/pdf,text/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.js,.ts,.py,.json,.xml,.yaml" ref={fileInputRef} onChange={handleFileSelect} />`
   - Add drag-drop zone with onDragOver, onDrop handlers
   - Add 'Browse Files' button that triggers `fileInputRef.current?.click()`
   - On file selection, validate size <= 10 MB per file
   - Show progress indicator during upload
   - Call POST with FormData
   - On success, fetch updated attachments via GET

8. **Display attachments in IssueDetailModal.tsx**
   - Map over `selectedIssue.attachments`
   - Images: render as thumbnails (max 80px height)
   - Others: file-type icon + filename + size
   - Download button: `window.open(attachment.url, '_blank')`
   - Delete button: only if userRole !== 'viewer' and (current user is uploader OR admin/owner)

9. **Wire attachments in ProjectContext.tsx**
   - In createIssue, set `attachments: []` in newIssue
   - In updateIssue, if isSupabaseConfigured, fetch attachments via GET and merge into issue object

10. **Add attachment count badge to KanbanBoard.tsx** (around line 155)
    - Check: `if (issue.attachments && issue.attachments.length > 0)`
    - Display: paperclip icon + count badge

11. **Implement localStorage fallback in ProjectContext.tsx**
    - When uploading and !isSupabaseConfigured:
      - Read file as base64 data URI via FileReader.readAsDataURL
      - Check size <= 1 MB (smaller limit for localStorage)
      - Store in issue.attachments array in localStorage
    - When downloading: open data URI in new tab
    - When deleting: filter out from array

### Verification
- Run `npm run lint` (must pass)
- Upload PNG image, verify appears as thumbnail
- Download attachment, verify opens in new tab
- Delete attachment, verify removed
- Upload 15 MB file, verify error message
- Upload PDF and .docx, verify file-type icons
- Check Supabase dashboard: files in 'issue-attachments' bucket, rows in attachments table
- Test viewer role: upload/delete disabled
- Test localStorage fallback: clear VITE_SUPABASE_URL, upload small image, verify base64 storage

---

## Implementation Order (to avoid compile errors)

This order ensures TypeScript compilation succeeds at each step:

### Phase 1: Types First
1. Add assignedAt field to Issue interface (src/types/index.ts)
2. Add Attachment interface (src/types/index.ts)
3. Add attachments array to Issue interface (src/types/index.ts)

### Phase 2: Backend (Database + API)
4. Create date-fields-migration.sql
5. Create attachments-migration.sql
6. Install multer: `npm install multer @types/multer --save`
7. Add PUT /api/projects/:id endpoint (server.ts)
8. Add DELETE /api/projects/:id endpoint (server.ts)
9. Update PATCH /api/issues/:issueId to accept assigned_at (server.ts)
10. Update POST /api/projects/:id/issues to accept assigned_at (server.ts)
11. Add POST /api/projects/:projectId/issues/:issueId/attachments (server.ts)
12. Add GET /api/projects/:projectId/issues/:issueId/attachments (server.ts)
13. Add DELETE /api/projects/:projectId/issues/:issueId/attachments/:attachmentId (server.ts)

### Phase 3: Context Layer
14. Fix localStorage keys in ProjectContext.tsx
15. Wire updateProject to PUT API (ProjectContext.tsx)
16. Wire deleteProject to DELETE API (ProjectContext.tsx)
17. Auto-set assignedAt in createIssue (ProjectContext.tsx)
18. Auto-set assignedAt in updateIssue (ProjectContext.tsx)
19. Wire attachments fetch in updateIssue (ProjectContext.tsx)
20. Implement localStorage fallback for attachments (ProjectContext.tsx)

### Phase 4: UI Components
21. Add dueDate input to CreateIssueModal.tsx
22. Add dueDate and assignedAt display/edit to IssueDetailModal.tsx
23. Add upload UI and attachment display to IssueDetailModal.tsx
24. Add overdue indicator to KanbanBoard.tsx
25. Add due date badge to KanbanBoard.tsx
26. Add attachment count badge to KanbanBoard.tsx
27. Add due date sort to BacklogView.tsx

---

## End-to-End Verification Checklist

After implementing all three features, verify the complete flow:

### Feature 1 (Projects)
- [ ] Create project → POST /api/projects succeeds
- [ ] Refresh page → GET /api/projects loads project
- [ ] Edit project → PUT /api/projects/:id succeeds
- [ ] Delete project → DELETE /api/projects/:id succeeds
- [ ] localStorage fallback works (no Supabase)

### Feature 2 (Dates)
- [ ] Create issue with due date → saves and displays
- [ ] Past due date → overdue indicator shows
- [ ] Assign issue → assignedAt set and displayed
- [ ] Sort backlog by due date → ordering correct
- [ ] Refresh page → dates persist

### Feature 3 (Attachments)
- [ ] Upload image → thumbnail appears
- [ ] Download → opens in new tab
- [ ] Delete → removed
- [ ] Upload 15 MB file → error shown
- [ ] Viewer role → upload/delete disabled
- [ ] localStorage fallback → base64 storage works

### General
- [ ] `npm run lint` passes with zero errors
- [ ] No console errors in browser DevTools
- [ ] All localStorage keys use 'vision_' prefix
- [ ] Supabase tables have correct data

---

## Notes for Implementer

- **Supabase Configuration**: Ensure .env.local has VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY (frontend), SUPABASE_URL, SUPABASE_SERVICE_KEY (backend)
- **Clerk Authentication**: Backend uses flexAuth or requireAuth middleware; all Supabase writes happen server-side with RLS policies
- **localStorage Keys**: Standardize on 'vision_' prefix to fix inconsistency bug
- **Role-Based Access**: Use utils/permissions.ts helpers (getUserRoleInProject, canEditIssue, canDeleteProject) to check permissions
- **Error Handling**: Graceful fallback to localStorage when Supabase fails; show user-friendly error messages, never crash UI
- **TypeScript**: Run `npm run lint` after each file change to catch type errors early
- **Dev Server**: Use `npm run dev` (runs Vite frontend on :5173 and Express backend on :3000 with proxy); backend hot-reloads via tsx watch
- **Migration SQL**: Apply manually in Supabase dashboard SQL editor or via CLI before testing features 2 and 3
