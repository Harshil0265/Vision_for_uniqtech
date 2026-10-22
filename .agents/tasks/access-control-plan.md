# Implementation Plan: Complete Project-Based Access Control with Backend API Integration

## Task Overview

**Objective**: Implement comprehensive project-based access control so users only see projects they are members of, with proper filtering of issues, sprints, and all related data. Backend must enforce access control on all endpoints.

**Current State Analysis**:
- ✅ Backend has proper access control on most endpoints (project CRUD, issues, members)
- ✅ RLS policies exist in Supabase schema
- ✅ GET /api/projects already filters by user membership (line 545 in server.ts)
- ❌ ProjectContext.tsx loads ALL demo projects without filtering (line 217)
- ❌ fetchUserProjects runs only on mount, doesn't react to login/logout (line 232)
- ❌ Mixed localStorage and API data causing inconsistency
- ❌ Issues and sprints not filtered by accessible projects
- ❌ Some backend endpoints lack complete project access verification

**Architecture**:
- Frontend: React + TypeScript, Context API for state management
- Backend: Express with Clerk authentication
- Database: Supabase with RLS policies
- Build: Vite (frontend) + tsx watch (backend)
- Test: TypeScript type checking with `npm run lint`

---

## Implementation Plan

### FEAT-001: Fix ProjectContext.tsx - Remove Global Project Loading & Add User Session Dependency

**Priority**: Critical - This is the root cause of users seeing all projects

**Files**:
- `h:\vision for uniqtech\src\context\ProjectContext.tsx` (lines 130-175, 232-270)

**Changes Required**:

1. **Remove Initial Demo Project Loading** (lines 150-175)
   - Current behavior: Loads INITIAL_PROJECTS without filtering when localStorage is empty
   - New behavior: Start with empty array in localStorage mode, let useEffect handle demo data
   - Keep the check for `isSupabaseConfigured` but remove the `INITIAL_PROJECTS` assignment

2. **Add User Session Dependency to fetchUserProjects** (line 232)
   - Current: `useEffect(() => { fetchUserProjects(); }, [isSupabaseConfigured]);`
   - New: `useEffect(() => { fetchUserProjects(); }, [isSupabaseConfigured, clerkSession?.token]);`
   - This ensures projects refetch when user logs in/out

3. **Fix Demo Projects Filter** (lines 217-270)
   - Current: Loads all INITIAL_PROJECTS without checking user membership
   - New: Filter `INITIAL_PROJECTS` by `currentUser.id` in project members
   - Update condition: Only load filtered demo data when NOT in Supabase mode AND no saved projects

4. **Clear Projects on Logout**
   - Add check in `clerkSignOut` function (around line 850) to clear projects: `setProjects([])`
   - Clear activeProject to first project or placeholder

5. **Add Loading State**
   - Add `const [isLoadingProjects, setIsLoadingProjects] = useState(false);`
   - Set to true when fetching, false when done
   - Export in context type for UI to show loading indicators

**Verification**:
```bash
npm run lint
# Should pass with no TypeScript errors

# Manual test:
# 1. Start dev server: npm run dev
# 2. Sign out if logged in
# 3. Create new user account
# 4. Verify: User sees empty state (no projects)
# 5. Create a project
# 6. Verify: Only that project appears
# 7. Sign out and sign in as different user
# 8. Verify: Second user sees empty state
```

---

### FEAT-002: Filter Issues and Sprints by Accessible Projects

**Priority**: High - Prevents data leakage in UI

**Files**:
- `h:\vision for uniqtech\src\context\ProjectContext.tsx` (lines 300-400, issues/sprints getters)
- `h:\vision for uniqtech\src\components\KanbanBoard.tsx`
- `h:\vision for uniqtech\src\components\BacklogView.tsx`

**Changes Required**:

1. **Create Filtered Issues Getter in Context** (after line 300)
   ```typescript
   const accessibleProjectIds = useMemo(() => 
     projects.map(p => p.id), 
     [projects]
   );

   const accessibleIssues = useMemo(() => 
     issues.filter(issue => accessibleProjectIds.includes(issue.projectId)),
     [issues, accessibleProjectIds]
   );
   ```

2. **Create Filtered Sprints Getter in Context**
   ```typescript
   const accessibleSprints = useMemo(() => 
     sprints.filter(sprint => accessibleProjectIds.includes(sprint.projectId)),
     [sprints, accessibleProjectIds]
   );
   ```

3. **Export Filtered Data Instead of Raw Data**
   - In ProjectContextType interface, keep `issues` and `sprints` as exports
   - But internally use filtered versions in all operations
   - Ensure `activeSprint` calculation uses filtered sprints

