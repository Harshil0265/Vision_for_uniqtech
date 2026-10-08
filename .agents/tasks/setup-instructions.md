# Supabase Setup Instructions

This guide will help you set up Supabase as the database backend for the Vision project management system. Supabase integration is **optional** - the application will work with localStorage if Supabase is not configured.

## Prerequisites

- A Supabase account (free tier available at [supabase.com](https://supabase.com))
- Access to the project's `.env` file

## Step-by-Step Setup

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in or create an account
2. Click **"New Project"** from your dashboard
3. Fill in the project details:
   - **Name**: Vision Project Management (or your preferred name)
   - **Database Password**: Choose a strong password and save it securely
   - **Region**: Select the region closest to your users
4. Click **"Create new project"** and wait for provisioning (takes 1-2 minutes)

### 2. Run the Database Migration

1. Once your project is ready, navigate to the **SQL Editor** in the left sidebar
2. Click **"New query"** to open a blank SQL editor
3. Open the file `.agents/tasks/supabase-schema.sql` from this project
4. Copy the entire contents of `supabase-schema.sql`
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter) to execute the migration
7. Verify success - you should see a success message and no errors

### 3. Get Your API Keys

1. In your Supabase project dashboard, click on **Settings** (gear icon) in the left sidebar
2. Navigate to **API** under the Project Settings section
3. You'll see two important values:
   - **Project URL**: This is your `VITE_SUPABASE_URL`
   - **anon public**: This is your `VITE_SUPABASE_ANON_KEY`
4. Copy both values - you'll need them in the next step

### 4. Configure Environment Variables

1. In your project root, create a `.env` file if it doesn't exist (or copy from `.env.example`)
2. Add the following lines with your actual values from Step 3:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Save the `.env` file

**Important**: Never commit the `.env` file to version control. It's already in `.gitignore`.

### 5. Restart the Development Server

1. If the dev server is running, stop it (Ctrl+C)
2. Start it again with:

```bash
npm run dev
```

3. The application will now connect to Supabase instead of using localStorage

## Verification

To verify that Supabase is working correctly:

1. Check the browser console - you should see "Supabase client initialized" (or no warning about localStorage fallback)
2. Create a new project in the application
3. Go to your Supabase dashboard → **Table Editor**
4. You should see the new project in the `projects` table

## Row Level Security (RLS)

The migration includes Row Level Security policies that ensure:

- Users can only see projects they own or are invited to
- Users can only modify data in projects where they have appropriate permissions
- Project members are restricted based on their role (owner, admin, member, viewer)

## Troubleshooting

### "Failed to initialize Supabase client"

- Verify your environment variables are correctly set in `.env`
- Ensure there are no extra spaces or quotes around the values
- Restart the dev server after changing `.env`

### "relation does not exist" errors

- Make sure you ran the complete SQL migration in Step 2
- Check the Supabase SQL Editor for any error messages during migration

### Authentication Issues

- Ensure Clerk authentication is properly configured (see Clerk setup docs)
- Verify that user profiles are being synced to the `users` table

## Next Steps

Once Supabase is set up:

- User profiles will be automatically synced from Clerk to Supabase
- All project data will persist in Supabase instead of localStorage
- Row Level Security ensures users only access their permitted data
- You can view and manage data directly in the Supabase dashboard

## Reverting to localStorage

If you need to temporarily disable Supabase and revert to localStorage:

1. Remove or comment out the Supabase environment variables in `.env`:

```env
# VITE_SUPABASE_URL=https://your-project-ref.supabase.co
# VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

2. Restart the dev server

The application will automatically detect the missing variables and fall back to localStorage.
