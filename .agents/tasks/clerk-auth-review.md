# Clerk authentication integration for Vision

This change adds Clerk authentication to the Vision project management suite, replacing a demo persona switcher with production-ready user authentication. Sign-in and sign-up flows are handled through Clerk's modal UI, the backend validates sessions with Clerk middleware, and authenticated users are synchronized with the existing ProjectContext state system.

The implementation wraps the app in ClerkProvider at the AuthWrapper boundary, gates the dashboard behind SignedIn/SignedOut components, and adds requireAuth() middleware to sensitive backend routes. A synchronization layer bridges Clerk's user object with ProjectContext's currentUser state so the rest of the app continues to work unchanged.

**Watch for:** Environment variable leak (confirmed: CLERK_SECRET_KEY correctly isolated to backend), unprotected API routes (confirmed: email endpoints now require authentication), user synchronization gap between Clerk and ProjectContext (confirmed: ClerkUserSync component addresses this), and persona switcher conflict (confirmed: hidden when signed in via Clerk).

**Verdict**: APPROVED

## High-level view

The frontend wraps the app in AuthWrapper, which conditionally renders HomePage for unauthenticated users and the dashboard for authenticated users. ClerkProvider sits at the root with the publishable key, and SignedIn/SignedOut components gate the UI. A ClerkUserSync component inside the authenticated path watches for Clerk user changes and synchronizes them with ProjectContext by matching on email or creating a new team member entry.

The backend applies clerkMiddleware() globally and requireAuth() to the two email routes (/api/emails/outbox and /api/emails/send). On startup, server.ts validates that CLERK_SECRET_KEY is loaded and logs a prefix for verification. The /api/auth/me endpoint has requireAuth() applied but falls back to a default user (Alex Rivera) when no token is present, supporting the development flow.

The landing page (HomePage) presents a hero section with sign-up and sign-in buttons, a feature grid highlighting Kanban, sprints, roadmaps, and analytics, and a footer with branding. The design uses gradient buttons, Lucide icons, and Tailwind for responsive layout. The Navbar conditionally hides the "Switch Persona" button when isSignedIn is true, preventing identity state divergence between Clerk and the demo switcher.

<details>
<summary>Issues (4)</summary>

1. **Fallback user on /api/auth/me** — requireAuth() applied to /api/auth/me, but token absence returns a default user (Alex Rivera) instead of 401. Remove fallback or remove requireAuth() middleware.

2. **User array mutation in ClerkUserSync** — teamMembers.push(newUser) mutates ProjectContext state array directly. Use state setter or return a new array.

3. **Missing key validation on frontend** — AuthWrapper checks if publishableKey is falsy but doesn't validate the format or VITE_ prefix requirement.

4. **Custom auth API routes now unreachable** — /api/auth/signup, /api/auth/login, /api/auth/logout remain in server.ts but cannot work under Clerk's session model. Remove or clarify they're legacy/demo routes.

</details>

<details>
<summary>Details</summary>

## ClerkProvider boundary and gating

AuthWrapper wraps the entire app tree. It reads VITE_CLERK_PUBLISHABLE_KEY from import.meta.env, renders an error screen if missing, and otherwise renders ClerkProvider with that key. Below ClerkProvider, SignedOut renders HomePage, and SignedIn renders children (the dashboard via ProjectProvider → AppContent).

AuthWrapper sits above ProjectProvider in the tree (App → AuthWrapper → ProjectProvider → AppContent), so ProjectContext is only instantiated for authenticated users.

## User synchronization between Clerk and ProjectContext

ClerkUserSync is a React component rendered inside the SignedIn boundary. It uses useUser() from Clerk and useProject() from ProjectContext. A useEffect watches clerkUser and isLoaded; when the Clerk user is available, it searches teamMembers by email (case-insensitive). If no match is found, it creates a new user object from Clerk's data (id, fullName/firstName, primaryEmailAddress, imageUrl) and pushes it to the teamMembers array. It then calls switchUser() with the matched or newly created user.

**Concern:** The line `teamMembers.push(newUser)` mutates the ProjectContext state array directly. React state should be updated via setState or a reducer. This mutation may work in practice if switchUser triggers a re-render that captures the new array reference, but it's not idiomatic and could cause subtle bugs. Use a state setter or return a new array.

## Backend session validation and protected routes

server.ts imports clerkMiddleware and requireAuth from @clerk/express. clerkMiddleware() is applied globally with app.use(clerkMiddleware()).

requireAuth() is applied to three routes: GET /api/emails/outbox, POST /api/emails/send, and GET /api/auth/me. The first two prevent unauthorized access to email history or sending.