4. **Update Issue Fetch in Context**
   - In `fetchUserProjects` success handler (line 250), also fetch issues for those projects
   - Add API call: `GET /api/projects/${projectId}/issues` for each project
   - Aggregate and set issues state

5. **Clear Issues/Sprints on Logout**
   - In `clerkSignOut`, add: `setIssues([])` and `setSprints([])`

**Verification**:
```bash
npm run lint
# Should pass

# Manual test:
# 1. User A creates Project A with Issue A1
# 2. User B creates Project B with Issue B1
# 3. Sign in as User A
# 4. Verify: Only sees Issue A1, not B1
# 5. Check Kanban board, backlog view
# 6. Verify: No issues from Project B appear
```

---

### FEAT-003: Enhanced Backend Access Control with verifyProjectAccess Helper

**Priority**: Critical - Security layer

**Files**:
- `h:\vision for uniqtech\server.ts` (lines 300-350, add helper; apply to all endpoints)

**Changes Required**:

1. **Create Enhanced verifyProjectAccess Helper** (after line 350, after existing helper)
   ```typescript
   async function verifyProjectAccessEnhanced(
     projectId: string, 
     userId: string, 
     requiredRole?: 'owner' | 'admin' | 'member'
   ): Promise<{ hasAccess: boolean; role?: string; error?: string }> {
     if (!supabase) {
       return { hasAccess: false, error: 'Database not configured' };
     }
     
     const { data, error } = await supabase
       .from('project_members')
       .select('role')
       .eq('project_id', projectId)
       .eq('user_id', userId)
       .single();
     
     if (error || !data) {
       return { hasAccess: false, error: 'No access to this project' };
     }
     
     const userRole = (data as any).role;
     
     // Check required role
     if (requiredRole) {
       const roleHierarchy = { viewer: 0, member: 1, admin: 2, owner: 3 };
       const userRoleLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
       const requiredRoleLevel = roleHierarchy[requiredRole] || 0;
       
       if (userRoleLevel < requiredRoleLevel) {
         return { 
           hasAccess: false, 
           role: userRole,
           error: `Requires ${requiredRole} role or higher` 
         };
       }
     }
     
     return { hasAccess: true, role: userRole };
   }
   ```

2. **Apply to GET /api/projects/:id** (add new endpoint around line 650)
   ```typescript
   app.get('/api/projects/:id', requireAuth(), upsertClerkUser, async (req, res) => {
     // Get user ID
     // Call verifyProjectAccessEnhanced
     // Return 403 if no access
     // Return project details with members
   });
   ```

3. **Apply to All Issue Endpoints** (lines 1023, 1100+)
   - GET /api/projects/:id/issues - Already has verifyProjectAccess ✅
   - POST /api/projects/:id/issues - Already has verifyProjectAccess ✅
   - PATCH /api/issues/:issueId - Verify via issue's project_id
   - DELETE /api/issues/:issueId - Verify via issue's project_id

4. **Apply to Sprint Endpoints** (line 1565+)
   - GET /api/projects/:id/sprints - Add verifyProjectAccess check
   - POST /api/projects/:id/sprints - Add verifyProjectAccess check
   - PATCH /api/sprints/:id - Verify via sprint's project_id
   - DELETE /api/sprints/:id - Verify via sprint's project_id

5. **Apply to Attachment Endpoints** (line 1400+)
   - POST /api/projects/:projectId/issues/:issueId/attachments - Already checks membership ✅
   - GET /api/projects/:projectId/issues/:issueId/attachments - Add check
   - DELETE /api/attachments/:id - Verify via attachment → issue → project chain

6. **Consistent 403 Responses**
   - All denied access should return: `{ success: false, error: 'Access denied to this project' }`
   - HTTP status: 403 Forbidden (not 404)
   - Never leak project existence to non-members

**Verification**:
```bash
npm run lint
# Should pass

# API Integration test:
# 1. Start server: npm run dev:server
# 2. Create test users and projects in Supabase
# 3. Test with curl:

curl -H "Authorization: Bearer <user1-token>" http://localhost:3000/api/projects/<user2-project-id>
# Expected: 403 Forbidden

curl -H "Authorization: Bearer <user1-token>" http://localhost:3000/api/projects/<user1-project-id>/issues
# Expected: 200 OK with issues

curl -H "Authorization: Bearer <user1-token>" http://localhost:3000/api/projects/<user2-project-id>/issues
# Expected: 403 Forbidden
```

---

### FEAT-004: Update UI Components to Handle Empty State and Loading

**Priority**: Medium - UX improvements

