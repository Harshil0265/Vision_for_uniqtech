/** Self-test for backend/auth (in-memory store, no external services): npm run test:auth */
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';

process.env.BCRYPT_COST = '10';
process.env.JWT_ACCESS_TTL_SECONDS = '60';
process.env.REFRESH_GRACE_SECONDS = '1';

const { createAuthStore } = await import('../backend/auth/store');
const { createAuthRouter } = await import('../backend/auth/authRouter');
const { createRequireAuth } = await import('../backend/auth/middleware');
const { getAuthConfig } = await import('../backend/auth/config');

const store = createAuthStore(null); // null = keep everything in memory, write no file
const app = express();
app.use(express.json());
app.use('/api/auth', createAuthRouter(store));
app.get('/api/protected', createRequireAuth(store), (req: any, res) => res.json({ ok: true, user: req.user }));

let pass = 0, fail = 0;
const check = (name: string, cond: boolean, extra = '') => { cond ? pass++ : fail++; console.log(`${cond ? 'PASS' : 'FAIL'}  ${name} ${cond ? '' : extra}`); };
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const claims = (token: string) => jwt.decode(token) as { sub: string; sid: string };

async function main() {
  const server = http.createServer(app).listen(0);
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  let cookie = '';
  const call = async (path: string, init: any = {}, withCookie = true) => {
    const res = await fetch(base + path, {
      ...init,
      headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'vision-web', ...(withCookie && cookie ? { Cookie: cookie } : {}), ...(init.headers || {}) },
      body: init.body ? JSON.stringify(init.body) : undefined
    });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return { status: res.status, body: await res.json().catch(() => ({})), setCookie: sc };
  };
  const bearer = (t: string) => ({ headers: { Authorization: `Bearer ${t}` } });

  // ---- signup policy -------------------------------------------------------
  const signupBody = (email: string, password = 'GoodPass12345') => ({ method: 'POST', body: { name: 'Test User', email, password } });
  let r = await call('/api/auth/signup', signupBody('tester.one@gmail.com', 'short'));
  check('weak password rejected', r.status === 400);
  r = await call('/api/auth/signup', signupBody('someone@yahoo.com'));
  check('non-Gmail address rejected', r.status === 400 && r.body.code === 'email_not_allowed');
  r = await call('/api/auth/signup', signupBody('abc@gmail.com'));
  check('too-short Gmail username rejected', r.status === 400);
  r = await call('/api/auth/signup', signupBody('tester+alias@gmail.com'));
  check('plus-alias rejected', r.status === 400);

  // ---- signup -> session ----------------------------------------------------
  r = await call('/api/auth/signup', signupBody('Tester.One@Gmail.com'));
  check('signup 201 returns session', r.status === 201 && !!r.body.accessToken && r.body.user.email === 'tester.one@gmail.com');
  check('refresh cookie httpOnly + Strict + scoped', /HttpOnly/i.test(r.setCookie!) && /SameSite=Strict/i.test(r.setCookie!) && /Path=\/api\/auth/.test(r.setCookie!));
  check('password hash never returned', !JSON.stringify(r.body).includes('passwordHash'));
  check('password stored as bcrypt hash', (await store.findUserByEmail('tester.one@gmail.com'))!.passwordHash!.startsWith('$2'));
  const access1 = r.body.accessToken;
  const cookie1 = cookie;
  const { sub: userId, sid: sid1 } = claims(access1);

  r = await call('/api/auth/signup', { method: 'POST', body: { name: 'Dup', email: 'tester.one@gmail.com', password: 'GoodPass12345' } });
  check('email cannot be registered twice (409)', r.status === 409);

  // ---- protected route -------------------------------------------------------
  r = await call('/api/protected', bearer(access1), false);
  check('valid access token accepted', r.status === 200 && r.body.user.email === 'tester.one@gmail.com');
  r = await call('/api/protected', {}, false);
  check('missing token -> 401 no_token', r.status === 401 && r.body.code === 'no_token');
  r = await call('/api/protected', bearer('abc.def.ghi'), false);
  check('garbage token -> invalid_token', r.status === 401 && r.body.code === 'invalid_token');
  const cfg = getAuthConfig();
  const noneTok = Buffer.from('{"alg":"none","typ":"JWT"}').toString('base64url') + '.' + Buffer.from(JSON.stringify({ sub: userId, sid: sid1, iss: cfg.issuer, aud: cfg.audience, exp: Math.floor(Date.now() / 1000) + 600 })).toString('base64url') + '.';
  r = await call('/api/protected', bearer(noneTok), false);
  check('alg=none token rejected', r.status === 401);
  const wrongSecret = jwt.sign({ sid: sid1 }, 'x'.repeat(40), { subject: userId, issuer: cfg.issuer, audience: cfg.audience });
  r = await call('/api/protected', bearer(wrongSecret), false);
  check('wrong-secret token rejected', r.status === 401);
  const expired = jwt.sign({ sid: sid1 }, cfg.accessSecret, { subject: userId, issuer: cfg.issuer, audience: cfg.audience, expiresIn: -10 });
  r = await call('/api/protected', bearer(expired), false);
  check('expired token -> token_expired', r.status === 401 && r.body.code === 'token_expired');
  const wrongAud = jwt.sign({ sid: sid1 }, cfg.accessSecret, { subject: userId, issuer: cfg.issuer, audience: 'other' });
  r = await call('/api/protected', bearer(wrongAud), false);
  check('wrong audience rejected', r.status === 401);

  // ---- login -----------------------------------------------------------------
  r = await call('/api/auth/login', { method: 'POST', body: { email: 'tester.one@gmail.com', password: 'WrongPass12345' } }, false);
  check('wrong password 401 generic', r.status === 401 && r.body.error === 'Invalid email or password.');
  r = await call('/api/auth/login', { method: 'POST', body: { email: 'nobody@example.com', password: 'WrongPass12345' } }, false);
  check('unknown email same generic 401', r.status === 401 && r.body.error === 'Invalid email or password.');

  // ---- refresh ---------------------------------------------------------------
  r = await call('/api/auth/refresh', { method: 'POST', headers: { 'X-Requested-With': '' } });
  check('refresh without CSRF header -> 403', r.status === 403);

  cookie = cookie1;
  r = await call('/api/auth/refresh', { method: 'POST' });
  check('refresh rotates -> new access token', r.status === 200 && !!r.body.accessToken);
  const cookie2 = cookie;
  check('refresh cookie changed', cookie2 !== cookie1);

  // replay of OLD token inside grace window -> race (409), session survives
  cookie = cookie1;
  r = await call('/api/auth/refresh', { method: 'POST' });
  check('old token within grace -> 409 refresh_race', r.status === 409 && r.body.code === 'refresh_race');
  cookie = cookie2;
  r = await call('/api/auth/refresh', { method: 'POST' });
  check('current token still valid after race', r.status === 200);
  const cookie3 = cookie;

  // replay old token AFTER grace window -> theft: whole session revoked
  await sleep(1200);
  cookie = cookie2;
  r = await call('/api/auth/refresh', { method: 'POST' });
  check('stale old token -> reuse_detected 401', r.status === 401 && r.body.code === 'reuse_detected');
  check('session revoked in store', !(await store.isSessionActive(sid1, userId)));
  cookie = cookie3;
  r = await call('/api/auth/refresh', { method: 'POST' });
  check('legit token also dead after theft detection', r.status === 401);
  r = await call('/api/protected', bearer(access1), false);
  check('access token of revoked session rejected', r.status === 401 && r.body.code === 'session_revoked');

  // ---- sessions, revoke, change password ----------------------------------------
  r = await call('/api/auth/login', { method: 'POST', body: { email: 'tester.one@gmail.com', password: 'GoodPass12345' } }, false);
  check('login ok', r.status === 200 && !!r.body.accessToken);
  const tokA = r.body.accessToken;
  r = await call('/api/auth/login', { method: 'POST', body: { email: 'tester.one@gmail.com', password: 'GoodPass12345' } }, false);
  const tokB = r.body.accessToken;
  r = await call('/api/auth/sessions', bearer(tokB), false);
  check('sessions list shows 2 active, one current', r.body.sessions.length === 2 && r.body.sessions.filter((s: any) => s.current).length === 1);
  const other = r.body.sessions.find((s: any) => !s.current);
  r = await call(`/api/auth/sessions/${other.id}`, { method: 'DELETE', ...bearer(tokB) }, false);
  check('revoke other session', r.status === 200);
  r = await call('/api/protected', bearer(tokA), false);
  check('revoked session access token rejected immediately', r.status === 401 && r.body.code === 'session_revoked');

  r = await call('/api/auth/change-password', { method: 'POST', ...bearer(tokB), body: { currentPassword: 'nope', newPassword: 'NewPass123456' } }, false);
  check('change-password wrong current -> 403', r.status === 403);
  r = await call('/api/auth/login', { method: 'POST', body: { email: 'tester.one@gmail.com', password: 'GoodPass12345' } }, false);
  const tokC = r.body.accessToken;
  r = await call('/api/auth/change-password', { method: 'POST', ...bearer(tokB), body: { currentPassword: 'GoodPass12345', newPassword: 'NewPass123456' } }, false);
  check('change-password ok revokes others', r.status === 200 && r.body.revokedOtherSessions === 1);
  r = await call('/api/protected', bearer(tokC), false);
  check('other device logged out after password change', r.status === 401);
  r = await call('/api/protected', bearer(tokB), false);
  check('current device stays logged in', r.status === 200);
  r = await call('/api/auth/login', { method: 'POST', body: { email: 'tester.one@gmail.com', password: 'NewPass123456' } }, false);
  check('new password works for login', r.status === 200);

  r = await call('/api/auth/logout', { method: 'POST' });
  check('logout 200 and clears cookie', r.status === 200 && /vision_rt=;/.test(r.setCookie || ''));

  // ---- brute force limiter (per email: 8 / 15min) -------------------------------
  let last = 0;
  for (let i = 0; i < 12; i++) last = (await call('/api/auth/login', { method: 'POST', body: { email: 'victim@example.com', password: 'WrongPass12345' } }, false)).status;
  check('brute force -> 429', last === 429);

  console.log(`\n${pass} passed, ${fail} failed`);
  server.close();
  process.exit(fail ? 1 : 0);
}
main();
