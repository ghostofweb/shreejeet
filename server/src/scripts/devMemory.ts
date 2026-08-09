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

// Both accounts, so identity-aware sections (Reasons, attribution) work offline.
const meName = env.seed.me.name || 'Jeet';
const herName = env.seed.her.name || 'Shree';
const hash = await bcrypt.hash(PASSWORD, 10);

await User.create({ email: 'me@example.com', passwordHash: hash, displayName: meName, role: 'me' });
await User.create({
  email: 'her@example.com',
  passwordHash: hash,
  displayName: herName,
  role: 'her',
});

const { seedDemoContent } = await import('./seedDemo.js');
await seedDemoContent(true);

createApp().listen(env.port, () => {
  console.log(`\n🐈 dev API (in-memory, seeded with demo content) on http://localhost:${env.port}/api/v1`);
  console.log(`   ${meName}:  me@example.com  /  ${PASSWORD}`);
  console.log(`   ${herName}: her@example.com /  ${PASSWORD}`);
  console.log('   ⚠️  data is wiped on every restart\n');
});

const shutdown = async () => {
  await mongoose.disconnect();
  await mem.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
