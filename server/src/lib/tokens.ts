import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import type { Response } from 'express';
import { env } from '../config/env.js';

export type Role = 'me' | 'her';
export interface TokenPayload {
  sub: string;
  role: Role;
  name: string;
}

export const REFRESH_COOKIE = 'olw_refresh';

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.accessSecret(), { expiresIn: env.accessTokenTtl });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.refreshSecret(), {
    expiresIn: `${env.refreshTokenTtlDays}d`,
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.accessSecret()) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.refreshSecret()) as TokenPayload;
}

/** Refresh tokens are stored hashed so a DB leak can't be replayed. */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function setRefreshCookie(res: Response, token: string): void {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? 'none' : 'lax',
    path: '/api/v1/auth',
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000,
  });
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
}
