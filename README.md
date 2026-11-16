# Vision

Project and sprint management: home page, sign-up and sign-in, dashboard, projects, project members and roles, Kanban board, backlog and sprints, work items, analytics, team directory, and profile settings.

| Part | Stack | Folder |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS | `src/` |
| Backend | .NET 8 Web API | `backend/` (see [backend/README.md](backend/README.md)) |
| Database | Microsoft SQL Server | `backend/Vision.Data` |

## Run the frontend

**Prerequisite:** Node.js 20 or newer.

```bash
npm install
npm run dev        # opens http://localhost:5173 (also reachable as http://127.0.0.1:5173)
```

| Address | Page |
|---|---|
| `/` | Home page (signed-in users see an "Open dashboard" button) |
| `/app` | The workspace (dashboard, board, backlog, members, …); signed-out visitors are sent to sign in |
| `/reset-password?token=…` | Password reset link from email |

When hosting the production build (`dist/`), configure the web server to serve `index.html` for these paths (SPA fallback).

The frontend calls the API at `/api`, which Vite forwards to `http://localhost:5286` (the .NET `http` launch profile). Start the API with:

```bash
dotnet run --project backend/Vision.API --launch-profile http
```

**Without the backend:** in development, if the API can't be reached, sign-in falls back to **offline demo mode** with local accounts. The footer and account menu show this. Every page still works, and data is saved in the browser. Demo accounts (the same as the mock API's): `test@test.com` / `test`, `alex@vision.dev` / `password123`, `sarah@vision.dev` / `password123`. To change this behaviour, set `VITE_AUTH_MODE` (see [.env.example](.env.example)).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run lint` | Type-check (`tsc --noEmit`) |

## For backend and database developers

[docs/API_CONTRACT.md](docs/API_CONTRACT.md) lists every form, its fields and validation, and the endpoint and JSON the frontend expects. The same shapes are typed in [src/types/api.ts](src/types/api.ts).
