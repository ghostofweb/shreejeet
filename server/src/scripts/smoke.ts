/**
 * End-to-end smoke test against a throwaway in-memory MongoDB.
 * Proves auth, CRUD, locking and authorization actually work.
 *
 *   npm run smoke
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_ACCESS_SECRET ||= 'smoke-access-secret-not-for-real-use';
process.env.JWT_REFRESH_SECRET ||= 'smoke-refresh-secret-not-for-real-use';
process.env.NODE_ENV = 'test';

const { createApp } = await import('../app.js');
const { User } = await import('../models/User.js');

let pass = 0;
let fail = 0;

function check(label: string, ok: boolean, extra?: unknown) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    console.log(`  ✗ ${label}`, extra ?? '');
  }
}

const mem = await MongoMemoryServer.create();
await mongoose.connect(mem.getUri('smoke'));

await User.create({
  email: 'test@example.com',
  passwordHash: await bcrypt.hash('correct-horse-battery', 12),
  displayName: 'Tester',
  role: 'me',
});

const app = createApp();
const server = app.listen(0);
const port = (server.address() as { port: number }).port;
const base = `http://127.0.0.1:${port}/api/v1`;

let cookie = '';
let token = '';

async function call(path: string, init: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(init.headers as Record<string, string>),
  };
  if (init.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(`${base}${path}`, { ...init, headers });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  const text = await res.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* non-JSON response */
  }
  return { status: res.status, body: body as Record<string, any> };
}

console.log('\n🐈 Smoke test\n');

/* ── auth ── */
let r = await call('/story');
check('private route rejects anonymous access', r.status === 401);

r = await call('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
});
check('login rejects a wrong password', r.status === 401);

r = await call('/auth/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'test@example.com', password: 'correct-horse-battery' }),
});
check('login succeeds with correct credentials', r.status === 200 && !!r.body.accessToken, r.body);
token = r.body.accessToken;

check('login response never leaks the password hash', !('passwordHash' in (r.body.user ?? {})));

r = await call('/auth/me');
check('/auth/me returns the signed-in user', r.status === 200 && r.body.user?.role === 'me');

r = await call('/auth/refresh', { method: 'POST' });
check('refresh cookie mints a new access token', r.status === 200 && !!r.body.accessToken);
token = r.body.accessToken;

/* ── CRUD ── */
r = await call('/story', {
  method: 'POST',
  body: JSON.stringify({ date: '2024-06-18', title: 'Placeholder memory', sceneType: 'sunrise' }),
});
check('create a story event', r.status === 201 && !!r.body.id, r.body);
const storyId = r.body.id;

r = await call('/story', {
  method: 'POST',
  body: JSON.stringify({ title: 'no date', sceneType: 'not-a-scene' }),
});
check('validation rejects a bad payload', r.status === 400);

r = await call(`/story/${storyId}`, {
  method: 'PATCH',
  body: JSON.stringify({ title: 'Renamed' }),
});
check('update a story event', r.status === 200 && r.body.title === 'Renamed');

r = await call('/story');
check('list returns the event', r.status === 200 && r.body.total === 1);

r = await call(`/story/${storyId}`, { method: 'DELETE' });
check('delete a story event', r.status === 200);
r = await call('/story');
check('soft-deleted events disappear from the list', r.body.total === 0);

/* ── reasons + random ── */
for (const text of ['Reason one', 'Reason two', 'Reason three']) {
  await call('/reasons', { method: 'POST', body: JSON.stringify({ text }) });
}
r = await call('/reasons/random');
check('random reason returns one reason', r.status === 200 && !!r.body.text, r.body);
const firstId = r.body.id;
r = await call(`/reasons/random?exclude=${firstId}`);
check('random reason honours exclude', r.status === 200 && r.body.id !== firstId);

/* ── star locking ── */
const future = new Date(Date.now() + 86_400_000).toISOString();
r = await call('/stars', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Locked star',
    message: 'SECRET-PAYLOAD',
    visibility: 'unlock_at',
    unlockAt: future,
  }),
});
const lockedStarId = r.body.id;
check('create a locked star', r.status === 201);

r = await call('/stars');
const listed = r.body.items.find((s: any) => s.id === lockedStarId);
check('locked star still appears in the sky', !!listed && listed.locked === true);
check(
  'locked star never ships its message to the client',
  !JSON.stringify(listed).includes('SECRET-PAYLOAD'),
  listed
);

r = await call(`/stars/${lockedStarId}`);
check('locked star cannot be opened directly', r.status === 403);

/* ── letters ── */
r = await call('/letters', {
  method: 'POST',
  body: JSON.stringify({ situation: "you're missing me", body: 'LETTER-BODY' }),
});
const letterId = r.body.id;
r = await call('/letters');
check(
  'letter list withholds the body until opened',
  !JSON.stringify(r.body.items).includes('LETTER-BODY')
);

r = await call(`/letters/${letterId}/open`, { method: 'POST' });
check('opening a letter returns the body', r.body.body === 'LETTER-BODY');
check('first open is flagged as special', r.body.firstOpen === true);
r = await call(`/letters/${letterId}/open`, { method: 'POST' });
check('reopening is not a first open', r.body.firstOpen === false);

/* ── anchor date is exclusive ── */
await call('/dates', {
  method: 'POST',
  body: JSON.stringify({ title: 'First', date: '2023-01-01', isAnchor: true }),
});
await call('/dates', {
  method: 'POST',
  body: JSON.stringify({ title: 'Second', date: '2023-02-01', isAnchor: true }),
});
r = await call('/dates');
check(
  'only one date can be the anchor',
  r.body.items.filter((d: any) => d.isAnchor).length === 1,
  r.body.items
);

/* ── stats ── */
r = await call('/admin/stats');
check('admin stats counts content', r.status === 200 && typeof r.body.reasons === 'number');

/* ── logout ── */
r = await call('/auth/logout', { method: 'POST' });
check('logout succeeds', r.status === 200);
token = '';
r = await call('/auth/refresh', { method: 'POST' });
check('refresh token is dead after logout', r.status === 401);

console.log(`\n${fail === 0 ? '✅' : '❌'} ${pass} passed, ${fail} failed\n`);

server.close();
await mongoose.disconnect();
await mem.stop();
process.exit(fail === 0 ? 0 : 1);
