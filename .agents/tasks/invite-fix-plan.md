# Member Invitation Network Error Fix - Implementation Plan

## Problem Analysis

### Root Causes Identified

1. **Auth Middleware Mismatch**: The invite endpoint uses `requireAuth()` Clerk middleware, but the frontend sends fake session tokens like `'sess_clerk_live_alex_rivera'` that Clerk's real SDK rejects → 401/500 errors → frontend catches as "network error"

2. **URL Path Mismatch**: `updateMemberRole` calls `/api/projects/:id/members/:userId/role` but server registers `PATCH /api/projects/:id/members/:userId` (missing `/role` suffix)

3. **Response Field Mismatch**: Invite endpoint returns `result.members` (array) but frontend expects `result.member` (singular) in ProjectContext.tsx line ~951

4. **Non-existent User Rejection**: Invite endpoint requires invitee to exist in Supabase `users` table. New users who haven't signed up are rejected with 404. No invitation token/pending invite mechanism exists.

5. **No Email Notification System**: No way to notify invited users via email (nodemailer was previously removed from the project)

---

## Implementation Plan

### PHASE 1: Fix Authentication & Existing Endpoints

#### Item 1: Create hybrid auth middleware
**What**: Add `src/middleware/hybridAuth.ts` that accepts EITHER real Clerk JWT OR custom session tokens from the `activeSessions` map. This allows both real authenticated users and the demo users with fake tokens to access protected endpoints.

**Implementation**:
```typescript
// src/middleware/hybridAuth.ts
import type { Request, Response, NextFunction } from 'express';
import type { SessionAuthObject } from '@clerk/express';

interface AuthRequest extends Request {
  auth: SessionAuthObject;
  customUserId?: string;
}

interface ActiveSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export function createHybridAuthMiddleware(activeSessions: Map<string, ActiveSession>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthRequest;
    
    // 1. Check if Clerk auth succeeded
    if (authReq.auth?.userId) {
      return next();
    }

    // 2. Fallback: check for custom session token
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (token && activeSessions.has(token)) {
      const session = activeSessions.get(token)!;
      
      // Check expiry
      if (new Date(session.expiresAt) < new Date()) {
        return res.status(401).json({ success: false, error: 'Session expired' });
      }

      // Attach custom user ID to request
      authReq.customUserId = session.userId;
      return next();
    }

    // 3. No valid auth
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  };
}
```

**Files**: 
- Create: `h:\vision for uniqtech\src\middleware\hybridAuth.ts`

**Verify**: `npx tsx --check src/middleware/hybridAuth.ts` — no TypeScript errors

---

#### Item 2: Update server.ts to use hybrid auth and fix helper functions
**What**: Replace `requireAuth()` with `hybridAuth` middleware on invite/member endpoints. Update `getSupabaseUserId` to handle both Clerk users and custom session users by looking up via email from the `clerkUsers` array.

**Implementation**:
```typescript
// At top of server.ts, after activeSessions initialization
import { createHybridAuthMiddleware } from './src/middleware/hybridAuth.js';
const hybridAuth = createHybridAuthMiddleware(activeSessions);

// Update getSupabaseUserId helper to handle custom session users
async function getSupabaseUserId(clerkUserId: string | undefined, customUserId: string | undefined): Promise<string | null> {
  if (!supabase) return null;
  
  // Try Clerk user ID first
  if (clerkUserId) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();
    
    if (data) return (data as any).id;
  }

  // Fallback: custom session user - lookup by email
  if (customUserId) {
    const customUser = clerkUsers.find(u => u.id === customUserId);
    if (customUser) {
      const { data } = await supabase
        .from('users')
        .select('id')
        .eq('email', customUser.email)
        .single();
      
      if (data) return (data as any).id;
    }
  }

  return null;
}

// Update all endpoint auth middleware calls from:
// app.post('/api/projects/:id/invite', requireAuth(), upsertClerkUser, async (req, res) => {

// To:
// app.post('/api/projects/:id/invite', hybridAuth, upsertClerkUser, async (req, res) => {

// Update all getSupabaseUserId calls from:
// const supabaseUserId = await getSupabaseUserId(clerkUserId);

// To:
// const supabaseUserId = await getSupabaseUserId(authReq.auth?.userId, authReq.customUserId);
```