**Files**:
- `h:\vision for uniqtech\src\components\ProjectsView.tsx` (lines 45-70)
- `h:\vision for uniqtech\src\components\Navbar.tsx` (lines 100-140)
- `h:\vision for uniqtech\src\components\KanbanBoard.tsx`
- `h:\vision for uniqtech\src\components\BacklogView.tsx`

**Changes Required**:

1. **ProjectsView - Add Loading State** (line 20)
   - Import `isLoadingProjects` from context
   - Show skeleton loaders while `isLoadingProjects === true`
   - Show empty state when `projects.length === 0 && !isLoadingProjects`
   - Empty state message: "No projects yet. Create your first project to get started."

2. **ProjectsView - Remove Unauthorized Projects**
   - Already filters by `projects` from context
   - But add safeguard: double-check user is member before showing
   - Filter: `projects.filter(p => p.members?.some(m => m.userId === currentUser.id))`

3. **Navbar - Project Dropdown**
   - Already uses `projects` from context ✅
   - Add loading indicator in dropdown when `isLoadingProjects`
   - Handle empty projects array gracefully

4. **KanbanBoard - Filter Issues**
   - Currently uses `issues` from context
   - Add safeguard: `const boardIssues = issues.filter(i => i.projectId === activeProject.id)`
   - Show empty state: "No issues in this project yet."

5. **BacklogView - Filter Issues and Sprints**
   - Filter issues: `issues.filter(i => i.projectId === activeProject.id)`
   - Filter sprints: `sprints.filter(s => s.projectId === activeProject.id)`
   - Show empty states appropriately

**Verification**:
```bash
npm run lint
# Should pass

npm run dev
# Manual UI test:
# 1. Sign in as new user
# 2. Verify: See "No projects yet" message
# 3. Create project
# 4. Verify: Project appears immediately
# 5. Check all views (Board, Backlog, Projects)
# 6. Verify: No errors in browser console
```

---

### FEAT-005: Add Sprints API Endpoints (Currently Missing)

**Priority**: High - API completeness

**Files**:
- `h:\vision for uniqtech\server.ts` (add after line 1565)

**Changes Required**:

1. **GET /api/projects/:id/sprints** (new endpoint)
   ```typescript
   app.get('/api/projects/:id/sprints', requireAuth(), upsertClerkUser, async (req, res) => {
     if (!supabase) return res.status(503).json({ success: false, error: 'Supabase not configured' });
     
     const projectId = req.params.id;
     const authReq = req as AuthRequest;
     const supabaseUserId = await getSupabaseUserId(authReq.auth?.userId, authReq.customUserId);
     
     if (!supabaseUserId) {
       return res.status(400).json({ success: false, error: 'User not found' });
     }
     
     const hasAccess = await verifyProjectAccess(projectId, supabaseUserId);
     if (!hasAccess) {
       return res.status(403).json({ success: false, error: 'Access denied to this project' });
     }
     
     const { data: sprints, error } = await supabase
       .from('sprints')
       .select('*')
       .eq('project_id', projectId)
       .order('created_at', { ascending: false });
     
     if (error) {
       console.error('[Supabase] Error fetching sprints:', error);
       return res.status(400).json({ success: false, error: error.message });
     }
     
     res.json({ success: true, sprints: sprints || [] });
   });
   ```

2. **POST /api/projects/:id/sprints** (new endpoint)
   - Verify user has member role or higher
   - Create sprint in database
   - Return created sprint

3. **PATCH /api/sprints/:id** (new endpoint)
   - Get sprint to find project_id
   - Verify user has access to project
   - Update sprint fields
   - Return updated sprint

4. **DELETE /api/sprints/:id** (new endpoint)
   - Verify user is admin/owner
   - Delete sprint
   - Return success

5. **Update ProjectContext to Use Sprint API**
   - In `fetchUserProjects`, fetch sprints for each project
   - In `createSprint`, POST to API
   - In `startSprint`/`completeSprint`, PATCH to API
   - Fallback to localStorage if API unavailable

**Verification**:
```bash
npm run lint
# Should pass

# API test:
curl -H "Authorization: Bearer <token>" http://localhost:3000/api/projects/<project-id>/sprints
# Expected: 200 OK with sprints array

# Integration test:
# 1. Create sprint in UI
# 2. Check Supabase sprints table
# 3. Verify sprint appears
# 4. Refresh page
# 5. Verify sprint persists
```

---

## Edge Cases to Handle

1. **Race Conditions**
   - Multiple API calls during login/logout
   - Solution: Use loading flags, cancel stale requests

2. **Stale Data After Membership Changes**
   - User removed from project while viewing it
   - Solution: Handle 403 errors, redirect to projects view, show toast message

