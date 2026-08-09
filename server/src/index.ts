import { createApp } from './app.js';
import { connectDb } from './config/db.js';
import { assertBootEnv, env } from './config/env.js';

async function main() {
  const missing = assertBootEnv();
  if (missing.length) {
    console.error('\n🐈  Our Little World cannot start yet.\n');
    console.error('   Missing in server/.env:');
    for (const key of missing) console.error(`     · ${key}`);
    console.error('\n   Copy server/.env.example to server/.env and fill those in.\n');
    process.exit(1);
  }

  await connectDb();

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`🐈 API listening on http://localhost:${env.port}/api/v1`);
    console.log(`   media provider: ${env.mediaProvider}`);
  });
}

main().catch((err) => {
  console.error('Failed to start:', err);
  process.exit(1);
});