**Files**: 
- Modify: `h:\vision for uniqtech\server.ts`
  - Lines 1-50: Add hybridAuth import and initialization
  - Lines ~170-195: Update `getSupabaseUserId` function signature and logic
  - Lines ~280, ~340, ~410, ~450, ~510, ~570, ~650, ~750, ~850, ~920: Replace `requireAuth()` with `hybridAuth` on all protected endpoints
  - All calls to `getSupabaseUserId`: Add second parameter `authReq.customUserId`

**Verify**: `npm run lint` — no TypeScript errors

---

#### Item 3: Fix PATCH endpoint path mismatch
**What**: Server endpoint is `PATCH /api/projects/:id/members/:userId` but frontend calls `/api/projects/:id/members/:userId/role`. Add `/role` suffix to server route OR remove it from frontend call. Decision: Remove from frontend (cleaner REST pattern).

**Implementation**:
```typescript
// In ProjectContext.tsx, updateMemberRole function (around line 1020)
// Change:
const response = await fetch(`/api/projects/${projectId}/members/${userId}/role`, {

// To:
const response = await fetch(`/api/projects/${projectId}/members/${userId}`, {
```

**Files**: 
- Modify: `h:\vision for uniqtech\src\context\ProjectContext.tsx`
  - Line ~1020: Remove `/role` suffix from fetch URL

**Verify**: Search project for `/role` endpoint references: `npm run dev` then test role update in UI

---

#### Item 4: Fix response field mismatch in inviteMember
**What**: Backend returns `result.members` (array) but frontend code at line ~951 tries to use `result.member` (singular). The backend actually returns the full members array after adding. Frontend should use `result.members` and replace the entire members array OR backend should return just the new member. Decision: Backend returns `{ success: true, member: newMemberObject }` for consistency.

**Implementation**:
```typescript
// In server.ts, POST /api/projects/:id/invite endpoint (around line 340)
// Change the final response from:
res.json({ success: true, members: members || [] });

// To:
// Get the newly added member
const { data: newMember } = await supabase
  .from('project_members')
  .select(`
    id,
    user_id,
    project_id,
    role,
    invited_at,
    user:users!project_members_user_id_fkey(id, name, email, avatar, role, department)
  `)
  .eq('project_id', projectId)
  .eq('user_id', (invitedUser as any).id)
  .single();

res.json({ success: true, member: newMember || null });
```

**Files**: 
- Modify: `h:\vision for uniqtech\server.ts`
  - Lines ~360-375: Update invite endpoint response to return single `member` object instead of full `members` array

**Verify**: Test invite in UI, check browser network tab for response structure

---

### PHASE 2: Add Invitation Token System for Non-Existent Users

#### Item 5: Add invitation_tokens table to Supabase schema
**What**: Create `invitation_tokens` table to store pending invitations for users who haven't signed up yet. Includes token, email, project_id, role, invited_by, expiry, and used status.

**Implementation**:
```sql
-- Add to supabase-schema.sql

-- =====================================================
-- INVITATION_TOKENS TABLE
-- =====================================================
-- Stores pending invitations for users who don't have accounts yet
CREATE TABLE IF NOT EXISTS invitation_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  used BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_invitation_tokens_token ON invitation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_email ON invitation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_invitation_tokens_project_id ON invitation_tokens(project_id);

-- RLS policies for invitation_tokens
ALTER TABLE invitation_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view invitations sent to their email
CREATE POLICY "invitation_tokens_select_policy" ON invitation_tokens
  FOR SELECT
  USING (
    email = (SELECT email FROM users WHERE clerk_user_id = auth.uid()::text)
    OR invited_by = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
  );

-- Project admins/owners can create invitation tokens
CREATE POLICY "invitation_tokens_insert_policy" ON invitation_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM project_members
      WHERE project_members.project_id = invitation_tokens.project_id
        AND project_members.user_id = (SELECT id FROM users WHERE clerk_user_id = auth.uid()::text)
        AND project_members.role IN ('owner', 'admin')
    )
  );

-- Only the system can update invitation tokens (mark as used)
CREATE POLICY "invitation_tokens_update_policy" ON invitation_tokens
  FOR UPDATE
  USING (true);
```

