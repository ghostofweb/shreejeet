/**
 * Creates (or updates) the two accounts from server/.env.
 * There is no signup route — this script is the only way an account exists.
 *
 *   npm run seed
 */
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

async function upsertUser(role: 'me' | 'her', creds: { email: string; password: string; name: string }) {
  if (!creds.email || !creds.password) {
    console.log(`   · skipped "${role}" — SEED_${role.toUpperCase()}_EMAIL/PASSWORD not set`);
    return;
  }
  if (creds.password.length < 8) {
    console.log(`   · skipped "${role}" — password must be at least 8 characters`);
    return;
  }

  const passwordHash = await bcrypt.hash(creds.password, 12);
  const existing = await User.findOne({ role });

  if (existing) {
    existing.email = creds.email.toLowerCase();
    existing.displayName = creds.name;
    existing.passwordHash = passwordHash;
    existing.refreshTokens = []; // password changed → sign out everywhere
    await existing.save();
    console.log(`   · updated "${role}" → ${creds.email}`);
  } else {
    await User.create({
      role,
      email: creds.email.toLowerCase(),
      displayName: creds.name,
      passwordHash,
    });
    console.log(`   · created "${role}" → ${creds.email}`);
  }
}

async function main() {
  await connectDb();
  console.log('\n🐈 Seeding accounts');
  await upsertUser('me', env.seed.me);
  await upsertUser('her', env.seed.her);
  console.log('');
  await disconnectDb();
}

main().catch(async (err) => {
  console.error(err);
  await disconnectDb();
  process.exit(1);
});
