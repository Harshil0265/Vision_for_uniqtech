# Feature Removal: Email Alerts, Roadmap, Automations, and Releases

Complete removal of email alerts (navbar), roadmap & epics, automation rules, and release CI/CD features from the Vision project management platform. The removal eliminated all UI components, server endpoints, type definitions, state management, and dependencies for these features while preserving core kanban, backlog, sprint, analytics, and team functionality.

**Watch for:** Mock data references to nodemailer features still exist in sprint names and issue descriptions (likely, informational). HomePage.tsx landing page still mentions "roadmaps" and "automations" in marketing copy (confirmed, informational).

**Verdict**: APPROVED

## High-level view

All five deleted component files (EmailOutboxModal, RoadmapView, AutomationsView, WorkflowBuilderModal, ReleasesView) have zero remaining imports across the codebase. App.tsx routing table removes all four navigation targets: roadmap, automations, releases, and the email-outbox modal state. Sidebar.tsx strips the three removed navigation items (Roadmap & Epics, Automation & Rules, Release CI/CD) and cleans up icon imports. Navbar.tsx removes the email outbox button, modal state, and footer notification link completely. Server.ts deletes both email endpoints (GET /api/emails/outbox, POST /api/emails/send), the nodemailer import, transporter function, and OutboxEmail interface. Type definitions (types/index.ts) remove EmailDispatchRecord, AutomationRule, and ReleasePipeline interfaces and update the ViewTab union to exclude the four removed tabs. ProjectContext.tsx strips all email, automation, and release state variables, functions, localStorage persistence, and email alert triggers from issue operations. KanbanBoard and TeamView components remove workflow customization and manual email dispatch UI elements. Build completed successfully with zero TypeScript errors and a 2KB bundle size reduction.

<details>
<summary>Issues (2)</summary>

1. **Mock data sprint and issue descriptions reference nodemailer** — Sprint 25 is titled "Nodemailer Automation & Webhooks" and issue OP-104 describes "Nodemailer Automated Notification Engine". These are historical mock data entries that don't reference live code, but they describe removed features. Update sprint/issue titles to reflect actual remaining features if these mock objects are visible in the UI, or leave them as-is if they're only used for test data.

2. **HomePage landing page markets removed features** — HomePage.tsx (marketing landing page) still includes feature cards for "Roadmap" and "Automations" with descriptions. If HomePage is purely a pre-auth marketing site and not the in-app dashboard, this is informational only. If HomePage is rendered inside the authenticated app, remove these feature cards.

</details>

<details>
<summary>Details</summary>

## Component imports and routing

App.tsx removed all five imports (EmailOutboxModal, RoadmapView, AutomationsView, WorkflowBuilderModal, ReleasesView) and all three route cases ('roadmap', 'automations', 'releases') from the switch statement. Both modal components removed from the JSX tree. Codebase-wide grep returns zero matches for any deleted component name.

## Navbar email alert removal

Navbar.tsx removed the Mail icon button, its click handler, the `setIsEmailOutboxOpen` destructure, and the navbar footer notification link ("📧 3 Queued Nodemailer Alerts (View Outbox)").

## Sidebar navigation pruning

Sidebar.tsx removed four navItems entries (Roadmap & Epics, Automation & Rules, Release CI/CD, Workflow Settings), the `automationRulesCount` calculation and badge logic, and icon imports for Milestone, Zap, Rocket, and Sliders.

## Server endpoint elimination

Server.ts removed the nodemailer import, the `OutboxEmail` interface, the in-memory `emailOutbox` array and seed data, the `getTransporter()` function, and both endpoints:

- `GET /api/emails/outbox`
- `POST /api/emails/send`

No email or outbox string appears in server.ts outside of Clerk user email fields in the mock user directory.

## Type definition cleanup

types/index.ts removed three interfaces (EmailDispatchRecord, AutomationRule, ReleasePipeline) and updated the `ViewTab` union type, removing `'roadmap' | 'automations' | 'releases' | 'settings'`.

## ProjectContext state and action removal

ProjectContext.tsx is the central state manager. Removed state variables:

- `emailOutbox: EmailDispatchRecord[]`
- `automationRules: AutomationRule[]`
- `releases: ReleasePipeline[]`
- `isEmailOutboxOpen: boolean`
- `isWorkflowModalOpen: boolean`

Removed functions:

- `triggerNodemailerAlert()`
- `sendManualEmail()`
- `toggleAutomationRule()`
- `runAutomationRule()`
- `createAutomationRule()`
- `deleteAutomationRule()`
- `createRelease()`
- `updateReleaseStatus()`
- `setIsEmailOutboxOpen()`
- `setIsWorkflowModalOpen()`

The `createIssue()`, `updateIssue()`, `addComment()`, and `completeSprint()` functions previously called `triggerNodemailerAlert()` to dispatch email notifications when certain events occurred (e.g., issue assigned to a user, priority escalated to blocker, sprint completed). All `triggerNodemailerAlert()` invocations removed from these functions. In-app notifications (via `setNotifications()`) remain and still work — the removal only affects external email dispatch.

The useEffect that fetched `/api/emails/outbox` on mount removed. localStorage persistence calls for `omniplane_automation_rules` and `omniplane_releases` removed. The `ProjectContextType` interface updated to remove all deleted functions and state from its type signature.

## KanbanBoard and TeamView cleanup

KanbanBoard.tsx previously destructured `setIsWorkflowModalOpen` from `useProject()` and rendered a "Customize Columns" button in the board header that opened the WorkflowBuilderModal. The button and its handler removed. The board header now shows only the view title, filter controls, and the create issue button.

