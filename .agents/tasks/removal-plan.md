# Feature Removal Plan

This plan completely removes 4 features from the Vision project management system:
1. **Email Alerts / Email Outbox** (Navbar notification bell, EmailOutboxModal, all related email state)
2. **Roadmap & Epics** (RoadmapView sidebar view)
3. **Automation & Rules** (AutomationsView, WorkflowBuilderModal, sidebar entry)
4. **Release CI/CD** (ReleasesView, sidebar entry)

All endpoints, types, state, handlers, and UI references will be removed.

---

## Feature 1: Email Alerts / Email Outbox

### Component Files to Delete
- [ ] 1. **Delete** `h:\vision for uniqtech\src\components\EmailOutboxModal.tsx`
      Complete modal component for email outbox interface.
      Files: src/components/EmailOutboxModal.tsx
      Verify: `npm run lint` — file deletion causes no TypeScript import errors.

### Server Endpoint Routes to Remove (server.ts)
- [ ] 2. **Remove email outbox and send endpoints** from `h:\vision for uniqtech\server.ts`
      Delete lines defining:
      - `interface OutboxEmail` (lines ~44-54)
      - `const emailOutbox: OutboxEmail[]` initialization and seed data (lines ~56-88)
      - `let transporter: any = null;` and `async function getTransporter()` (lines ~90-118)
      - `app.get('/api/emails/outbox', ...)` endpoint (lines ~130-132)
      - `app.post('/api/emails/send', ...)` endpoint (lines ~134-176)
      Files: server.ts
      Verify: Start dev server with `npm run dev` and confirm no email endpoints exist at `/api/emails/outbox` or `/api/emails/send`.

### Remove from Navbar.tsx
- [ ] 3. **Remove email outbox UI** from `h:\vision for uniqtech\src\components\Navbar.tsx`
      Delete import: `import { EmailOutboxModal } from './components/EmailOutboxModal';` (line 22 in App.tsx import, but here context usage)
      Delete state destructuring: `setIsEmailOutboxOpen,` and `emailOutbox,` from `useProject()` hook (lines 32-34)
      Delete entire "Nodemailer Email Console Trigger" button block (lines ~228-239) starting with `<button onClick={() => setIsEmailOutboxOpen(true)}`
      Delete notification footer link that opens email outbox (lines ~315-319) inside notifications popover: `onClick={() => { setIsNotifOpen(false); setIsEmailOutboxOpen(true); }}`
      Files: src/components/Navbar.tsx
      Verify: `npm run lint` — no unused variables, UI compiles without email button.

### Remove from App.tsx
- [ ] 4. **Remove EmailOutboxModal import and component** from `h:\vision for uniqtech\src\App.tsx`
      Delete import: `import { EmailOutboxModal } from './components/EmailOutboxModal';` (line 22)
      Delete component render: `<EmailOutboxModal />` (line 113)
      Files: src/App.tsx
      Verify: `npm run build` — successful production build without EmailOutboxModal references.

### Remove from ProjectContext.tsx
- [ ] 5. **Remove email state, handlers, and Nodemailer dispatch** from `h:\vision for uniqtech\src\context\ProjectContext.tsx`
      Delete from interface `ProjectContextType`:
        - `emailOutbox: EmailDispatchRecord[];` (line 43)
        - `isEmailOutboxOpen: boolean;` (line 71)
        - `setIsEmailOutboxOpen: (open: boolean) => void;` (line 72)
        - `sendManualEmail: (data: { to: string; subject: string; text?: string; html?: string; type?: EmailDispatchRecord['type']; issueKey?: string }) => Promise<any>;` (line 100)
      Delete state declarations:
        - `const [emailOutbox, setEmailOutbox] = useState<EmailDispatchRecord[]>([]);` (line 190)
        - `const [isEmailOutboxOpen, setIsEmailOutboxOpen] = useState(false);` (line 205)
      Delete entire `triggerNodemailerAlert` function (lines ~305-353) — this dispatches emails via `/api/emails/send`
      Delete `useEffect` that fetches initial email outbox from backend (lines ~276-285): `fetch('/api/emails/outbox')`
      Delete `sendManualEmail` function (lines ~919-934) that posts to `/api/emails/send`
      Remove all calls to `triggerNodemailerAlert(...)` throughout the file:
        - In `createIssue` (lines ~433-462)
        - In `updateIssue` for priority blocker escalation (lines ~499-530)
        - In `updateIssue` for assignee change (lines ~533-546)
        - In `addComment` for @mentions (lines ~626-654)
        - In `completeSprint` (line reference after truncation, search for "Sprint Closed")
      Remove from context provider return object:
        - `emailOutbox,` (line 1131)
        - `isEmailOutboxOpen,` (line 1157)
        - `setIsEmailOutboxOpen,` (line 1158)
        - `sendManualEmail,` (line 1185)
      Files: src/context/ProjectContext.tsx
      Verify: `npm run lint` — TypeScript compiles with no unused variables or missing type references.