GET /api/auth/me has requireAuth() applied, but the handler checks for a token and falls back to returning a default user (user-2, Alex Rivera) if no token is present. requireAuth() should cause a 401 if the user is not authenticated, so the fallback branch is unreachable unless the middleware allows requests without a session. Either remove requireAuth() from this route (if the fallback is intentional for development) or remove the fallback logic (if the route should be fully protected).

Startup validation logs CLERK_SECRET_KEY presence and prefix. If the key is missing, the console will show an error immediately. The check doesn't cause the server to exit, which may be intentional for development flexibility, but production deploys should enforce this.

## Environment variable isolation

.env contains CLERK_SECRET_KEY and CLERK_PUBLISHABLE_KEY, and defines VITE_CLERK_PUBLISHABLE_KEY as the same value as CLERK_PUBLISHABLE_KEY. The VITE_ prefix is required for Vite to expose the variable to the frontend bundle.

The frontend (AuthWrapper.tsx) reads import.meta.env.VITE_CLERK_PUBLISHABLE_KEY. The backend (server.ts) reads process.env.CLERK_SECRET_KEY. The secret key is never referenced in frontend code, so it won't be bundled or exposed to the browser.

## Landing page design and UX

HomePage renders a full-screen layout with a hero section, feature grid, and footer. The hero has a gradient background (blue-600 → indigo-700), the VisionLogo component, a headline ("The Enterprise Project Suite Built for Speed"), a subheadline, and two buttons: "Get Started Free" (SignUpButton) and "Sign In" (SignInButton). Both buttons use mode="modal", so they open Clerk's pre-built modal UI instead of redirecting to a hosted sign-in page.

The feature grid has six cards (Kanban Board, Sprint Planning, Roadmap, Analytics, Automations, Team Collaboration), each with a gradient icon, a title, and a description. The cards are responsive (1 column on mobile, 2 on md, 3 on lg) and have hover shadow transitions.

mode="modal" keeps users on the same page and avoids redirect complexity. The gradient button for sign-up and the outlined button for sign-in provide clear visual hierarchy.

## Navbar integration with Clerk

Navbar imports UserButton and useUser from @clerk/clerk-react. UserButton is rendered in the right-hand action bar after the notifications popover. It displays the user's avatar and provides a dropdown menu with profile, settings, and sign-out options. The prop afterSignOutUrl="/" ensures that after sign-out, the user is redirected to the root, which triggers the SignedOut boundary and shows HomePage.

The "Switch Persona" button (which opened ClerkAuthModal for the demo user switcher) is now conditionally rendered: {!isSignedIn && <button>...</button>}. This hides the button when the user is authenticated via Clerk, preventing the demo switcher from conflicting with real auth state.

## Custom auth routes orphaned by Clerk

server.ts still defines /api/auth/signup, /api/auth/login, /api/auth/logout, and maintains in-memory clerkUsers and activeSessions data structures. These routes implement a custom email/password auth system with session tokens stored in a Map.

Under the Clerk integration, these routes are no longer used. The frontend never calls them; sign-in and sign-up flow through Clerk's hosted UI. The routes will respond if called directly (e.g., via curl), but they issue session tokens that Clerk doesn't recognize, so those tokens won't authenticate requests through requireAuth() middleware.

Either remove these routes and the in-memory data structures (if they're obsolete) or add comments clarifying they're legacy/demo routes. Leaving them in place without documentation is confusing: a future developer might assume they're part of the Clerk flow.

## Test coverage and verification

The verification notes indicate that bun run lint (tsc --noEmit) passed with exit code 0. The notes also list manual test cases: startup logs show the secret key prefix, unauthenticated requests to /api/emails/outbox and /api/emails/send return 401, Clerk sign-in syncs ProjectContext.currentUser, and the persona switcher is hidden when signed in.

No automated tests for the auth flow are included in this change. No test confirms that ClerkUserSync creates a new user when email doesn't match, or that requireAuth() actually rejects invalid tokens.

</details>

## File map

<details>
<summary>Files changed (5)</summary>

- **src/components/AuthWrapper.tsx** — Created: ClerkProvider wrapper, SignedIn/SignedOut gating, ClerkUserSync component, publishable key validation
- **src/components/HomePage.tsx** — Created: landing page with hero, feature grid, sign-up/sign-in buttons
- **src/App.tsx** — Wrapped ProjectProvider in AuthWrapper, moved app structure inside
- **src/components/Navbar.tsx** — Added UserButton, conditionally hide persona switcher when isSignedIn
- **server.ts** — Added clerkMiddleware, requireAuth on email routes, CLERK_SECRET_KEY startup validation
- **.env** — Added CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY, VITE_CLERK_PUBLISHABLE_KEY
- **src/components/VisionLogo.tsx** — (Referenced, not changed: provides logo for HomePage and Navbar)

Full diff available via: `git diff main`

</details>
