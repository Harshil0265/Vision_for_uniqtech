# Implementation Plan: Clerk Authentication Integration

## Project Context

**Project Type:** React 19 + TypeScript frontend with Express.js backend, managed by Vite dev server  
**Build System:** Vite 8.3.0 with @vitejs/plugin-react and Tailwind CSS 4.3.3  
**Package Manager:** npm (Node.js required)  
**Dev Command:** `npm run dev` (runs tsx server.ts which starts Express and Vite middleware)  
**Build Command:** `npm run build` (Vite production build)  
**Lint Command:** `npm run lint` (TypeScript type checking with tsc --noEmit)  

**Current State:**
- The project already has a mock Clerk auth system in `server.ts` with in-memory user storage and session management
- The frontend has `ClerkAuthModal.tsx` that provides sign up/sign in UI but uses the mock backend API
- The app renders directly through `ProjectProvider` wrapping the dashboard without any authentication gates
- The `.env` file now exists with Clerk keys: `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`, and `VITE_CLERK_PUBLISHABLE_KEY`

**Goal:** Replace the mock auth system with real Clerk SDK integration on both frontend and backend, add a public home page with sign-up/sign-in CTAs, and gate the dashboard behind authentication.

---

## Implementation Plan

- [ ] 1. Install Clerk SDK dependencies for frontend and backend.
      Add @clerk/clerk-react for the React frontend and @clerk/express for the Express backend middleware.
      Files: package.json
      Verify: `npm list @clerk/clerk-react @clerk/express` shows both packages installed successfully.

- [ ] 2. Update server.ts to integrate @clerk/express middleware.
      Import `clerkMiddleware` and `requireAuth` from @clerk/express. Add `clerkMiddleware()` to the Express app middleware stack (before Vite middleware in dev mode, before static file serving in production). Protect the `/api/auth/me` route by wrapping the handler with `requireAuth()`. The existing mock `/api/auth/users`, `/api/auth/signup`, `/api/auth/login`, and `/api/auth/logout` routes remain functional for development but are deprecated in favor of Clerk's built-in auth flows. Load CLERK_SECRET_KEY from process.env for the middleware configuration.
      Files: h:\vision\server.ts
      Verify: `npm run lint` passes with no TypeScript errors, and `npm run dev` starts the server without crashes. Check console logs for Clerk middleware initialization messages.

- [ ] 3. Create HomePage.tsx component with marketing hero and authentication CTAs.
      Build a full-screen landing page with: a hero section featuring the VisionLogo component (already exists at h:\vision\src\components\VisionLogo.tsx), a tagline describing Vision as an enterprise project management platform, feature highlights (Kanban boards, sprint planning, real-time collaboration, automation), and prominent "Sign Up" and "Sign In" buttons using Clerk's `<SignUpButton>` and `<SignInButton>` components from @clerk/clerk-react. Style with Tailwind CSS matching the existing design system (blue-600, indigo-600, slate color palette). Use lucide-react icons for feature highlights.
      Files: h:\vision\src\components\HomePage.tsx (create new file)
      Verify: `npm run lint` passes. Visually inspect the page by temporarily importing HomePage in App.tsx to confirm the layout and styling are correct.

- [ ] 4. Create AuthWrapper.tsx to wrap the app with ClerkProvider and route authenticated vs. unauthenticated views.
      Import `ClerkProvider`, `SignedIn`, `SignedOut` from @clerk/clerk-react. Read the publishable key from `import.meta.env.VITE_CLERK_PUBLISHABLE_KEY`. Render `<ClerkProvider publishableKey={publishableKey}>` as the root. Inside, render `<SignedOut><HomePage /></SignedOut>` to show the landing page to unauthenticated users, and `<SignedIn>{children}</SignedIn>` to show the authenticated dashboard (the existing App content). The children prop will be the full dashboard UI (Navbar, Sidebar, main workspace, modals, footer).
      Files: h:\vision\src\components\AuthWrapper.tsx (create new file)
      Verify: `npm run lint` passes with no TypeScript errors.

- [ ] 5. Refactor App.tsx to extract dashboard content into AppContent and wrap with AuthWrapper.
      Keep the existing AppContent component as-is (it contains all the dashboard UI). Modify the default export App component to wrap `<ProjectProvider><AppContent /></ProjectProvider>` inside the new `<AuthWrapper>` component. The structure becomes: App -> AuthWrapper (ClerkProvider + SignedOut/SignedIn routing) -> ProjectProvider -> AppContent (dashboard).
      Files: h:\vision\src\App.tsx
      Verify: `npm run lint` passes. `npm run dev` launches the app, shows HomePage when not signed in, and shows the dashboard after signing in via Clerk's built-in flows.

- [ ] 6. Update Navbar.tsx to replace the existing Clerk Auth button with Clerk's UserButton component.
      Replace the current "Clerk Auth Profile & Switcher Button" (the button that calls `setIsAuthModalOpen(true)`) with Clerk's `<UserButton afterSignOutUrl="/" />` component from @clerk/clerk-react. This provides a built-in user avatar dropdown with profile, settings, and sign-out. Keep the rest of the navbar unchanged. The ClerkAuthModal remains accessible only from within the authenticated dashboard for team persona switching (a custom feature separate from Clerk's user management).
      Files: h:\vision\src\components\Navbar.tsx
      Verify: `npm run lint` passes. In the running app, the navbar shows the Clerk UserButton with the signed-in user's avatar and provides sign-out functionality.