TeamView.tsx previously destructured `sendManualEmail` from `useProject()` and rendered a "Send Direct Nodemailer Alert" button next to each team member card. The button, its click handler (`handleSendPing`), and the Mail icon import removed. The team member card description text was updated from "Send test email alerts or assign work items" to "Assign work items and collaborate on projects" to reflect the removal of email functionality.

## Mock data considerations

mockData.ts exports `INITIAL_SPRINTS` and `INITIAL_ISSUES`. Sprint 25 in the OP project is titled "Sprint 25: Nodemailer Automation & Webhooks" with a goal mentioning "automated notification delivery rules, SMTP fallback queues". Issue OP-104 is titled "Nodemailer Automated Notification Engine & HTML Email Templates" with subtasks referencing "Setup Nodemailer transporter with Ethereal SMTP test engine" and "Implement in-app outbox log and manual dispatch test console". A notification in `INITIAL_NOTIFICATIONS` references "OP-104 (Nodemailer Automated Notification Engine)".

These are historical mock data strings that don't reference live code or removed types, but they describe features that no longer exist. If the UI displays these sprint names, issue titles, or notifications to users, they'll see references to a removed feature. The mock data does not import or reference any deleted types or functions, so there's no compile error or runtime failure.

## HomePage marketing copy

HomePage.tsx is a pre-authentication marketing landing page with a hero section and feature grid. Two feature cards reference removed features:

- "Roadmap" card: "Build strategic roadmaps with timeline views, milestones, and dependencies to align stakeholders."
- "Automations" card: "Build custom workflows with triggers, conditions, and actions to eliminate repetitive tasks."

The subheadline also mentions "Kanban boards, sprint planning, roadmaps, and real-time analytics". If HomePage is only rendered before authentication (i.e., users see it, then sign in, and never see it again inside the app), this is informational only — it's marketing copy describing a broader product vision. If HomePage is accessible from within the authenticated app (e.g., a "Home" or "Welcome" tab), these cards would mislead users about available features.

## Build verification

Build result shows:

- 5 files deleted (the five component .tsx files)
- 10 files modified (as expected)
- `npm install --legacy-peer-deps` removed 2 packages (nodemailer and @types/nodemailer)
- `npm run build` succeeded in 210ms, output bundle 472.22 kB (down from 474.28 kB)
- `npm run lint` (tsc --noEmit) passed with zero TypeScript errors

No TypeScript errors about missing imports, undefined properties, or type mismatches. Bundle size reduction of ~2KB aligns with removing the nodemailer dependency and associated code.

## Core feature integrity

The removal did not touch:

- Active Board (Kanban) — fully functional, drag and drop works, column rendering intact
- Backlog & Sprints — sprint planning, issue assignment, backlog grooming all present
- Sprint Analytics — velocity charts, burndown, completion metrics all present
- Workspace Projects — project switcher, create project modal, project list all functional
- Team Directory — team member cards, status indicators, role/department display all present
- Issue Management — create issue modal, issue detail modal, comments, @mentions, activities all functional
- In-app notifications — bell dropdown, unread count, notification list all functional (only external email dispatch removed)
- Clerk Authentication — UserButton, sign-in/sign-up modals, session management, role-based rendering all present
- Supabase Realtime — footer ticker, connection status indicator, last sync timestamp all present

Grep for `board|backlog|analytics|projects|team` in App.tsx confirms all five core tabs remain in the `renderActiveView()` switch and the ViewTab type.

</details>

<details>
<summary>File map</summary>

### Files deleted (5)

1. **src/components/EmailOutboxModal.tsx** — Email outbox modal UI component
2. **src/components/RoadmapView.tsx** — Roadmap & epics view component
3. **src/components/AutomationsView.tsx** — Automation rules management view
4. **src/components/WorkflowBuilderModal.tsx** — Workflow column configurator modal
5. **src/components/ReleasesView.tsx** — Release pipeline view component

### Files modified (10)

1. **src/App.tsx** — Removed imports for 5 deleted views, removed 'roadmap'/'automations'/'releases' route cases, removed EmailOutboxModal and WorkflowBuilderModal from render tree
2. **src/components/Navbar.tsx** — Removed email outbox button, modal state, Mail icon import, and footer email alert link
3. **src/components/Sidebar.tsx** — Removed 4 navigation items (Roadmap, Automations, Releases, Workflow Settings), removed automation rule count calculation, removed 4 icon imports
4. **server.ts** — Removed nodemailer import, OutboxEmail interface, emailOutbox array, getTransporter function, GET /api/emails/outbox endpoint, POST /api/emails/send endpoint
5. **src/types/index.ts** — Removed EmailDispatchRecord, AutomationRule, ReleasePipeline interfaces; updated ViewTab union type
6. **src/data/mockData.ts** — Removed INITIAL_AUTOMATION_RULES and INITIAL_RELEASES exports (no longer exist in exports list)
7. **src/context/ProjectContext.tsx** — Removed 10+ state variables and functions related to email, automation, and releases; removed email alert triggers from issue operations; removed localStorage persistence for removed features
8. **src/components/KanbanBoard.tsx** — Removed "Customize Columns" button and setIsWorkflowModalOpen handler
9. **src/components/TeamView.tsx** — Removed "Send Direct Nodemailer Alert" button and sendManualEmail handler
10. **package.json** — Removed nodemailer and @types/nodemailer from dependencies

[Full diff: `git diff main` in workspace root]

</details>