**Files**: 
- Modify: `h:\vision for uniqtech\.agents\tasks\supabase-schema.sql`
  - Add after line ~215 (after comments table)

**Verify**: Run the new SQL in Supabase SQL Editor, check Tables section for `invitation_tokens`

---

#### Item 6: Update invite endpoint to handle non-existent users
**What**: When invitee email is not found, instead of returning 404, create an invitation token, store it in DB, and return success with `emailOnly: true` flag so frontend knows the user hasn't signed up yet.

**Implementation**:
```typescript
// In server.ts, POST /api/projects/:id/invite endpoint (around line 340)
// Replace the 404 return with token generation:

// After: Look up invited user by email
const { data: invitedUser, error: userError } = await supabase
  .from('users')
  .select('id')
  .eq('email', email)
  .single();

if (userError || !invitedUser) {
  // User doesn't exist yet - create invitation token
  const token = `invite_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const { error: tokenError } = await supabase
    .from('invitation_tokens')
    .insert({
      token,
      email,
      project_id: projectId,
      role,
      invited_by: supabaseUserId,
      expires_at: expiresAt.toISOString(),
      used: false
    } as any);

  if (tokenError) {
    console.error('[Supabase] Error creating invitation token:', tokenError);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create invitation' 
    });
  }

  // Return success with emailOnly flag
  return res.json({ 
    success: true, 
    emailOnly: true,
    token,
    message: 'Invitation sent. User will be added when they sign up.' 
  });
}

// Continue with existing logic for existing users...
```

**Files**: 
- Modify: `h:\vision for uniqtech\server.ts`
  - Lines ~350-365: Replace 404 error with invitation token creation

**Verify**: Test inviting non-existent email, check `invitation_tokens` table in Supabase

---

### PHASE 3: Add Email Notification with Gmail SMTP

#### Item 7: Install nodemailer and types
**What**: Add nodemailer back to the project for sending invitation emails via Gmail SMTP.

**Implementation**:
```bash
npm install nodemailer
npm install --save-dev @types/nodemailer
```

**Files**: 
- Modify: `h:\vision for uniqtech\package.json` (automatic via npm install)

**Verify**: `npm list nodemailer @types/nodemailer` — shows installed versions

---

#### Item 8: Create email service module
**What**: Create `src/lib/emailService.ts` with Gmail SMTP configuration using nodemailer. Includes `sendInvitationEmail` function that sends HTML email with project details and accept invitation link.

**Implementation**:
```typescript
// src/lib/emailService.ts
import nodemailer from 'nodemailer';

interface InvitationEmailData {
  recipientEmail: string;
  recipientName?: string;
  inviterName: string;
  projectName: string;
  projectKey: string;
  role: string;
  token?: string; // For new users who need to sign up
  appUrl: string;
}

