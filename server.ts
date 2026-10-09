import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { clerkMiddleware, requireAuth } from '@clerk/express';
import type { SessionAuthObject } from '@clerk/express';
import { createClient } from '@supabase/supabase-js';

// Type extension for Express Request with Clerk auth
interface AuthRequest extends express.Request {
  auth: SessionAuthObject;
  customUserId?: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Validate Clerk secret key is loaded
if (!process.env.CLERK_SECRET_KEY) {
  console.error('[Clerk] ERROR: CLERK_SECRET_KEY environment variable is not set');
  console.error('[Clerk] Authentication will fail. Check your .env file.');
} else {
  const keyPrefix = process.env.CLERK_SECRET_KEY.substring(0, 12);
  console.log(`[Clerk] Secret key loaded: ${keyPrefix}...`);
}

// Initialize Supabase client with service role key for admin operations
let supabase: ReturnType<typeof createClient> | null = null;
if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY) {
  supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
  console.log('[Supabase] Service client initialized');
} else {
  console.warn('[Supabase] WARNING: SUPABASE_URL or SUPABASE_SERVICE_KEY not set');
  console.warn('[Supabase] Real data endpoints will not function. Using in-memory fallback.');
}

app.use(express.json());
app.use(clerkMiddleware());

// Middleware to auto-upsert Clerk users into Supabase
const upsertClerkUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authReq = req as AuthRequest;
  if (!authReq.auth?.userId || !supabase) {
    return next();
  }

  try {
    const clerkUserId = authReq.auth.userId!;
    const email = authReq.auth.sessionClaims?.email as string || '';
    const name = authReq.auth.sessionClaims?.name as string || authReq.auth.sessionClaims?.firstName as string || '';
    const avatar = authReq.auth.sessionClaims?.imageUrl as string || '';

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', clerkUserId!)
      .single();

    if (!existingUser) {
      // Insert new user
      const { error } = await supabase
        .from('users')
        .insert({
          clerk_user_id: clerkUserId,
          email: email,
          name: name,
          avatar: avatar,
          role: 'Member',
          department: 'Engineering'
        } as any);

      if (error) {
        console.error('[Supabase] Error upserting user:', error);
      } else {
        console.log(`[Supabase] User ${email} synced from Clerk`);
      }
    }
  } catch (error) {
    console.error('[Supabase] Error in upsertClerkUser middleware:', error);
  }

  next();
};

// In-memory user directory and sessions for Clerk API integration
interface ClerkUserRecord {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  passwordHash?: string;
  createdAt: string;
}

const clerkUsers: ClerkUserRecord[] = [
  {
    id: 'user-1',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    role: 'Staff Product Manager',
    department: 'Platform Systems',
    status: 'online',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'user-2',
    name: 'Alex Rivera',
    email: 'alex.rivera@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'Principal Architect & Tech Lead',
    department: 'Platform Engineering',
    status: 'online',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'user-3',
    name: 'Elena Rostova',
    email: 'elena.rostova@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    role: 'Senior Full-Stack Engineer',
    department: 'Cloud Services',
    status: 'busy',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'user-4',
    name: 'Marcus Chen',
    email: 'marcus.chen@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    role: 'Staff SRE & DevOps Lead',
    department: 'Site Reliability Engineering',
    status: 'online',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'user-5',
    name: 'David Kim',
    email: 'david.kim@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    role: 'Senior QA Automation Engineer',
    department: 'Quality Assurance',
    status: 'away',
    createdAt: '2026-08-01T00:00:00Z'
  },
  {
    id: 'user-6',
    name: 'Priya Patel',
    email: 'priya.patel@vision.dev',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    role: 'Frontend UI/UX Specialist',
    department: 'Design Systems',
    status: 'online',
    createdAt: '2026-08-01T00:00:00Z'
  }
];

