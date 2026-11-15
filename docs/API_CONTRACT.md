# Vision: frontend ↔ backend API contract

**For:** the .NET backend and MSSQL database developers.
**From:** the frontend (React) team.

Every page and form in the frontend is built. This document lists, for each form, the **fields it sends**, the **validation it applies**, and the **endpoint and JSON it expects back**, so the API and database can be built to match.

The same shapes are in TypeScript in [`src/types/api.ts`](../src/types/api.ts). If you change a shape, tell the frontend team so both stay in sync.

---

## 1. How the frontend calls the API

| Topic | What the frontend does |
|---|---|
| Base URL | Relative `/api/...`. In development, Vite forwards `/api` to `http://localhost:5286` (launch profile `http`). Override with `VISION_API_URL`. |
| Format | JSON, **camelCase** properties (ASP.NET Core default). IDs are GUID strings. Timestamps are ISO-8601. `dueDate`, `startDate` and `endDate` are plain `YYYY-MM-DD`. |
| Auth | After sign-in or sign-up, every call sends `Authorization: Bearer <token>`. The token is kept until its `exp` claim, so **please keep `exp` in the JWT**. |
| 401 | Signs the user out and shows "Your session has ended". |
| Errors | Any non-2xx should return `{ "success": false, "error": "Human readable message" }`. The frontend shows `error` to the user as-is. For a form, you may add `"errors": { "fieldName": "message" }`. |
| 404 / 405 | Means "endpoint not built yet". The UI shows *"…is not available yet: the server does not support it"* instead of failing. |
| 429 | Shows "Too many attempts. Please wait a minute." |

**Status today:** only `/api/auth/signup`, `/login`, `/logout`, `/me` and `/users` exist (`MockAuthController`). Everything else in this document is still to build. Until then the frontend keeps workspace data (projects, work items, members) in the browser's localStorage, and works fully without the backend ("offline demo mode").

---

## 2. Validation rules (shared by frontend and backend)

The frontend checks these before sending. **The API must check them again**: the frontend is not a security boundary.

| Field | Rule |
|---|---|
| User name | Required, 1–80 characters, trimmed |
| Email | Required, valid format, max 254, **unique ignoring case**, store lower-case |
| Password | 8–72 bytes, at least one letter and one digit. Store only a salted hash (ASP.NET Identity `PasswordHasher` or BCrypt) |
| Job title (`role` on User) / department | Optional, max 60 |
| Project name | Required, 3–80 |
| Project key | Required, `^[A-Z][A-Z0-9]{1,5}$`, unique, **cannot change** after creation (work item keys use it) |
| Project description | Max 500 |
| Allowed work item types | At least one of `epic, story, task, bug, spike, subtask, incident` |
| Work item title | Required, 1–200 |
| Work item description | Max 5000 |
| Story points | One of `0, 1, 2, 3, 5, 8, 13, 21` (0 = not estimated) |
| Labels | Max 10 per item, each max 24 chars, lower-case, spaces become `-` |
| Due date | Optional. When creating, not in the past |
| Assignee | Must be a member of the project whose role is not `viewer` |

---

## 3. Pages and their endpoints

### 3.1 Sign up (home page → "Get started")

Fields: **Full name\***, **Email\***, **Password\***, **Confirm password\*** (frontend only, not sent), Job title, Department.

`POST /api/auth/signup`
```json
{ "name": "Priya Patel", "email": "priya@company.com", "password": "GoodPass123", "role": "QA Engineer", "department": "Engineering" }
```
`200` (or `201`):
```json
{ "success": true, "token": "<jwt>", "user": { "id": "…", "name": "Priya Patel", "email": "priya@company.com", "avatar": "", "role": "QA Engineer", "department": "Engineering", "status": "online" } }
```
Duplicate email: `409` (today `400`) with `{ "success": false, "error": "An account with this email already exists." }`.

### 3.2 Sign in

Fields: **Email\***, **Password\***.

`POST /api/auth/login` with `{ "email": "...", "password": "..." }`. On success, same response as sign-up. On failure, `401` with **the same message for unknown email and wrong password**: `"Invalid email or password."`

### 3.3 Keep me signed in (page reload)

`GET /api/auth/me` (Bearer). Returns `{ "success": true, "user": { … } }` for **the user in the token**. Returns `401` if the token is invalid or the account no longer exists.

### 3.4 Sign out

`POST /api/auth/logout` (Bearer). Returns `200 { "success": true }`. The frontend discards the token either way.

### 3.5 Forgot password (sign-in → "Forgot password?")

Field: **Email\***.

`POST /api/auth/forgot-password` with `{ "email": "..." }`. **Always return `200`**, whether or not the email exists, so accounts can't be discovered. If it exists, email a link to:

```
{APP_URL}/reset-password?token=<one-time token>
```

The token should expire after 1 hour or less and be single-use.

### 3.6 Reset password (page opened from that email link)

Fields: **New password\***, **Confirm new password\***.