export async function sendInvitationEmail(data: InvitationEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const {
      recipientEmail,
      recipientName,
      inviterName,
      projectName,
      projectKey,
      role,
      token,
      appUrl
    } = data;

    // Create transporter with Gmail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    // Determine the action link
    let actionLink: string;
    let actionText: string;
    
    if (token) {
      // New user - needs to sign up first
      actionLink = `${appUrl}/accept-invite?token=${token}`;
      actionText = 'Sign Up & Accept Invitation';
    } else {
      // Existing user - can just login
      actionLink = `${appUrl}/login`;
      actionText = 'Login to View Project';
    }

    // Email HTML template
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Invitation</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); padding: 40px 32px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
        Vision Project Management
      </h1>
    </div>

    <!-- Content -->
    <div style="padding: 40px 32px;">
      <h2 style="margin: 0 0 16px 0; color: #1e293b; font-size: 22px; font-weight: 600;">
        You've been invited! 🎉
      </h2>
      
      <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
        ${recipientName ? `Hi ${recipientName},` : 'Hello!'}
      </p>
      
      <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
        <strong>${inviterName}</strong> has invited you to join the project:
      </p>

      <!-- Project Card -->
      <div style="background-color: #f1f5f9; border-left: 4px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 0 0 24px 0;">
        <div style="color: #1e293b; font-size: 18px; font-weight: 600; margin-bottom: 8px;">
          ${projectName}
        </div>
        <div style="color: #64748b; font-size: 14px; margin-bottom: 12px;">
          Project Key: <strong>${projectKey}</strong>
        </div>
        <div style="display: inline-block; background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Role: ${role.charAt(0).toUpperCase() + role.slice(1)}
        </div>
      </div>

      <p style="margin: 0 0 24px 0; color: #475569; font-size: 16px; line-height: 1.6;">
        ${token 
          ? 'Click the button below to create your account and accept the invitation:'
          : 'Click the button below to login and start collaborating:'
        }
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${actionLink}" 
           style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
          ${actionText}
        </a>
      </div>

      ${token 
        ? `<p style="margin: 24px 0 0 0; color: #94a3b8; font-size: 14px; line-height: 1.6; text-align: center;">
             This invitation expires in 7 days.
           </p>`
        : ''
      }
    </div>

    <!-- Footer -->
    <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="margin: 0 0 8px 0; color: #94a3b8; font-size: 14px;">
        This email was sent by Vision Project Management
      </p>
      <p style="margin: 0; color: #cbd5e1; font-size: 12px;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>

  </div>
</body>
</html>
    `;

    // Plain text fallback
    const textContent = `
Vision Project Management

You've been invited!

${recipientName ? `Hi ${recipientName},` : 'Hello!'}

${inviterName} has invited you to join the project: ${projectName} [${projectKey}]

Your role: ${role.charAt(0).toUpperCase() + role.slice(1)}

${token 
  ? `Click this link to create your account and accept the invitation:\n${actionLink}\n\nThis invitation expires in 7 days.`
  : `Click this link to login and start collaborating:\n${actionLink}`
}

---
This email was sent by Vision Project Management.
If you didn't expect this invitation, you can safely ignore this email.
    `;

    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'Vision PM'}" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `Invitation to join ${projectName} on Vision`,
      text: textContent,
      html: htmlContent
    });

    console.log(`[Email] Invitation sent to ${recipientEmail}, Message ID: ${info.messageId}`);
    return { success: true };

  } catch (error) {
    console.error('[Email] Failed to send invitation:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send email' 
    };
  }
}
```

**Files**: 
- Create: `h:\vision for uniqtech\src\lib\emailService.ts`

**Verify**: `npx tsx --check src/lib/emailService.ts` — no TypeScript errors

---

#### Item 9: Integrate email sending in invite endpoint
**What**: After successfully adding member OR creating invitation token, send invitation email using the emailService. Handle both existing user and new user cases.

**Implementation**:
```typescript
// In server.ts, POST /api/projects/:id/invite endpoint
// Add import at top:
import { sendInvitationEmail } from './src/lib/emailService.js';

// After successfully creating invitation token (line ~365):
if (userError || !invitedUser) {
  // ... existing token creation code ...
  
  // Send invitation email for new user
  const { data: project } = await supabase
    .from('projects')
    .select('name, key')
    .eq('id', projectId)
    .single();

  const { data: inviter } = await supabase
    .from('users')
    .select('name')
    .eq('id', supabaseUserId)
    .single();

  await sendInvitationEmail({
    recipientEmail: email,
    inviterName: (inviter as any)?.name || 'A team member',
    projectName: (project as any)?.name || 'Project',
    projectKey: (project as any)?.key || 'PROJ',
    role,
    token, // Include token for sign-up flow
    appUrl: process.env.APP_URL || 'http://localhost:5173'
  });

  return res.json({ 
    success: true, 
    emailOnly: true,
    token,
    message: 'Invitation sent. User will be added when they sign up.' 
  });
}

// After successfully adding existing user (line ~395):
// ... existing member add code ...

// Send invitation email for existing user
const { data: project } = await supabase
  .from('projects')
  .select('name, key')
  .eq('id', projectId)
  .single();

const { data: inviter } = await supabase
  .from('users')
  .select('name')
  .eq('id', supabaseUserId)
  .single();

const { data: inviteeUser } = await supabase
  .from('users')
  .select('name')
  .eq('id', (invitedUser as any).id)
  .single();

await sendInvitationEmail({
  recipientEmail: email,
  recipientName: (inviteeUser as any)?.name,
  inviterName: (inviter as any)?.name || 'A team member',
  projectName: (project as any)?.name || 'Project',
  projectKey: (project as any)?.key || 'PROJ',
  role,
  appUrl: process.env.APP_URL || 'http://localhost:5173'
});

// ... rest of existing code ...
```