### Remove from types/index.ts
- [ ] 6. **Remove EmailDispatchRecord type** from `h:\vision for uniqtech\src\types\index.ts`
      Delete entire `export interface EmailDispatchRecord` block (lines ~73-83)
      Files: src/types/index.ts
      Verify: `npm run lint` — no type errors for removed EmailDispatchRecord.

### Remove from mockData.ts
- [ ] 7. **No email data in mockData.ts** — email outbox was initialized empty and fetched from server, so no changes needed.
      Files: (none)
      Verify: Confirm no INITIAL_EMAILS or similar export exists in src/data/mockData.ts.

### Remove nodemailer dependency
- [ ] 8. **Remove nodemailer packages** from `h:\vision for uniqtech\package.json`
      Delete from `dependencies`: `"nodemailer": "^10.0.15",` (line 19)
      Delete from `devDependencies`: `"@types/nodemailer": "^8.0.2",` (line 28)
      Files: package.json
      Verify: Run `npm install` to update lockfile and confirm clean install without nodemailer.

---

## Feature 2: Roadmap & Epics View

### Component Files to Delete
- [ ] 9. **Delete** `h:\vision for uniqtech\src\components\RoadmapView.tsx`
      Full roadmap view with epic progress tracking.
      Files: src/components/RoadmapView.tsx
      Verify: `npm run lint` — file removal causes no import errors.

### Remove from App.tsx
- [ ] 10. **Remove RoadmapView import and route** from `h:\vision for uniqtech\src\App.tsx`
       Delete import: `import { RoadmapView } from './components/RoadmapView';` (line 13)
       Delete case in `renderActiveView()` switch statement (lines 36-37):
       ```typescript
       case 'roadmap':
         return <RoadmapView />;
       ```
       Files: src/App.tsx
       Verify: `npm run build` — no errors, roadmap route removed.

### Remove from Sidebar.tsx
- [ ] 11. **Remove roadmap navigation entry** from `h:\vision for uniqtech\src\components\Sidebar.tsx`
       Delete from `navItems` array (line 37):
       ```typescript
       { id: 'roadmap', label: 'Roadmap & Epics', icon: <Milestone className="w-4 h-4" /> },
       ```
       Remove unused import if `Milestone` is no longer used: check if `Milestone` from lucide-react appears elsewhere; if not, remove from imports.
       Files: src/components/Sidebar.tsx
       Verify: `npm run dev` and confirm sidebar has no "Roadmap & Epics" entry, UI renders correctly.

### Remove from types/index.ts
- [ ] 12. **Remove 'roadmap' from ViewTab type** in `h:\vision for uniqtech\src\types\index.ts`
       Edit `export type ViewTab = ...` (lines ~119-127):
       Remove `| 'roadmap'` from the union type.
       Files: src/types/index.ts
       Verify: `npm run lint` — no type errors, ViewTab union correct.

---

## Feature 3: Automation & Rules (AutomationsView + WorkflowBuilderModal)

### Component Files to Delete
- [ ] 13. **Delete** `h:\vision for uniqtech\src\components\AutomationsView.tsx`
       Complete automation rules listing and creation interface.
       Files: src/components/AutomationsView.tsx
       Verify: File deletion causes no remaining import errors.

