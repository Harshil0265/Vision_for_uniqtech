# Vision

Project and sprint management application with a React + TypeScript frontend and a `.NET 8` Web API backend connected to Microsoft SQL Server.

| Part | Stack | Location |
|---|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Axios, React Toastify | `src/` |
| Backend | .NET 8 Web API, Entity Framework Core, JWT Bearer Auth, Swagger | `backend/Vision.API/` |
| Database | Microsoft SQL Server | `docs/Vision_MSSQL_Proper_Schema.sql` |

## Prerequisites

- **Node.js** 20+
- **.NET 8 SDK / Runtime**
- **Microsoft SQL Server** with [docs/Vision_MSSQL_Proper_Schema.sql](docs/Vision_MSSQL_Proper_Schema.sql) executed

## Quick Start

### 1. Run the .NET Backend API

```bash
dotnet run --project backend/Vision.API --launch-profile http
```

- API Base URL: `http://localhost:5286/api/`
- Swagger UI: `http://localhost:5286/swagger`

### 2. Run the React Frontend

```bash
npm install
npm run dev
```

- Frontend URL: `http://localhost:5173` (or `http://127.0.0.1:5173`)
- Optional: copy `.env.example` to `.env.local` if your backend runs on a different port.

## Implemented API Endpoints

| Controller | Endpoints |
|---|---|
| `AuthController` (`/api/Auth`) | `POST signup`, `POST login`, `POST logout`, `GET me` |
| `ProjectController` (`/api/Project`) | `GET GetUsers`, `GET GetProjectList`, `GET GetProjectById/{id}`, `POST SaveProject`, `PUT UpdateProject/{id}`, `DELETE DeleteProject/{id}` |
| `WorkItemController` (`/api/WorkItem`) | `GET GetLookups`, `GET GetWorkItemList`, `GET GetWorkItemById/{id}`, `POST SaveWorkItem`, `PUT UpdateWorkItem/{id}`, `DELETE DeleteWorkItem/{id}` |

## Frontend Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | TypeScript type-check (`tsc --noEmit`) |