`POST /api/auth/reset-password` with `{ "token": "...", "newPassword": "..." }`. Returns `200` on success. Returns `400` (or `410`) with `{ "error": "This reset link is invalid or has expired." }` otherwise.

### 3.7 Profile & settings (avatar menu → "Profile & settings")

| Form | Fields | Endpoint |
|---|---|---|
| Profile | **Full name\***, Job title, Department. Email is read-only | `PUT /api/users/me` with `{ "name", "role", "department" }`. Returns `{ "success": true, "user": { … } }` |
| Change password | **Current password\***, **New password\***, **Confirm\*** (frontend only) | `POST /api/auth/change-password` with `{ "currentPassword", "newPassword" }`. Wrong current password returns `400`/`403` with `error`. Please also revoke the user's other sessions |

### 3.8 Dashboard (landing page after sign-in)

The dashboard needs no endpoint of its own. It is computed from **projects** (3.9) and **work items** (3.12): open items assigned to me, due within 7 days or overdue, active sprint progress, and projects I'm a member of. The "Recent activity" panel will use `GET /api/activity?limit=20` later (optional).

### 3.9 All projects

`GET /api/projects` returns `{ "success": true, "projects": ProjectDto[] }`:

```json
{
  "id": "…", "name": "Vision Web App", "key": "VWA", "description": "…",
  "lead": { "id": "…", "name": "…", "email": "…", "avatar": "…", "role": "…", "department": "…", "status": "online" },
  "template": "Scrum", "allowedIssueTypes": ["epic", "story", "task", "bug"],
  "defaultAssignee": "unassigned", "iconGradient": "from-blue-600 via-indigo-600 to-sky-500",
  "createdAt": "2026-11-15T10:00:00Z",
  "members": [{ "userId": "…", "role": "owner", "addedAt": "…", "user": { … } }],
  "myRole": "owner"
}
```
`template` is one of `Scrum | Kanban | Bug Tracking`. `defaultAssignee` is `unassigned | lead`. `iconGradient` is a CSS class string chosen in the UI; store it as text.

### 3.10 Create project (top bar → "New Project")

Fields: **Project name\***, **Project key\*** (suggested from the name), Description, Template, Project lead, Default assignee, Color, Team members (optional), Work item types (min 1).

`POST /api/projects`
```json
{
  "name": "Vision Web App", "key": "VWA", "description": "…", "leadId": "…",
  "template": "Scrum", "allowedIssueTypes": ["epic", "story", "task", "bug", "spike"],
  "defaultAssignee": "unassigned", "iconGradient": "from-blue-600 via-indigo-600 to-sky-500",
  "members": [{ "userId": "…", "role": "member" }]
}
```
Server rules:
- The lead becomes `owner`. The creator becomes `admin` if they are not the lead.
- For `Scrum` projects, create a first sprint called "{first word of name} Sprint 1" (today, 14 days, `active`).
- Duplicate key returns `409` with `"The key VWA is already used by another project."`

Returns `201 { "success": true, "project": ProjectDto }`.

### 3.11 Project settings (All projects → gear icon) and delete

- `PUT /api/projects/{id}` takes the same body as create **without `key` and `members`**. Owner/admin only.
- `DELETE /api/projects/{id}` deletes the project with its work items and sprints. Owner only. The UI blocks deleting the last project.

### 3.12 Project members (sidebar → "Members"): assigning people to a project

| Action | Fields | Endpoint |
|---|---|---|
| List | none | `GET /api/projects/{id}/members` returns `{ "members": ProjectMemberDto[] }` |
| Add members | **People\*** (multi-select from workspace), **Role** (`admin`/`member`/`viewer`) | `POST /api/projects/{id}/members` with `{ "userIds": ["…"], "role": "member" }` |
| Change role | Role | `PATCH /api/projects/{id}/members/{userId}` with `{ "role": "admin" }` |
| Remove | none | `DELETE /api/projects/{id}/members/{userId}` |

Server rules:
- Only `owner`/`admin` may change members.
- Only an `owner` may grant or remove the `owner` role.
- **A project must always keep at least one owner.** Reject demoting or removing the last owner with `400` and `"A project needs at least one owner."`

Roles:

| Role | Can do |
|---|---|
| owner | Everything, including deleting the project and managing owners |
| admin | Manage members, settings, sprints and all work items |
| member | Create, edit and move work items, comment |
| viewer | Read only |

### 3.13 Invite a person (Team directory → "Invite person", or Members → "Invite by email")

Fields: **Full name\***, **Work email\***, Job title, Department. From the Members page, also a project **role**.

`POST /api/users/invite`
```json
{ "name": "Nina Shah", "email": "nina@company.com", "role": "QA Engineer", "department": "QA", "projectId": "…", "projectRole": "member" }
```
- Creates a user with `status: "invited"` (no password) and, when `projectId` is given, adds them to that project.
- Send them a sign-up email.
- When they sign up with that email, **reuse the same user id**, so their project memberships and assigned work carry over.
- Duplicate email returns `409` with `"Someone with this email is already in the workspace."`