- [ ] 14. **Delete** `h:\vision for uniqtech\src\components\WorkflowBuilderModal.tsx`
       Kanban workflow column editor modal (settings button in sidebar).
       Files: src/components/WorkflowBuilderModal.tsx
       Verify: File deletion causes no remaining import errors.

### Remove from App.tsx
- [ ] 15. **Remove AutomationsView and WorkflowBuilderModal imports and components** from `h:\vision for uniqtech\src\App.tsx`
       Delete import: `import { AutomationsView } from './components/AutomationsView';` (line 17)
       Delete import: `import { WorkflowBuilderModal } from './components/WorkflowBuilderModal';` (line 25)
       Delete case in `renderActiveView()` switch (lines 44-45):
       ```typescript
       case 'automations':
         return <AutomationsView />;
       ```
       Delete component render: `<WorkflowBuilderModal />` (line 116)
       Remove footer automation engine status indicator (lines ~103-106):
       ```typescript
       <span className="flex items-center gap-1 font-medium">
         <Zap className="w-3 h-3 text-amber-500" />
         <span>Automations Engine: Active</span>
       </span>
       ```
       Files: src/App.tsx
       Verify: `npm run build` — successful build, no automations view or workflow modal.

### Remove from Sidebar.tsx
- [ ] 16. **Remove automations navigation entry and workflow settings button** from `h:\vision for uniqtech\src\components\Sidebar.tsx`
       Delete state destructuring: `automationRules,` and `setIsWorkflowModalOpen,` from `useProject()` (lines 26, 29)
       Delete calculation: `const activeAutomationsCount = automationRules.filter(r => r.enabled).length;` (line 32)
       Delete from `navItems` array (line 41):
       ```typescript
       { id: 'automations', label: 'Automations & Rules', icon: <Zap className="w-4 h-4 text-amber-500" />, badge: `${activeAutomationsCount} Live` },
       ```
       Delete from `navItems` array (line 44):
       ```typescript
       { id: 'settings', label: 'Workflow Settings', icon: <Sliders className="w-4 h-4" /> }
       ```
       Update button click handler to remove settings modal logic (lines ~67-73): remove the conditional that opens `setIsWorkflowModalOpen(true)`, just call `setActiveTab(item.id)` for all items.
       Remove unused imports if `Zap` and `Sliders` icons no longer appear elsewhere in the file.
       Files: src/components/Sidebar.tsx
       Verify: `npm run dev` — sidebar renders without automations or settings entries.

### Remove from ProjectContext.tsx
- [ ] 17. **Remove automation rules state, handlers, and CRUD operations** from `h:\vision for uniqtech\src\context\ProjectContext.tsx`
       Delete from interface `ProjectContextType`:
         - `automationRules: AutomationRule[];` (line 102)
         - `toggleAutomationRule: (ruleId: string) => void;` (line 104)
         - `runAutomationRule: (ruleId: string) => void;` (line 105)
         - `createAutomationRule: (rule: Partial<AutomationRule>) => void;` (line 106)
         - `deleteAutomationRule: (ruleId: string) => void;` (line 107)
         - `isWorkflowModalOpen: boolean;` (line 76)
         - `setIsWorkflowModalOpen: (open: boolean) => void;` (line 77)
       Delete state declarations:
         - `const [automationRules, setAutomationRules] = useState<AutomationRule[]>(() => { ... });` (lines ~175-178)
         - `const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);` (line 208)
       Delete `useEffect` persisting automation rules to localStorage (lines ~255-256): `localStorage.setItem('vision_automation_rules', ...)`
       Delete function definitions:
         - `toggleAutomationRule` (lines ~937-941)
         - `runAutomationRule` (lines ~943-965)
         - `createAutomationRule` (lines ~967-984)
         - `deleteAutomationRule` (lines ~987-989)
       Remove from context provider return:
         - `automationRules,` (line 1186)
         - `toggleAutomationRule,` (line 1188)
         - `runAutomationRule,` (line 1189)
         - `createAutomationRule,` (line 1190)
         - `deleteAutomationRule,` (line 1191)
         - `isWorkflowModalOpen,` (line 1162)
         - `setIsWorkflowModalOpen,` (line 1163)
       Files: src/context/ProjectContext.tsx
       Verify: `npm run lint` — no unused variables or missing types.

