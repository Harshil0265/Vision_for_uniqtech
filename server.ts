import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createAuthRouter } from './backend/auth/authRouter';
import { createAuthStore } from './backend/auth/store';
import { getAuthConfig } from './backend/auth/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Behind a reverse proxy (Render, Fly, nginx...) set TRUST_PROXY=true so req.ip is the real client IP.
app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : false);
app.disable('x-powered-by');
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (getAuthConfig().isProd) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.use(express.json());

// ==========================================
// AUTHENTICATION (JWT) - see backend/auth/
// Accounts and sessions are stored in a local JSON file (.data/auth.json by default).
// Project, issue and sprint data lives in the browser (localStorage); there is no external API.
// ==========================================
const authStore = createAuthStore();
app.use('/api/auth', createAuthRouter(authStore));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Unknown API routes return JSON, never the SPA page.
app.use('/api', (_req, res) => {
  res.status(404).json({ success: false, code: 'not_found', error: 'Endpoint not found' });
});

// Serve static files in production
const isProd = process.env.NODE_ENV === 'production';
if (isProd) {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

// Central error handler: malformed JSON, oversized bodies and anything unexpected
// become clean JSON responses instead of HTML stack traces.
app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (res.headersSent) return next(err);
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, code: 'bad_json', error: 'Request body is not valid JSON' });
  }
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ success: false, code: 'too_large', error: 'Request body is too large' });
  }
  console.error('[API] Unhandled error:', err);
  res.status(500).json({ success: false, code: 'internal', error: 'Internal server error' });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`[Vision] Server listening on port ${PORT}`);
  console.log(`[Vision] Auth endpoints available at http://localhost:${PORT}/api/auth`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Vision] Port ${PORT} is already in use. Stop the other process or set PORT.`);
  } else {
    console.error('[Vision] Server error:', err);
  }
  process.exit(1);
});

// A bug in one request must not take the whole API down silently.
process.on('unhandledRejection', (reason) => console.error('[Vision] Unhandled rejection:', reason));
process.on('uncaughtException', (err) => {
  console.error('[Vision] Uncaught exception:', err);
  process.exit(1);
});

const shutdown = (signal: string) => {
  console.log(`[Vision] ${signal} received, shutting down...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