**Files**: 
- Modify: `h:\vision for uniqtech\server.ts`
  - Line ~10: Add emailService import
  - Lines ~365-375: Add email sending for new users
  - Lines ~395-410: Add email sending for existing users

**Verify**: Test invite, check server logs for email sent confirmation

---

### PHASE 4: Add Invitation Acceptance Flow

#### Item 10: Add accept invitation endpoint
**What**: Create `GET /api/invitations/:token` endpoint that verifies token, creates user if needed, adds to project_members, marks token as used, and returns project details.

**Implementation**:
```typescript
// In server.ts, after other invitation-related endpoints

// Accept Invitation Token
app.get('/api/invitations/:token', async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const { token } = req.params;

    // Get invitation token details
    const { data: invitation, error: inviteError } = await supabase
      .from('invitation_tokens')
      .select(`
        *,
        project:projects!invitation_tokens_project_id_fkey(id, name, key),
        inviter:users!invitation_tokens_invited_by_fkey(name)
      `)
      .eq('token', token)
      .eq('used', false)
      .single();

    if (inviteError || !invitation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid or expired invitation token' 
      });
    }

    // Check if token expired
    if (new Date((invitation as any).expires_at) < new Date()) {
      return res.status(410).json({ 
        success: false, 
        error: 'This invitation has expired' 
      });
    }

    res.json({
      success: true,
      invitation: {
        email: (invitation as any).email,
        project: (invitation as any).project,
        role: (invitation as any).role,
        inviterName: (invitation as any).inviter?.name
      }
    });
  } catch (error) {
    console.error('[API] Error verifying invitation token:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Redeem Invitation Token (after sign up)
app.post('/api/invitations/:token/redeem', hybridAuth, upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const { token } = req.params;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Get invitation token details
    const { data: invitation, error: inviteError } = await supabase
      .from('invitation_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (inviteError || !invitation) {
      return res.status(404).json({ 
        success: false, 
        error: 'Invalid or already used invitation token' 
      });
    }

    // Check if token expired
    if (new Date((invitation as any).expires_at) < new Date()) {
      return res.status(410).json({ 
        success: false, 
        error: 'This invitation has expired' 
      });
    }

    // Verify user email matches invitation
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', supabaseUserId)
      .single();

    if ((user as any)?.email !== (invitation as any).email) {
      return res.status(403).json({ 
        success: false, 
        error: 'This invitation was sent to a different email address' 
      });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', (invitation as any).project_id)
      .eq('user_id', supabaseUserId)
      .single();

    if (existingMember) {
      // Mark token as used and return success
      await supabase
        .from('invitation_tokens')
        .update({ used: true, used_at: new Date().toISOString() } as any)
        .eq('id', (invitation as any).id);

      return res.json({ 
        success: true, 
        message: 'You are already a member of this project',
        alreadyMember: true 
      });
    }

    // Add user to project
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: (invitation as any).project_id,
        user_id: supabaseUserId,
        role: (invitation as any).role,
        invited_by: (invitation as any).invited_by
      } as any);

    if (memberError) {
      console.error('[Supabase] Error adding member:', memberError);
      return res.status(400).json({ success: false, error: memberError.message });
    }

    // Mark token as used
    await supabase
      .from('invitation_tokens')
      .update({ used: true, used_at: new Date().toISOString() } as any)
      .eq('id', (invitation as any).id);

    res.json({ 
      success: true, 
      message: 'Successfully joined the project',
      projectId: (invitation as any).project_id
    });
  } catch (error) {
    console.error('[API] Error redeeming invitation token:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});
```