### Remove from types/index.ts
- [ ] 18. **Remove AutomationRule type and 'automations'/'settings' from ViewTab** from `h:\vision for uniqtech\src\types\index.ts`
       Delete entire `export interface AutomationRule` block (lines ~85-95)
       Edit `export type ViewTab = ...` (lines ~119-127):
       Remove `| 'automations'` and `| 'settings'` from the union type.
       Files: src/types/index.ts
       Verify: `npm run lint` — AutomationRule type removed, ViewTab updated.

### Remove from mockData.ts
- [ ] 19. **Remove INITIAL_AUTOMATION_RULES export and data** from `h:\vision for uniqtech\src\data\mockData.ts`
       Delete entire `export const INITIAL_AUTOMATION_RULES: AutomationRule[] = [...]` block (lines ~371-417)
       Delete import type: `AutomationRule` from the top import statement (line 1)
       Files: src/data/mockData.ts
       Verify: `npm run lint` — no unused imports or exports.

---

## Feature 4: Releases & CI/CD View

### Component Files to Delete
- [ ] 20. **Delete** `h:\vision for uniqtech\src\components\ReleasesView.tsx`
       Full releases and deployment pipeline management view.
       Files: src/components/ReleasesView.tsx
       Verify: File deletion causes no import errors.

### Remove from App.tsx
- [ ] 21. **Remove ReleasesView import and route** from `h:\vision for uniqtech\src\App.tsx`
       Delete import: `import { ReleasesView } from './components/ReleasesView';` (line 18)
       Delete case in `renderActiveView()` switch (lines 46-47):
       ```typescript
       case 'releases':
         return <ReleasesView />;
       ```
       Files: src/App.tsx
       Verify: `npm run build` — no errors, releases route removed.

### Remove from Sidebar.tsx
- [ ] 22. **Remove releases navigation entry** from `h:\vision for uniqtech\src\components\Sidebar.tsx`
       Delete state destructuring: `releases,` from `useProject()` (line 27)
       Delete from `navItems` array (line 42):
       ```typescript
       { id: 'releases', label: 'Releases & CI/CD', icon: <Rocket className="w-4 h-4 text-blue-500" />, badge: `${releases.length}` },
       ```
       Remove unused import if `Rocket` icon is no longer used elsewhere.
       Files: src/components/Sidebar.tsx
       Verify: `npm run dev` — sidebar renders without "Releases & CI/CD" entry.

### Remove from ProjectContext.tsx
- [ ] 23. **Remove releases state and handlers** from `h:\vision for uniqtech\src\context\ProjectContext.tsx`
       Delete from interface `ProjectContextType`:
         - `releases: ReleasePipeline[];` (line 109)
         - `createRelease: (data: Partial<ReleasePipeline>) => void;` (line 110)
         - `updateReleaseStatus: (releaseId: string, status: ReleasePipeline['status']) => void;` (line 111)
       Delete state declaration:
         - `const [releases, setReleases] = useState<ReleasePipeline[]>(() => { ... });` (lines ~180-183)
       Delete `useEffect` persisting releases to localStorage (lines ~259-260): `localStorage.setItem('vision_releases', ...)`
       Delete function definitions:
         - `createRelease` (lines ~991-1008)
         - `updateReleaseStatus` (lines ~1010-1014)
       Remove from context provider return:
         - `releases,` (line 1192)
         - `createRelease,` (line 1194)
         - `updateReleaseStatus,` (line 1195)
       Files: src/context/ProjectContext.tsx
       Verify: `npm run lint` — no unused variables or types.

