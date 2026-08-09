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

const EMAIL = 'dev@example.com';
const PASSWORD = 'devpassword';

await User.create({
  email: EMAIL,
  passwordHash: await bcrypt.hash(PASSWORD, 10),
  displayName: 'Dev',
  role: 'me',
});

createApp().listen(env.port, () => {
  console.log(`\n🐈 dev API (in-memory) on http://localhost:${env.port}/api/v1`);
  console.log(`   sign in with  ${EMAIL}  /  ${PASSWORD}`);
  console.log('   ⚠️  data is wiped on every restart\n');
});

const shutdown = async () => {
  await mongoose.disconnect();
  await mem.stop();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