**Files**: 
- Modify: `h:\vision for uniqtech\server.ts`
  - Add after line ~450 (after other invite endpoints)

**Verify**: Test endpoint with curl: `curl http://localhost:3000/api/invitations/test_token_here`

---

#### Item 11: Add frontend invitation acceptance page/flow
**What**: Create a simple component or add logic to App.tsx to detect `/accept-invite?token=xxx` URL parameter, call the verify endpoint, show invitation details, and prompt user to sign up if not logged in, or redeem immediately if logged in.

**Implementation**:
```typescript
// Add to src/App.tsx or create src/components/AcceptInvite.tsx

// In App.tsx, add useEffect to check for invitation token on mount
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  
  if (token && window.location.pathname === '/accept-invite') {
    handleInvitationAcceptance(token);
  }
}, []);

const handleInvitationAcceptance = async (token: string) => {
  try {
    // First verify the token
    const verifyRes = await fetch(`/api/invitations/${token}`);
    const verifyData = await verifyRes.json();
    
    if (!verifyData.success) {
      alert(verifyData.error || 'Invalid invitation');
      window.location.href = '/';
      return;
    }

    // Check if user is logged in
    const { clerkSession } = useProject();
    
    if (!clerkSession) {
      // Not logged in - show auth modal with pre-filled email
      setAuthModalEmail(verifyData.invitation.email);
      setIsAuthModalOpen(true);
      // Store token to redeem after signup
      sessionStorage.setItem('pendingInviteToken', token);
      return;
    }

    // User is logged in - redeem immediately
    const redeemRes = await fetch(`/api/invitations/${token}/redeem`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSession.token}`,
        'Content-Type': 'application/json'
      }
    });

    const redeemData = await redeemRes.json();
    
    if (redeemData.success) {
      alert(`Successfully joined ${verifyData.invitation.project.name}!`);
      // Refresh projects and redirect
      window.location.href = '/';
    } else {
      alert(redeemData.error || 'Failed to accept invitation');
    }
  } catch (error) {
    console.error('Error accepting invitation:', error);
    alert('Failed to process invitation');
  }
};