### Remove from types/index.ts
- [ ] 24. **Remove ReleasePipeline type and 'releases' from ViewTab** from `h:\vision for uniqtech\src\types\index.ts`
       Delete entire `export interface ReleasePipeline` block (lines ~97-109)
       Edit `export type ViewTab = ...` (lines ~119-127):
       Remove `| 'releases'` from the union type.
       Files: src/types/index.ts
       Verify: `npm run lint` — ReleasePipeline type removed, ViewTab updated.

### Remove from mockData.ts
- [ ] 25. **Remove INITIAL_RELEASES export and data** from `h:\vision for uniqtech\src\data\mockData.ts`
       Delete entire `export const INITIAL_RELEASES: ReleasePipeline[] = [...]` block (lines ~419-470)
       Delete import type: `ReleasePipeline` from the top import statement (line 1)
       Files: src/data/mockData.ts
       Verify: `npm run lint` — no unused imports or exports.

---

## Final Verification Steps

- [ ] 26. **Clean build and lint check**
       Run full TypeScript type check and production build.
       Files: (project-wide)
       Verify: Execute `npm run lint && npm run build` — zero errors, all features removed cleanly.

- [ ] 27. **Start development server and manual UI check**
       Launch dev server and navigate through all remaining views.
       Files: (runtime verification)
       Verify: Execute `npm run dev`, open browser, confirm:
       - No "Email Alerts" button in navbar
       - No email outbox modal accessible
       - No "Roadmap & Epics" in sidebar
       - No "Automations & Rules" in sidebar
       - No "Workflow Settings" in sidebar
       - No "Releases & CI/CD" in sidebar
       - No "Automations Engine: Active" in footer
       - All remaining views (Board, Backlog, Analytics, Projects, Team) render correctly

- [ ] 28. **Test server endpoints removed**
       Confirm email API endpoints no longer exist.
       Files: (server runtime)
       Verify: With `npm run dev` running, attempt to fetch `http://localhost:3000/api/emails/outbox` and `http://localhost:3000/api/emails/send` — both should return 404 or "Cannot GET/POST".

- [ ] 29. **Check localStorage cleanup (optional)**
       Old cached automation rules and releases may persist in browser localStorage.
       Files: (browser storage)
       Verify: Open browser DevTools > Application > Local Storage, confirm keys `vision_automation_rules`, `vision_releases`, and email-related keys are no longer written by the app (existing entries are inert).

---

## Summary of Deletions

### Files to Delete (4 files)
1. `src/components/EmailOutboxModal.tsx`
2. `src/components/RoadmapView.tsx`
3. `src/components/AutomationsView.tsx`
4. `src/components/WorkflowBuilderModal.tsx`

### Server Endpoints to Remove (2 routes)
1. `GET /api/emails/outbox` (server.ts)
2. `POST /api/emails/send` (server.ts)

### Types to Remove (3 interfaces/types)
1. `EmailDispatchRecord` (types/index.ts)
2. `AutomationRule` (types/index.ts)
3. `ReleasePipeline` (types/index.ts)

### ViewTab Values to Remove (4 values)
1. `'roadmap'`
2. `'automations'`
3. `'settings'`
4. `'releases'`

### Mock Data Exports to Remove (2 exports)
1. `INITIAL_AUTOMATION_RULES` (mockData.ts)
2. `INITIAL_RELEASES` (mockData.ts)

### npm Dependencies to Remove (2 packages)
1. `nodemailer` (dependency)
2. `@types/nodemailer` (devDependency)

### ProjectContext State Variables to Remove (7 variables)
1. `emailOutbox`
2. `isEmailOutboxOpen`
3. `automationRules`
4. `isWorkflowModalOpen`
5. `releases`

### ProjectContext Functions to Remove (8 functions)
1. `sendManualEmail`
2. `triggerNodemailerAlert`
3. `setIsEmailOutboxOpen`
4. `toggleAutomationRule`
5. `runAutomationRule`
6. `createAutomationRule`
7. `deleteAutomationRule`
8. `setIsWorkflowModalOpen`
9. `createRelease`
10. `updateReleaseStatus`

All cross-references, imports, and UI elements systematically removed. No orphaned code remains.