interface ActiveSession {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

const activeSessions: Map<string, ActiveSession> = new Map();

// Initialize default active session for Alex Rivera
const defaultSessionToken = 'sess_clerk_live_alex_rivera';
activeSessions.set(defaultSessionToken, {
  token: defaultSessionToken,
  userId: 'user-2',
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
});

// Hybrid auth middleware - accepts both Clerk JWT and custom session tokens
const flexAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authReq = req as AuthRequest;
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  
  if (token && activeSessions.has(token)) {
    // Custom session token - attach synthetic auth info
    const session = activeSessions.get(token)!;
    
    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ success: false, error: 'Session expired' });
    }
    
    const user = clerkUsers.find(u => u.id === session.userId);
    authReq.customUserId = session.userId;
    (authReq as any).resolvedEmail = user?.email || null;
    return next();
  }
  
  // Real Clerk token - use requireAuth
  return requireAuth()(req, res, next);
};

// ==========================================
// SUPABASE DATA API ROUTES
// ==========================================

// Helper function to get Supabase user ID from Clerk user ID or custom session
async function getSupabaseUserId(clerkUserId: string | undefined | null, customUserId: string | undefined | null): Promise<string | null> {
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

// Helper function to get Supabase user ID by email
async function getSupabaseUserIdByEmail(email: string | null | undefined): Promise<string | null> {
  if (!supabase || !email) return null;
  const { data, error } = await supabase.from('users').select('id').eq('email', email).single();
  if (error || !data) return null;
  return (data as any).id;
}

// Helper function to verify user has access to project
async function verifyProjectAccess(projectId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;
  
  const { data } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();
  
  return !!data;
}

// Helper function to verify user has admin/owner role in project
async function verifyProjectAdmin(projectId: string, userId: string): Promise<boolean> {
  if (!supabase) return false;
  
  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();
  
  return (data as any)?.role === 'owner' || (data as any)?.role === 'admin';
}

// 1. POST /api/projects - Create new project
app.post('/api/projects', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    const { name, key, description, template, allowedIssueTypes, defaultAssignee, iconGradient } = req.body;

    // Create project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        name,
        key,
        description,
        lead_user_id: supabaseUserId,
        template,
        allowed_issue_types: allowedIssueTypes || [],
        default_assignee: defaultAssignee || 'unassigned',
        icon_gradient: iconGradient
      } as any)
      .select()
      .single();

    if (projectError) {
      console.error('[Supabase] Error creating project:', projectError);
      return res.status(400).json({ success: false, error: projectError.message });
    }

    // Automatically add creator as owner
    const { error: memberError } = await supabase
      .from('project_members')
      .insert({
        project_id: (project as any).id,
        user_id: supabaseUserId,
        role: 'owner',
        invited_by: supabaseUserId
      } as any);

    if (memberError) {
      console.error('[Supabase] Error adding project owner:', memberError);
    }

    res.status(201).json({ success: true, project });
  } catch (error) {
    console.error('[API] Error creating project:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 2. GET /api/projects - Get user's accessible projects
app.get('/api/projects', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.json({ success: true, projects: [] });
    }

    // Get projects where user is a member
    const { data: projectMembers, error: membersError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', supabaseUserId);

    if (membersError) {
      console.error('[Supabase] Error fetching project members:', membersError);
      return res.status(400).json({ success: false, error: membersError.message });
    }

    const projectIds = projectMembers.map((pm: any) => pm.project_id);

    if (projectIds.length === 0) {
      return res.json({ success: true, projects: [] });
    }

    // Get project details with lead user info
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select(`
        *,
        lead:users!projects_lead_user_id_fkey(id, name, email, avatar, role, department)
      `)
      .in('id', projectIds);

    if (projectsError) {
      console.error('[Supabase] Error fetching projects:', projectsError);
      return res.status(400).json({ success: false, error: projectsError.message });
    }

    // Get members for each project
    const projectsWithMembers = await Promise.all((projects as any[]).map(async (project) => {
      const { data: members } = await supabase
        .from('project_members')
        .select(`
          role,
          invited_at,
          user:users!project_members_user_id_fkey(id, name, email, avatar, role, department)
        `)
        .eq('project_id', project.id);

      return {
        ...project,
        members: members || []
      };
    }));

    res.json({ success: true, projects: projectsWithMembers });
  } catch (error) {
    console.error('[API] Error fetching projects:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 3. POST /api/projects/:id/invite - Invite user to project
app.post('/api/projects/:id/invite', flexAuth, upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const projectId = req.params.id;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const resolvedEmail = (authReq as any).resolvedEmail;
    
    // Get Supabase user ID
    const supabaseUserId = resolvedEmail 
      ? await getSupabaseUserIdByEmail(resolvedEmail)
      : await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Verify caller is admin/owner
    const isAdmin = await verifyProjectAdmin(projectId, supabaseUserId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admins and owners can invite members' });
    }

    const { email, role } = req.body;

    if (!email || !role) {
      return res.status(400).json({ success: false, error: 'Email and role are required' });
    }

    // Look up invited user by email
    const { data: invitedUser, error: userError } = await supabase
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single();

    if (userError || !invitedUser) {
      // User doesn't exist yet - create invitation token
      const crypto = await import('crypto');
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      const { error: tokenError } = await supabase
        .from('invitation_tokens')
        .insert({
          token,
          email,
          project_id: projectId,
          role,
          invited_by: supabaseUserId,
          expires_at: expiresAt.toISOString()
        } as any);

      if (tokenError) {
        console.error('[Supabase] Error creating invitation token:', tokenError);
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to create invitation' 
        });
      }

      // Get project and inviter details for email
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

      // Send invitation email
      const { sendInvitationEmail } = await import('./src/lib/emailService.js');
      const appUrl = process.env.APP_URL || 'http://localhost:5173';
      await sendInvitationEmail({
        to: email,
        projectName: (project as any)?.name || 'Project',
        inviterName: (inviter as any)?.name || 'A team member',
        role,
        inviteLink: `${appUrl}/accept-invite?token=${token}`,
        isNewUser: true
      });

      return res.json({ 
        success: true, 
        pendingInvite: true,
        message: 'Invitation sent. User will be added when they sign up.' 
      });
    }

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('user_id', (invitedUser as any).id)
      .single();

    if (existingMember) {
      return res.status(409).json({ success: false, error: 'User is already a member of this project' });
    }

    // Add user to project
    const { error: insertError } = await supabase
      .from('project_members')
      .insert({
        project_id: projectId,
        user_id: (invitedUser as any).id,
        role: role,
        invited_by: supabaseUserId
      } as any);

    if (insertError) {
      console.error('[Supabase] Error inviting member:', insertError);
      return res.status(400).json({ success: false, error: insertError.message });
    }

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

    // Get project details for email
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

    // Send invitation email
    const { sendInvitationEmail } = await import('./src/lib/emailService.js');
    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    await sendInvitationEmail({
      to: email,
      projectName: (project as any)?.name || 'Project',
      inviterName: (inviter as any)?.name || 'A team member',
      role,
      inviteLink: `${appUrl}/projects`,
      isNewUser: false
    });

    res.json({ success: true, member: newMember || null });
  } catch (error) {
    console.error('[API] Error inviting member:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 4. GET /api/projects/:id/members - Get project members
app.get('/api/projects/:id/members', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const projectId = req.params.id;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Verify user has access to project
    const hasAccess = await verifyProjectAccess(projectId, supabaseUserId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied to this project' });
    }

    const { data: members, error } = await supabase
      .from('project_members')
      .select(`
        role,
        invited_at,
        user:users!project_members_user_id_fkey(id, name, email, avatar, role, department)
      `)
      .eq('project_id', projectId);

    if (error) {
      console.error('[Supabase] Error fetching members:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, members: members || [] });
  } catch (error) {
    console.error('[API] Error fetching members:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 5. DELETE /api/projects/:id/members/:userId - Remove member from project
app.delete('/api/projects/:id/members/:userId', flexAuth, upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const { id: projectId, userId: targetUserId } = req.params;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const resolvedEmail = (authReq as any).resolvedEmail;
    
    const supabaseUserId = resolvedEmail 
      ? await getSupabaseUserIdByEmail(resolvedEmail)
      : await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Verify caller is admin/owner
    const isAdmin = await verifyProjectAdmin(projectId, supabaseUserId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admins and owners can remove members' });
    }

    // Prevent removing the last owner
    const { data: owners } = await supabase
      .from('project_members')
      .select('id')
      .eq('project_id', projectId)
      .eq('role', 'owner');

    if (owners && owners.length === 1) {
      const { data: targetMember } = await supabase
        .from('project_members')
        .select('role')
        .eq('project_id', projectId)
        .eq('user_id', targetUserId)
        .single();

      if ((targetMember as any)?.role === 'owner') {
        return res.status(400).json({ success: false, error: 'Cannot remove the last owner of the project' });
      }
    }

    // Remove member
    const { error } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', projectId)
      .eq('user_id', targetUserId);

    if (error) {
      console.error('[Supabase] Error removing member:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    console.error('[API] Error removing member:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 6. PATCH /api/projects/:id/members/:userId/role - Update member role
app.patch('/api/projects/:id/members/:userId/role', flexAuth, upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const { id: projectId, userId: targetUserId } = req.params;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const resolvedEmail = (authReq as any).resolvedEmail;
    
    const supabaseUserId = resolvedEmail 
      ? await getSupabaseUserIdByEmail(resolvedEmail)
      : await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Verify caller is admin/owner
    const isAdmin = await verifyProjectAdmin(projectId, supabaseUserId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admins and owners can update member roles' });
    }

    const { role } = req.body;
    if (!role) {
      return res.status(400).json({ success: false, error: 'Role is required' });
    }

    // Update member role
    const { data, error } = await supabase
      .from('project_members')
      // @ts-ignore - Supabase generated types not available
      .update({ role })
      .eq('project_id', projectId)
      .eq('user_id', targetUserId)
      .select(`
        role,
        invited_at,
        user:users!project_members_user_id_fkey(id, name, email, avatar, role, department)
      `)
      .single();

    if (error) {
      console.error('[Supabase] Error updating member role:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, member: data });
  } catch (error) {
    console.error('[API] Error updating member role:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 7. GET /api/projects/:id/issues - Get project issues
app.get('/api/projects/:id/issues', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const projectId = req.params.id;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Verify user has access to project
    const hasAccess = await verifyProjectAccess(projectId, supabaseUserId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied to this project' });
    }

    const { data: issues, error } = await supabase
      .from('issues')
      .select(`
        *,
        assignee:users!issues_assignee_id_fkey(id, name, email, avatar, role, department),
        reporter:users!issues_reporter_id_fkey(id, name, email, avatar, role, department)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching issues:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, issues: issues || [] });
  } catch (error) {
    console.error('[API] Error fetching issues:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 8. POST /api/projects/:id/issues - Create issue
app.post('/api/projects/:id/issues', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const projectId = req.params.id;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Verify user is a member
    const hasAccess = await verifyProjectAccess(projectId, supabaseUserId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied to this project' });
    }

    // Get project key for generating issue key
    const { data: project } = await supabase
      .from('projects')
      .select('key')
      .eq('id', projectId)
      .single();

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Get next sequence number for this project
    const { data: existingIssues } = await supabase
      .from('issues')
      .select('key')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    let nextNumber = 1;
    if (existingIssues && existingIssues.length > 0) {
      const lastKey = (existingIssues[0] as any).key;
      const lastNumber = parseInt(lastKey.split('-')[1] || '0');
      nextNumber = lastNumber + 1;
    }

    const issueKey = `${(project as any).key}-${nextNumber}`;

    const { 
      title, 
      description, 
      type, 
      priority, 
      status, 
      assignee_id, 
      sprint_id, 
      story_points, 
      labels, 
      due_date 
    } = req.body;

    // Create issue
    const { data: issue, error } = await supabase
      .from('issues')
      .insert({
        project_id: projectId,
        key: issueKey,
        title,
        description,
        type,
        priority: priority || 'medium',
        status: status || 'todo',
        assignee_id: assignee_id || null,
        reporter_id: supabaseUserId,
        sprint_id: sprint_id || null,
        story_points: story_points || 0,
        labels: labels || [],
        subtasks: [],
        due_date: due_date || null
      } as any)
      .select(`
        *,
        assignee:users!issues_assignee_id_fkey(id, name, email, avatar, role, department),
        reporter:users!issues_reporter_id_fkey(id, name, email, avatar, role, department)
      `)
      .single();

    if (error) {
      console.error('[Supabase] Error creating issue:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, issue });
  } catch (error) {
    console.error('[API] Error creating issue:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 9. PATCH /api/issues/:issueId - Update issue
app.patch('/api/issues/:issueId', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const issueId = req.params.issueId;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Get issue to check project access
    const { data: issue } = await supabase
      .from('issues')
      .select('project_id')
      .eq('id', issueId)
      .single();

    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    // Verify user has access
    const hasAccess = await verifyProjectAccess((issue as any).project_id, supabaseUserId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    // Update issue
    const updateData: any = { ...req.body };
    delete updateData.id;
    delete updateData.key;
    delete updateData.project_id;
    updateData.updated_at = new Date().toISOString();

    const { data: updatedIssue, error } = await supabase
      .from('issues')
      // @ts-ignore - Supabase generated types not available
      .update(updateData)
      .eq('id', issueId)
      .select(`
        *,
        assignee:users!issues_assignee_id_fkey(id, name, email, avatar, role, department),
        reporter:users!issues_reporter_id_fkey(id, name, email, avatar, role, department)
      `)
      .single();

    if (error) {
      console.error('[Supabase] Error updating issue:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, issue: updatedIssue });
  } catch (error) {
    console.error('[API] Error updating issue:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 10. DELETE /api/issues/:issueId - Delete issue
app.delete('/api/issues/:issueId', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const issueId = req.params.issueId;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Get issue to check project access
    const { data: issue } = await supabase
      .from('issues')
      .select('project_id')
      .eq('id', issueId)
      .single();

    if (!issue) {
      return res.status(404).json({ success: false, error: 'Issue not found' });
    }

    // Verify user is admin/owner
    const isAdmin = await verifyProjectAdmin((issue as any).project_id, supabaseUserId);
    if (!isAdmin) {
      return res.status(403).json({ success: false, error: 'Only admins and owners can delete issues' });
    }

    // Delete issue
    const { error } = await supabase
      .from('issues')
      .delete()
      .eq('id', issueId);

    if (error) {
      console.error('[Supabase] Error deleting issue:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, message: 'Issue deleted successfully' });
  } catch (error) {
    console.error('[API] Error deleting issue:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 11. GET /api/projects/:id/sprints - Get project sprints
app.get('/api/projects/:id/sprints', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const projectId = req.params.id;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Verify user has access to project
    const hasAccess = await verifyProjectAccess(projectId, supabaseUserId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied to this project' });
    }

    const { data: sprints, error } = await supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching sprints:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.json({ success: true, sprints: sprints || [] });
  } catch (error) {
    console.error('[API] Error fetching sprints:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 12. POST /api/projects/:id/sprints - Create sprint
app.post('/api/projects/:id/sprints', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const projectId = req.params.id;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Verify user is a member
    const hasAccess = await verifyProjectAccess(projectId, supabaseUserId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied to this project' });
    }

    const { name, goal, start_date, end_date, status, planned_points } = req.body;

    // Create sprint
    const { data: sprint, error } = await supabase
      .from('sprints')
      .insert({
        project_id: projectId,
        name,
        goal,
        start_date,
        end_date,
        status: status || 'planned',
        planned_points: planned_points || 0,
        completed_points: 0
      } as any)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error creating sprint:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, sprint });
  } catch (error) {
    console.error('[API] Error creating sprint:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// 13. POST /api/projects/:id/issues/:issueId/comments - Add comment to issue
app.post('/api/projects/:id/issues/:issueId/comments', requireAuth(), upsertClerkUser, async (req, res) => {
  if (!supabase) {
    return res.status(503).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const { id: projectId, issueId } = req.params;
    const authReq = req as AuthRequest;
    const clerkUserId = authReq.auth?.userId;
    const customUserId = authReq.customUserId;
    const supabaseUserId = await getSupabaseUserId(clerkUserId, customUserId);
    
    if (!supabaseUserId) {
      return res.status(400).json({ success: false, error: 'User not found in database' });
    }

    // Verify user has access to project
    const hasAccess = await verifyProjectAccess(projectId, supabaseUserId);
    if (!hasAccess) {
      return res.status(403).json({ success: false, error: 'Access denied to this project' });
    }

    const { content, mentions } = req.body;

    if (!content) {
      return res.status(400).json({ success: false, error: 'Comment content is required' });
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        issue_id: issueId,
        author_id: supabaseUserId,
        content,
        mentions: mentions || []
      } as any)
      .select(`
        *,
        author:users!comments_author_id_fkey(id, name, email, avatar, role, department)
      `)
      .single();

    if (error) {
      console.error('[Supabase] Error creating comment:', error);
      return res.status(400).json({ success: false, error: error.message });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error('[API] Error creating comment:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// ==========================================
// CLERK AUTHENTICATION API ROUTES
// ==========================================

// 1. Get all directory users
app.get('/api/auth/users', (req, res) => {
  res.json({
    success: true,
    count: clerkUsers.length,
    users: clerkUsers.map(({ passwordHash, ...u }) => u)
  });
});

// 2. Sign Up (Register new user with Clerk API)
app.post('/api/auth/signup', (req, res) => {
  const { name, email, password, role = 'Software Engineer', department = 'Engineering', avatar } = req.body;

  if (!email || !name) {
    return res.status(400).json({ success: false, error: 'Name and email are required for sign up.' });
  }

  const existing = clerkUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ success: false, error: 'User with this email already exists in Clerk directory.' });
  }

  const newUserId = `user_clerk_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const defaultAvatar = avatar || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`;

  const newUser: ClerkUserRecord = {
    id: newUserId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    avatar: defaultAvatar,
    role: role.trim(),
    department: department.trim(),
    status: 'online',
    passwordHash: password ? `hashed_${password.length}` : undefined,
    createdAt: new Date().toISOString()
  };

  clerkUsers.push(newUser);

  // Issue real Clerk session token
  const token = `sess_clerk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString();

  activeSessions.set(token, {
    token,
    userId: newUser.id,
    createdAt: new Date().toISOString(),
    expiresAt
  });

  const { passwordHash, ...safeUser } = newUser;

  res.status(201).json({
    success: true,
    message: 'User registered and authenticated via Clerk API',
    user: safeUser,
    session: {
      token,
      userId: safeUser.id,
      createdAt: new Date().toISOString(),
      expiresAt
    }
  });
});

// 3. Sign In (Log in with Clerk API)
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, error: 'Email is required to sign in.' });
  }

  const user = clerkUsers.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(404).json({ success: false, error: 'No Clerk account found with this email address.' });
  }

  // Issue active session token
  const token = `sess_clerk_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const expiresAt = new Date(Date.now() + 86400000 * 7).toISOString();

  activeSessions.set(token, {
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
    expiresAt
  });

  const { passwordHash, ...safeUser } = user;

  res.json({
    success: true,
    message: 'Authenticated successfully with Clerk session',
    user: safeUser,
    session: {
      token,
      userId: safeUser.id,
      createdAt: new Date().toISOString(),
      expiresAt
    }
  });
});

// 4. Session Verification & Me Endpoint
app.get('/api/auth/me', requireAuth(), async (req, res) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : (req.query.token as string);

  if (!token) {
    // Return default active user (Alex Rivera) if unauthenticated in dev
    const defaultUser = clerkUsers.find(u => u.id === 'user-2') || clerkUsers[0];
    const { passwordHash, ...safeUser } = defaultUser;
    return res.json({
      success: true,
      authenticated: true,
      user: safeUser,
      session: {
        token: defaultSessionToken,
        userId: safeUser.id,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString()
      }
    });
  }

  const session = activeSessions.get(token);
  if (!session) {
    return res.status(401).json({ success: false, error: 'Invalid or expired Clerk session token.' });
  }

  const user = clerkUsers.find(u => u.id === session.userId);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User associated with session not found.' });
  }

  const { passwordHash, ...safeUser } = user;
  
  // If Supabase is configured, also check/sync user in Supabase
  if (supabase && (req as AuthRequest).auth?.userId) {
    try {
      const authReq = req as AuthRequest; const clerkUserId = authReq.auth.userId!;
      const { data: supabaseUser } = await supabase
        .from('users')
        .select('*')
        .eq('clerk_user_id', clerkUserId!)
        .single();
      
      if (supabaseUser) {
        // Merge Supabase user data
        (safeUser as any).id = (supabaseUser as any).id;
      }
    } catch (error) {
      console.error('[Supabase] Error checking user:', error);
    }
  }
  
  res.json({
    success: true,
    authenticated: true,
    user: safeUser,
    session
  });
});

// 5. Logout
app.post('/api/auth/logout', (req, res) => {
  const { token } = req.body;
  if (token && activeSessions.has(token)) {
    activeSessions.delete(token);
  }
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 6. Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), supabase: !!supabase });
});

// 7. GET /api/invitations/:token - Verify invitation token
app.get('/api/invitations/:token', async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  
  const { token } = req.params;
  const { data, error } = await supabase
    .from('invitation_tokens')
    .select(`*, project:projects(name, key)`)
    .eq('token', token)
    .is('accepted_at', null)
    .single();
  
  if (error || !data) {
    return res.status(404).json({ success: false, error: 'Invitation not found or already used' });
  }
  
  const inv = data as any;
  if (inv.expires_at && new Date(inv.expires_at) < new Date()) {
    return res.status(410).json({ success: false, error: 'Invitation has expired' });
  }
  
  res.json({
    success: true,
    invitation: {
      email: inv.email,
      role: inv.role,
      projectName: inv.project?.name,
      projectKey: inv.project?.key
    }
  });
});

// 8. POST /api/invitations/:token/accept - Accept invitation token
app.post('/api/invitations/:token/accept', flexAuth, upsertClerkUser, async (req, res) => {
  if (!supabase) return res.status(503).json({ success: false, error: 'Supabase not configured' });
  
  const authReq = req as AuthRequest;
  const clerkUserId = authReq.auth?.userId;
  const customUserId = authReq.customUserId;
  const resolvedEmail = (authReq as any).resolvedEmail;
  
  const supabaseUserId = resolvedEmail 
    ? await getSupabaseUserIdByEmail(resolvedEmail)
    : await getSupabaseUserId(clerkUserId, customUserId);
  
  if (!supabaseUserId) {
    return res.status(400).json({ success: false, error: 'User not found' });
  }
  
  const { token } = req.params;
  const { data: inv, error } = await supabase
    .from('invitation_tokens')
    .select('*')
    .eq('token', token)
    .is('accepted_at', null)
    .single();
  
  if (error || !inv) {
    return res.status(404).json({ success: false, error: 'Invitation not found or already used' });
  }
  
  const invitation = inv as any;
  if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
    return res.status(410).json({ success: false, error: 'Invitation expired' });
  }
  
  // Add user to project
  const { error: memberError } = await supabase
    .from('project_members')
    .insert({
      project_id: invitation.project_id,
      user_id: supabaseUserId,
      role: invitation.role,
      invited_by: invitation.invited_by
    } as any);
  
  if (memberError && !memberError.message.includes('duplicate')) {
    return res.status(400).json({ success: false, error: memberError.message });
  }
  
  // Mark as accepted
  await supabase
    .from('invitation_tokens')
    // @ts-ignore - Supabase generated types not available for invitation_tokens
    .update({ accepted_at: new Date().toISOString() })
    .eq('token', token);
  
  res.json({ success: true, projectId: invitation.project_id });
});

// Serve static files in production
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`[Vision] Server listening on port ${PORT}`);
  console.log(`[Vision] API endpoints available at http://localhost:${PORT}/api`);
});
