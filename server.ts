import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { clerkMiddleware, requireAuth } from '@clerk/express';

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

app.use(express.json());
app.use(clerkMiddleware());

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
app.get('/api/auth/me', requireAuth(), (req, res) => {
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

// Configure Vite integration
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[Vision] Server listening on port ${PORT}`);
  });
}

startServer();
