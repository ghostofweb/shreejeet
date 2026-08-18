import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(
      `Missing environment variable ${key}. Copy server/.env.example to server/.env and fill it in.`
    );
  }
  return value;
}

function optional(key: string, fallback = ''): string {
  return process.env[key] ?? fallback;
}

export const env = {
  port: Number(optional('PORT', '4000')),
  nodeEnv: optional('NODE_ENV', 'development'),
  get isProd() {
    return this.nodeEnv === 'production';
  },

  mongoUri: () => required('MONGODB_URI'),
  accessSecret: () => required('JWT_ACCESS_SECRET'),
  refreshSecret: () => required('JWT_REFRESH_SECRET'),

  clientOrigin: optional('CLIENT_ORIGIN', 'https://shreejeet.vercel.app, http://localhost:5173'),

  mediaProvider: optional('MEDIA_PROVIDER', 'local') as 'local' | 'cloudinary',
  cloudinary: {
    cloudName: optional('CLOUDINARY_CLOUD_NAME'),
    apiKey: optional('CLOUDINARY_API_KEY'),
    apiSecret: optional('CLOUDINARY_API_SECRET'),
  },

  seed: {
    me: {
      email: optional('SEED_ME_EMAIL'),
      password: optional('SEED_ME_PASSWORD'),
      name: optional('SEED_ME_NAME', 'Me'),
    },
    her: {
      email: optional('SEED_HER_EMAIL'),
      password: optional('SEED_HER_PASSWORD'),
      name: optional('SEED_HER_NAME', 'Her'),
    },
  },

  anchorDate: optional('ANCHOR_DATE'),

  accessTokenTtl: '15m',
  refreshTokenTtlDays: 7,
} as const;

/** Env vars that must exist before the server can boot at all. */
export function assertBootEnv(): string[] {
  const missing: string[] = [];
  for (const key of ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!process.env[key]) missing.push(key);
  }
  return missing;
}
