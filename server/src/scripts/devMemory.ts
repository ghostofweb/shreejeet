/**
 * Runs the API against a throwaway in-memory MongoDB, seeded with one account.
 * Lets the front end be developed before real credentials exist.
 * Nothing survives a restart — never use this for real content.
 *
 *   npm run dev:memory
 */
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

process.env.JWT_ACCESS_SECRET ||= 'dev-only-access-secret';
process.env.JWT_REFRESH_SECRET ||= 'dev-only-refresh-secret';
process.env.NODE_ENV = 'development';

const { createApp } = await import('../app.js');
const { User } = await import('../models/User.js');
const { env } = await import('../config/env.js');

const mem = await MongoMemoryServer.create();
await mongoose.connect(mem.getUri('our-little-world-dev'));

const PASSWORD = 'devpassword';

/**
 * Both accounts, so identity-aware sections work offline.
 *
 * Use the real credentials from .env when they are set. Inventing separate
 * throwaway logins meant the details you had already configured were quietly
 * wrong here, which is a confusing thing to hit at a login screen.
 */
const account = (
  seed: { email: string; password: string; name: string },
  fallbackEmail: string,
  fallbackName: string
) => ({
  email: seed.email || fallbackEmail,
  password: seed.password || PASSWORD,
  name: seed.name || fallbackName,
});

const me = account(env.seed.me, 'me@example.com', 'Jeet');
const her = account(env.seed.her, 'her@example.com', 'Shree');

await User.create({
  email: me.email.toLowerCase(),
  passwordHash: await bcrypt.hash(me.password, 10),
  displayName: me.name,
  role: 'me',
});
await User.create({
  email: her.email.toLowerCase(),
  passwordHash: await bcrypt.hash(her.password, 10),
  displayName: her.name,
  role: 'her',
});

const { seedDemoContent } = await import('./seedDemo.js');
await seedDemoContent(true);

createApp().listen(env.port, () => {
  console.log(`\n🐈 dev API (in-memory, seeded with demo content) on http://localhost:${env.port}/api/v1`);
  console.log(`   ${me.name}:  ${me.email}`);
  console.log(`   ${her.name}: ${her.email}`);
  console.log(
    env.seed.me.email
      ? '   (your real .env passwords)\n   ⚠️  data is wiped on every restart\n'
      : `   password: ${PASSWORD}\n   ⚠️  data is wiped on every restart\n`
  );
});

const shutdown = async () => {
  await mongoose.disconnect();
  await mem.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