Returns `201 { "success": true, "user": UserDto }`.

### 3.14 Team directory

`GET /api/users` returns `{ "success": true, "users": UserDto[] }` for everyone in the workspace, including invited people. Per-person counts (open work items, story points) are computed by the frontend from work items.

### 3.15 Work items (top bar → "Create", the board, backlog and detail panel)

Create form fields: **Project\***, Status, **Type\***, **Summary\***, Description, Priority, Assignee (project members only), Due date, Sprint, Story points, Parent epic, Labels.

`POST /api/projects/{projectId}/issues`
```json
{
  "type": "task", "title": "Build the sign-in page UI", "description": "…",
  "priority": "high", "status": "todo", "assigneeId": "…", "sprintId": null,
  "storyPoints": 3, "dueDate": "2026-11-20", "labels": ["frontend", "auth"], "epicKey": "VWA-101"
}
```
Server rules:
- Generate `key` = `{project key}-{highest existing number + 1}`, starting at 101.
- Set `reporter` to the caller.
- Reject a `type` that is not in the project's `allowedIssueTypes`.
- Reject an assignee who is not a non-viewer member.

Returns `201 { "success": true, "issue": IssueDto }`. `IssueDto` matches `Issue` in [`src/types/index.ts`](../src/types/index.ts), with full `assignee`/`reporter` user objects and `subtasks`, `comments` and `activities` arrays.

| Action | Endpoint |
|---|---|
| List for a project | `GET /api/projects/{projectId}/issues` |
| Edit any field (detail panel, drag on board, move to sprint) | `PATCH /api/issues/{id}` with only the changed fields, e.g. `{ "status": "in_progress" }`, `{ "assigneeId": "…" }`, `{ "dueDate": null }` |
| Delete | `DELETE /api/issues/{id}` (admin/owner) |
| Comment | `POST /api/issues/{id}/comments` with `{ "content": "…" }`. Server extracts `@name.surname` mentions and notifies those users |
| Add subtask | `POST /api/issues/{id}/subtasks` with `{ "title": "…" }` |
| Tick subtask | `PATCH /api/issues/{id}/subtasks/{subtaskId}` with `{ "completed": true }` |

`priority` is one of `blocker, high, medium, low, lowest`. `status` is a board column id.

### 3.16 Sprints (Backlog & Sprints page)

| Action | Fields | Endpoint |
|---|---|---|
| List | none | `GET /api/projects/{projectId}/sprints` |
| Create | **Name\***, Goal, **Start date\***, **End date\*** | `POST /api/projects/{projectId}/sprints` |
| Start | none | `POST /api/sprints/{id}/start`. Only one sprint per project is active: the UI marks the previously active sprint `completed` |
| Complete | none | `POST /api/sprints/{id}/complete` (sets `completedAt` and `completedPoints`) |

### 3.17 Board columns (Active board → column settings)

Columns are **global** in the UI (one board layout for all projects), which matches the existing `KanbanColumn` entity.

`GET/POST /api/board/columns` and `PATCH/DELETE /api/board/columns/{id}`. Fields: name, wipLimit (0 = no limit), color (hex), category (`todo | in_progress | done`). Keep at least two columns. When deleting, move its items to another column.

### 3.18 Notifications (bell icon)

`GET /api/notifications` returns the caller's notifications. `POST /api/notifications/read-all` marks them read. Types: `assignment | mention | priority | sprint | status`.

---

## 4. Database (MSSQL) notes

The entities in `backend/Vision.Data/Entities` already match most of the frontend. The frontend also needs:

| Table | Columns | Why |
|---|---|---|
| **ProjectMembers** (new) | `ProjectId` (FK), `UserId` (FK), `Role` (`owner/admin/member/viewer`), `AddedAt`, PK (`ProjectId`, `UserId`) | Members page, assignee lists, permissions. Nothing stores membership today |
| **PasswordResetTokens** (new) | `Id`, `UserId`, `TokenHash`, `ExpiresAt`, `UsedAt` | Forgot / reset password |
| Users | allow `PasswordHash` to be empty while `Status = 'invited'` | Invite a person |
| Projects | unique index on `Key` | Duplicate key check |
| Users | unique index on `Email` (stored lower-case) | Duplicate email check |

---

## 5. Gaps in today's `MockAuthController`

The frontend already works around these. Please fix them when building the real API:

1. `GET /api/auth/me` always returns the first mock user (Sarah) instead of the user in the token. The frontend ignores a `/me` user that doesn't match the token.
2. Sign-up accepts any password (defaulting to `password123` when none is sent) and doesn't validate name or email.
3. Email matching is case-sensitive. The frontend sends lower-case, but stored emails should be normalized.
4. A duplicate email returns `400`. `409` is preferred.
5. Passwords are kept in plain text. They should be hashed.
6. New users get an avatar URL from `ui-avatars.com`, a third-party service. Return `""` instead and the frontend draws initials.
7. Login has no rate limiting (brute force).
8. `GET /api/auth/users` is public, which exposes everyone's email. It should require auth.