3. **Mixed LocalStorage and API Data**
   - LocalStorage has old projects, API returns new ones
   - Solution: When API succeeds, trust API data over localStorage

4. **Empty Active Project**
   - User has no projects, activeProject is placeholder
   - Solution: Check `projects.length > 0` before rendering boards

5. **Viewer Role Restrictions**
   - Viewers shouldn't see "Create Issue" buttons
   - Solution: Already handled by `canEditIssue` helper ✅

6. **Demo Mode vs Production Mode**
   - Different behavior when Supabase not configured
   - Solution: Always check `isSupabaseConfigured` flag

---

## Testing Strategy

### Unit Tests
```bash
npm run lint
# Type checking must pass for all modified files
```

### Integration Tests (Manual)

**Test Suite 1: New User Flow**
1. Clear browser data
2. Sign up as new user
3. ✓ Should see empty state
4. Create first project
5. ✓ Should see only that project
6. Create issue in project
7. ✓ Should see issue in board

**Test Suite 2: Multi-User Access Control**
1. User A creates Project X
2. User B signs up
3. ✓ User B should NOT see Project X
4. User A invites User B to Project X
5. User B refreshes
6. ✓ User B should now see Project X
7. ✓ Both see same issues

**Test Suite 3: API Security**
1. Get User A's project ID
2. Try to access with User B's token
3. ✓ Should return 403
4. Try to create issue in User A's project
5. ✓ Should return 403

**Test Suite 4: LocalStorage Fallback**
1. Set invalid Supabase URL in .env
2. Restart server
3. Create project
4. ✓ Should work in localStorage mode
5. Refresh page
6. ✓ Data persists
7. Switch users
8. ✓ Each user has separate data

---

## Rollback Plan

If issues arise:

1. **Revert ProjectContext Changes**
   ```bash
   git checkout HEAD -- src/context/ProjectContext.tsx
   ```

2. **Revert Server Changes**
   ```bash
   git checkout HEAD -- server.ts
   ```

3. **Database State**
   - RLS policies are non-destructive
   - No data loss from backend changes
   - Can safely iterate

---

## Success Criteria

✅ New users see empty workspace, not demo data  
✅ Users only see projects they created or were invited to  
✅ Issues and sprints filtered by project membership  
✅ All API endpoints enforce access control  
✅ 403 responses for unauthorized access (not 404)  
✅ Loading states shown during async operations  
✅ No TypeScript errors (`npm run lint` passes)  
✅ Works in both Supabase mode and localStorage fallback  
✅ User can switch accounts and see correct data  
✅ Invitation flow still works correctly  

---

## Implementation Order

Execute FEATs sequentially in this order:

1. **FEAT-001** - Critical foundation, blocks others
2. **FEAT-002** - Depends on FEAT-001's filtered projects
3. **FEAT-003** - Backend security layer, independent
4. **FEAT-005** - API completeness, needed for FEAT-002
5. **FEAT-004** - UI polish, depends on all above

---

## Build and Test Commands

**Verify TypeScript**:
```bash
npm run lint
```

**Run Development**:
```bash
npm run dev
```

**Build for Production**:
```bash
npm run build
```

**Start Production Server**:
```bash
npm start
```

---

## Files Summary

**Modified (8 files)**:
1. `src/context/ProjectContext.tsx` - Core access control logic
2. `src/components/ProjectsView.tsx` - Filter and empty state
3. `src/components/Navbar.tsx` - Project dropdown filter
4. `src/components/KanbanBoard.tsx` - Issue filtering
5. `src/components/BacklogView.tsx` - Issue/sprint filtering
6. `server.ts` - Enhanced access control, sprint endpoints
7. `src/types/index.ts` - Add loading state type (if needed)
8. `.env.example` - Update comments (if needed)

**New (0 files)**: No new files needed

**Database**: No schema changes needed, RLS policies already exist ✅

---

## Notes

- Existing backend already has good foundation with `verifyProjectAccess` helper
- RLS policies in Supabase provide defense-in-depth
- Main issue is frontend loading all demo projects without filtering
- Solution is primarily frontend refactoring + backend completeness
- Backward compatible: localStorage fallback mode still works
- No breaking changes to API contracts

---

## Timeline Estimate

- FEAT-001: 1-2 hours (critical changes)
- FEAT-002: 1 hour (filtering logic)
- FEAT-003: 2 hours (backend endpoints)
- FEAT-005: 1-2 hours (sprint API)
- FEAT-004: 1 hour (UI updates)
- Testing: 1 hour (manual verification)

**Total: 7-9 hours** for complete implementation and testing.