// Also add to clerkSignUp success handler:
const result = await clerkSignUp(data);
if (result.success) {
  // Check for pending invitation
  const pendingToken = sessionStorage.getItem('pendingInviteToken');
  if (pendingToken) {
    sessionStorage.removeItem('pendingInviteToken');
    // Redeem the invitation
    await fetch(`/api/invitations/${pendingToken}/redeem`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${result.session.token}`,
        'Content-Type': 'application/json'
      }
    });
  }
}
```

**Files**: 
- Modify: `h:\vision for uniqtech\src\App.tsx`
  - Add invitation handling logic in useEffect
  - Add handleInvitationAcceptance function
  - Update clerkSignUp success handler to check for pending invitation

**Verify**: Visit `http://localhost:5173/accept-invite?token=test_token` and verify flow

---

### PHASE 5: Environment Configuration & Documentation

#### Item 12: Update .env and .env.example with SMTP variables
**What**: Add Gmail SMTP configuration variables to both .env files.

**Implementation**:
```bash
# Add to .env and .env.example:

# Gmail SMTP Configuration (for sending invitation emails)
# To use Gmail:
# 1. Enable 2-factor authentication on your Google account
# 2. Generate an "App Password" at https://myaccount.google.com/apppasswords
# 3. Use the App Password (16-character code) as SMTP_PASS
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM_NAME=Vision Project Management

# Application URL (used in invitation emails)
APP_URL=http://localhost:5173
```

**Files**: 
- Modify: `h:\vision for uniqtech\.env` (add actual values)
- Modify: `h:\vision for uniqtech\.env.example` (add template)

**Verify**: Check both files have new SMTP variables

---

#### Item 13: Update SETUP.md with Gmail SMTP setup instructions
**What**: Add section explaining how to configure Gmail App Password for sending invitation emails.

**Implementation**:
```markdown
# Add to SETUP.md after "4️⃣ Run the Application" section

---

## 5️⃣ Configure Email Invitations (Gmail SMTP)

To send invitation emails when inviting members:

### A. Enable Gmail SMTP

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com/security
   - Under "Signing in to Google", enable "2-Step Verification"

2. **Generate App Password**
   - Visit https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Name it "Vision Project Management"
   - Click "Generate"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)

3. **Update .env File**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=abcdefghijklmnop  # App Password (no spaces)
   SMTP_FROM_NAME=Vision Project Management
   APP_URL=http://localhost:5173
   ```

4. **Restart the server**
   ```bash
   npm run dev
   ```

### B. Test Email Invitations

1. Create a project and click "Invite Members"
2. Enter an email address and select a role
3. Check the recipient's inbox for invitation email
4. If user doesn't have an account, they'll be prompted to sign up
5. If user has an account, they'll be added immediately

### Troubleshooting SMTP

**"Invalid login" error:**
- Verify 2FA is enabled on your Google account
- Make sure you're using the App Password, not your regular password
- Remove any spaces from the App Password

**"Connection timeout" error:**
- Check your firewall/antivirus isn't blocking port 587
- Try SMTP_PORT=465 and SMTP_SECURE=true

**Emails not arriving:**
- Check spam/junk folder
- Verify SMTP_USER email address is correct
- Check Gmail "Sent" folder to confirm email was sent
```

**Files**: 
- Modify: `h:\vision for uniqtech\SETUP.md`
  - Add new section after line ~150

**Verify**: Read through SETUP.md to ensure instructions are clear

---

#### Item 14: Add health check endpoint
**What**: Add `GET /api/health` endpoint for server health verification.

**Implementation**:
```typescript
// In server.ts, add near the top after other simple endpoints

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    supabase: !!supabase,
    clerk: !!process.env.CLERK_SECRET_KEY,
    smtp: !!(process.env.SMTP_USER && process.env.SMTP_PASS)
  });
});
```

**Files**: 
- Modify: `h:\vision for uniqtech\server.ts`
  - Add after line ~130 (after other utility endpoints)

**Verify**: `curl http://localhost:3000/api/health` returns JSON with status "ok"

---

### PHASE 6: Frontend User Experience Improvements

#### Item 15: Update InviteMemberModal to handle emailOnly response
**What**: When invite returns `emailOnly: true`, show user-friendly message that invitation was sent via email rather than immediately adding to members list.

**Implementation**:
```typescript
// In src/components/InviteMemberModal.tsx, handleInvite function (around line 40)

const result = await inviteMember(project.id, email.trim(), role);

setIsLoading(false);

if (result.success) {
  if (result.emailOnly) {
    setSuccessMessage(`Invitation email sent to ${email}. They will be added when they sign up.`);
  } else {
    setSuccessMessage(`Successfully invited ${email} as ${role}`);
  }
  setEmail('');
  setRole('member');
  setTimeout(() => setSuccessMessage(null), 5000);
} else {
  setError(result.error || 'Failed to invite member');
}
```

**Files**: 
- Modify: `h:\vision for uniqtech\src\components\InviteMemberModal.tsx`
  - Lines ~55-65: Update success message handling

**Verify**: Invite non-existent user and verify message says "email sent"

---

#### Item 16: Update ProjectContext inviteMember to return emailOnly flag
**What**: Pass through the `emailOnly` flag from API response so UI can differentiate between immediate add vs. email invitation.

**Implementation**:
```typescript
// In src/context/ProjectContext.tsx, inviteMember function (around line 940)

if (response.ok) {
  const result = await response.json();
  
  // Only update local state if user was added immediately
  if (!result.emailOnly && result.member) {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return {
          ...p,
          members: [...(p.members || []), result.member]
        };
      }
      return p;
    }));
  }

  setRecentActivity(prev => [
    { 
      text: result.emailOnly 
        ? `${currentUser.name} sent invitation to ${email}` 
        : `${currentUser.name} invited ${email} to project as ${role}`, 
      time: 'Just now' 
    },
    ...prev
  ]);

  return { success: true, emailOnly: result.emailOnly };
}
```

