# Vision (OmniPlane)

Enterprise project and sprint management: Kanban boards, backlogs, sprints, issue tracking, project-based access control (owner / admin / member / viewer) and an analytics dashboard.

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Motion, lucide-react |
| Auth | JWT access tokens + rotating refresh-token sessions (`jsonwebtoken`, `bcryptjs`) |
| Backend | Node.js, Express 4 (`server.ts`), sign-in only |
| Storage | Accounts: local JSON file (`.data/auth.json`). Projects, issues, sprints, attachments: browser localStorage |
| External APIs | None |

## Run locally

**Prerequisites:** Node.js

1. Install dependencies: `npm install`
2. Optional: copy `.env.example` to `.env` (only needed to set `JWT_ACCESS_SECRET`, which is required in production).
3. Start the frontend and API together: `npm run dev`
   - Frontend: http://localhost:5173
   - API: http://localhost:3000

See [START-HERE.md](START-HERE.md) and [SETUP.md](SETUP.md) for details.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Run Vite and the API server together |
| `npm run build` | Production frontend build into `dist/` |
| `npm start` | Run the auth server (serves `dist/` in production) |
| `npm run lint` | Type-check with `tsc --noEmit` |
| `npm run test:auth` | Self-test of token/session security logic |
| `npm run auth:secret` | Generate a value for `JWT_ACCESS_SECRET` |

## Authentication

- **Access token:** short-lived JWT (15 min, HS256, pinned algorithm, issuer/audience checked) held in browser memory and sent as `Authorization: Bearer`.
- **Refresh token:** random 256-bit secret in an `httpOnly`, `SameSite=Strict` cookie scoped to `/api/auth`. Only its SHA-256 is stored. It rotates on every use; replaying an old one revokes the whole session.
- **Sessions:** one record per login in the auth data file (7-day sliding refresh, 30-day hard limit). Users can list and revoke devices, sign out everywhere, and changing the password signs out all other devices.
- **Passwords:** bcrypt (cost 12), 10-72 characters with a letter and a number.
- **Abuse protection:** per-IP and per-account login throttling, constant-time-style responses for unknown emails, CSRF header on cookie endpoints.
