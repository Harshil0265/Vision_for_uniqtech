# Vision Project Management - Setup Guide

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Clerk account (for authentication)
- Supabase account (for database)

---

## 1️⃣ Clone and Install

```bash
git clone https://github.com/Harshil0265/Vision_for_uniqtech.git
cd Vision_for_uniqtech
npm install
```

---

## 2️⃣ Set Up Clerk Authentication

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your publishable key from the Clerk dashboard
4. You already have your keys configured ✅

---

## 3️⃣ Set Up Supabase Database

### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project: **vision-project-management**
3. Save your database password
4. Wait 2 minutes for setup

### B. Run Database Schema
1. In Supabase dashboard, go to **SQL Editor**
2. Copy all SQL from `.agents/tasks/supabase-schema.sql`
3. Paste and click **RUN**
4. Verify tables created: `users`, `projects`, `project_members`, `issues`, `sprints`, `comments`

### C. Configure Environment Variables
Your `.env` file is already configured with:
- ✅ Clerk keys
- ✅ Supabase URL: `https://ytitgadyvqyxpwyrpusf.supabase.co`
- ✅ Supabase keys (anon + service_role)

---

## 4️⃣ Run the Application

```bash
# Development mode (runs both frontend and backend)
npm run dev

# This will start:
# - Frontend (Vite) on http://localhost:5173
# - Backend (Express API) on http://localhost:3000

# Production build
npm run build
```

Open: `http://localhost:5173`

**Note:** The `npm run dev` command uses `concurrently` to run both servers simultaneously. You'll see output from both servers with color-coded prefixes (VITE in cyan, API in magenta).

---

## 🎯 Features Enabled

### ✅ Multi-User Access Control
- **Owner**: Full control, can delete projects, invite/remove members
- **Admin**: Can manage issues, sprints, invite members
- **Member**: Can create/edit issues, add comments
- **Viewer**: Read-only access

### ✅ Project Invitations
1. Create a project (you become Owner)
2. Click "Invite Members" button
3. Enter email address and select role
4. User receives access to that project only

### ✅ User-Specific Views
- New users see **empty state** with "Create Project" button
- Users only see projects they created or were invited to
- No demo data shown to new users
- Complete project isolation

---

## 🧪 Testing Multi-User Setup

### Test with 2 Users:

**User A:**
1. Sign up at `http://localhost:5173`
2. Create project "Marketing Website"
3. Click "Invite Members"
4. Invite User B (userb@example.com) as "Admin"

**User B:**
1. Sign up with userb@example.com
2. Should see only "Marketing Website" project
3. Should be able to create issues, invite members
4. Should NOT see User A's other projects

---

## 📁 Project Structure

```
vision-for-uniqtech/
├── src/
│   ├── components/
│   │   ├── InviteMemberModal.tsx    # Invite users to projects
│   │   ├── ProjectsView.tsx          # Project list view
│   │   ├── KanbanBoard.tsx           # Issue board
│   │   └── ...
│   ├── context/
│   │   └── ProjectContext.tsx        # Global state management
│   ├── lib/
│   │   └── supabase.ts               # Supabase client
│   ├── utils/
│   │   └── permissions.ts            # Role-based checks
│   └── types/
│       └── index.ts                  # TypeScript types
├── .agents/tasks/
│   └── supabase-schema.sql           # Database schema
├── .env                               # Your config (not in git)
└── .env.example                       # Template
```

---

## 🔐 Security Features

- **Row Level Security (RLS)** enabled on all tables
- Users can only query their own projects
- Clerk JWT authentication on all endpoints
- Service role key used only for admin operations
- Anon key used for client-side queries

---

## 🐛 Troubleshooting

### "Cannot read properties of undefined"
- Make sure Supabase SQL schema is run
- Check `.env` has correct keys
- Restart dev server after changing `.env`

### "No projects showing"
- For new users: This is correct! Click "Create Project"
- Check browser console for errors
- Verify Supabase connection in Network tab

### "Invite not working"
- User must sign up with exact email you invited
- Check Supabase `project_members` table for entry
- Verify RLS policies are enabled

---

## 📞 Support

- Issues: https://github.com/Harshil0265/Vision_for_uniqtech/issues
- Supabase Docs: https://supabase.com/docs
- Clerk Docs: https://clerk.com/docs

---

## 🎉 You're All Set!

Your Vision project management system is ready with:
✅ User authentication (Clerk)
✅ Real database (Supabase)
✅ Access control (RLS policies)
✅ Multi-user collaboration
✅ Project invitations
✅ Role-based permissions

Happy project managing! 🚀

---

## Running the Development Environment

This project runs both frontend and backend servers with a **single command**:

```bash
npm run dev
```

This will automatically start:
- **Backend API** (Express) on port 3000
- **Frontend** (Vite) on port 5173

Open http://localhost:5173 in your browser.

> **Behind the scenes:** The `npm run dev` command uses `concurrently` to run both servers simultaneously. You'll see output from both with color-coded prefixes (VITE in cyan, API in magenta). Vite proxies all `/api/*` requests to `http://localhost:3000`.

### Alternative: Run Servers Separately

If you prefer to run servers in separate terminals:

**Terminal 1 — Backend API:**
```bash
npm run dev:server
```

**Terminal 2 — Frontend:**
```bash
npm run dev:frontend
```

### Inviting Members

For invitations to work you need:
1. Both servers running (`npm run dev` handles this automatically)
2. A valid Supabase project with the schema applied (see Supabase Setup section)
3. The `.env` file populated with your Supabase URL and keys