**Files**: 
- Modify: `h:\vision for uniqtech\src\context\ProjectContext.tsx`
  - Lines ~945-965: Update response handling to check emailOnly flag

**Verify**: Check that result type includes emailOnly: `{ success: boolean; error?: string; emailOnly?: boolean }`

---

## Summary of Changes

### New Files Created (3)
1. `src/middleware/hybridAuth.ts` - Hybrid authentication middleware
2. `src/lib/emailService.ts` - Email sending service with Gmail SMTP
3. (No new React components - using existing modals)

### Files Modified (7)
1. `server.ts` - Auth middleware, invite endpoint fixes, email integration, new endpoints
2. `src/context/ProjectContext.tsx` - URL fix, response handling updates
3. `.agents/tasks/supabase-schema.sql` - Add invitation_tokens table
4. `.env` - Add SMTP configuration
5. `.env.example` - Add SMTP template
6. `SETUP.md` - Add Gmail SMTP setup guide
7. `src/components/InviteMemberModal.tsx` - Update success messages
8. `src/App.tsx` - Add invitation acceptance flow

### Database Changes
- Add `invitation_tokens` table with RLS policies

### Dependencies Added
- `nodemailer` (production)
- `@types/nodemailer` (dev)

### Environment Variables Added
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM_NAME`
- `APP_URL`

---

## Testing Checklist

### Test Case 1: Invite Existing User
1. User A creates project
2. User B signs up with email userb@example.com
3. User A invites userb@example.com as Admin
4. ✅ User B should receive email
5. ✅ User B should be added to project_members immediately
6. ✅ User B should see project in their project list

### Test Case 2: Invite Non-Existent User
1. User A creates project
2. User A invites newuser@example.com as Member
3. ✅ Invitation token should be created in DB
4. ✅ Email should be sent to newuser@example.com
5. ✅ Success message should say "email sent"
6. New user signs up with newuser@example.com
7. New user clicks link in email
8. ✅ Should redeem token and add to project

### Test Case 3: Update Member Role
1. User A (owner) invites User B (member)
2. User A changes User B's role to Admin
3. ✅ Should call PATCH /api/projects/:id/members/:userId (without /role)
4. ✅ Role should update in UI and DB

### Test Case 4: SMTP Email Sending
1. Configure Gmail App Password in .env
2. Invite a user
3. ✅ Check server logs for "Invitation sent"
4. ✅ Check recipient inbox (and spam folder)
5. ✅ Email should have proper formatting and invitation link

### Test Case 5: Hybrid Auth
1. Use frontend with fake token (sess_clerk_live_alex_rivera)
2. Invite a member
3. ✅ Should not get 401 error
4. ✅ Should successfully create invitation

---

## Rollback Plan

If issues occur:
1. Revert server.ts auth changes: restore `requireAuth()` middleware
2. Remove invitation_tokens table: `DROP TABLE invitation_tokens;`
3. Uninstall nodemailer: `npm uninstall nodemailer @types/nodemailer`
4. Revert .env changes: remove SMTP variables
5. Git reset to previous commit if needed

---

## Performance & Security Notes

### Performance
- Email sending is async but not awaited (fire-and-forget) to avoid blocking API response
- Invitation tokens are indexed on token, email, and project_id for fast lookups
- Token cleanup job (cron) recommended to delete expired tokens periodically

### Security
- Invitation tokens expire after 7 days
- Tokens are single-use (marked as used after redemption)
- Email must match invitation for redemption
- SMTP credentials stored in .env (not committed to git)
- RLS policies prevent unauthorized token access
- Hybrid auth validates sessions from both Clerk and custom map

---

## Future Enhancements (Not in Scope)

1. Resend invitation email endpoint
2. Bulk invite (CSV upload)
3. Custom invitation message
4. Invitation analytics (sent/accepted/expired counts)
5. Configurable token expiry
6. Support for other SMTP providers (SendGrid, AWS SES)
7. Email templates system
8. Invitation revocation endpoint