- [ ] 7. Update ProjectContext.tsx to synchronize Clerk user with the existing currentUser state.
      Import `useUser` from @clerk/clerk-react at the top of ProjectContext.tsx. Inside the ProjectProvider component, call `const { user: clerkUser } = useUser()` to get the authenticated Clerk user. Add a useEffect that watches `clerkUser` and synchronizes it with the existing `currentUser` state: when clerkUser changes, find or create a matching User record in teamMembers based on clerkUser.primaryEmailAddress?.emailAddress, and call setCurrentUser with that record. If no match exists, create a new team member with the Clerk user's name, email, and avatar, add it to teamMembers, and set it as currentUser. This ensures the dashboard's currentUser reflects the authenticated Clerk user. The existing `switchUser`, `clerkSignUp`, `clerkSignIn`, `clerkSignOut` functions in ProjectContext remain for backward compatibility with ClerkAuthModal (the persona switcher) but are no longer used for actual authentication.
      Files: h:\vision\src\context\ProjectContext.tsx
      Verify: `npm run lint` passes. In the running app, after signing in with Clerk, the currentUser state in the dashboard matches the signed-in Clerk user (check the navbar avatar and user name).

- [ ] 8. Test full authentication flow end-to-end.
      Start the dev server with `npm run dev`. Open the app in a browser. Verify: (1) The HomePage appears with Sign Up and Sign In buttons. (2) Clicking Sign Up opens Clerk's sign-up modal, allows account creation, and redirects to the dashboard. (3) The dashboard shows the correct user avatar and name in the Navbar via the UserButton. (4) Clicking the UserButton dropdown shows profile and sign-out options. (5) Signing out redirects back to the HomePage. (6) Signing in again via the Sign In button on HomePage authenticates and returns to the dashboard. (7) The existing ProjectContext, mock data, and all dashboard features (Kanban board, sprints, issues, notifications, email outbox, automations, releases) continue to work without regression. (8) The ClerkAuthModal (accessed via a button in the dashboard) still opens and allows persona switching for demo purposes, without affecting the real Clerk authentication.
      Files: None (testing only)
      Verify: All authentication flows work as described. `npm run lint` passes. No console errors. The dashboard is fully functional with persistent authentication via Clerk.

---

## Key Design Decisions

1. **Preservation of existing mock auth backend routes:** The existing `/api/auth/*` routes in server.ts remain functional but are deprecated. Real authentication now flows through Clerk's SDK, and the frontend uses Clerk's `<SignInButton>`, `<SignUpButton>`, and `<UserButton>` components instead of the custom ClerkAuthModal for primary authentication. The ClerkAuthModal becomes a team persona switcher for internal demo purposes only.

2. **Dual-layer authentication approach:** The real Clerk authentication gates the entire dashboard at the App level via AuthWrapper (ClerkProvider + SignedIn/SignedOut). Inside the authenticated dashboard, the existing ProjectContext's currentUser state is synchronized with the Clerk user via useUser hook, ensuring all existing features (assignments, notifications, activity streams) reference the correct authenticated user without rewriting the entire codebase.

3. **Environment variable setup:** Vite requires the `VITE_` prefix for frontend env vars. The .env file now contains both `CLERK_PUBLISHABLE_KEY` (for backend if needed) and `VITE_CLERK_PUBLISHABLE_KEY` (for frontend). The backend uses `CLERK_SECRET_KEY` in clerkMiddleware.

4. **HomePage as the new entry point:** Unauthenticated users see a marketing landing page (HomePage) with CTAs to sign up or sign in. This replaces the previous behavior where the dashboard rendered immediately without authentication. The homepage reuses the existing VisionLogo component and follows the established Tailwind design system for visual consistency.

5. **Minimal changes to existing dashboard code:** The existing App.tsx, Navbar.tsx, and ProjectContext.tsx are modified with surgical precision. App.tsx wraps its content with AuthWrapper. Navbar.tsx swaps one button for UserButton. ProjectContext.tsx adds a single useEffect to sync clerkUser with currentUser. All other components (Sidebar, KanbanBoard, modals, etc.) remain untouched, ensuring zero regression risk.

6. **No test framework setup:** The package.json has no test scripts or test dependencies (no Jest, Vitest, Cypress, etc.). Verification relies on `npm run lint` for type safety and manual end-to-end testing in the browser during `npm run dev`.

---

## Files to Modify or Create

**Modify:**
- h:\vision\package.json (add Clerk dependencies)
- h:\vision\server.ts (integrate @clerk/express middleware)
- h:\vision\src\App.tsx (wrap with AuthWrapper)
- h:\vision\src\components\Navbar.tsx (replace auth button with UserButton)
- h:\vision\src\context\ProjectContext.tsx (sync Clerk user with currentUser)

**Create:**
- h:\vision\src\components\HomePage.tsx (landing page with hero and auth CTAs)
- h:\vision\src\components\AuthWrapper.tsx (ClerkProvider wrapper with SignedIn/SignedOut routing)

**Already Created:**
- h:\vision\.env (Clerk keys added)

---

## Risk Mitigation

- **Backward compatibility:** The existing ClerkAuthModal and mock auth backend routes remain functional for demo and development purposes. No features are removed, only augmented with real authentication.
- **Type safety:** Every change is validated with `npm run lint` (tsc --noEmit) to catch TypeScript errors before runtime.
- **Incremental verification:** Each step includes a verification command to confirm correctness before proceeding to the next step.
- **No destructive changes:** The existing dashboard components, ProjectContext logic, mock data, and all features remain intact. The authentication layer is added as a wrapper, not a replacement.
