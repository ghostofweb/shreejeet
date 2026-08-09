import bcrypt from 'bcryptjs';
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { User } from '../models/User.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  REFRESH_COOKIE,
  clearRefreshCookie,
  hashToken,
  setRefreshCookie,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  type Role,
} from '../lib/tokens.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Give it a minute.' },
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

authRouter.post(
  '/login',
  loginLimiter,
  validate({ body: loginSchema }),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body as z.infer<typeof loginSchema>;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+passwordHash');

    // Same response for "no user" and "wrong password" — no account enumeration.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw ApiError.unauthorized('That email and password do not match');
    }

    const payload = {
      sub: user._id.toString(),
      role: user.role as Role,
      name: user.displayName,
    };
    const refresh = signRefreshToken(payload);

    user.lastLoginAt = new Date();
    user.refreshTokens = [...(user.refreshTokens ?? []), hashToken(refresh)].slice(-5);
    await user.save();

    setRefreshCookie(res, refresh);
    res.json({ user: user.toJSON(), accessToken: signAccessToken(payload) });
  })
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw ApiError.unauthorized('No session');

    let payload;
    try {
      payload = verifyRefreshToken(token);
    } catch {
      clearRefreshCookie(res);
      throw ApiError.unauthorized('Session expired');
    }

    const user = await User.findById(payload.sub).select('+refreshTokens');
    const hashed = hashToken(token);
    if (!user || !user.refreshTokens?.includes(hashed)) {
      clearRefreshCookie(res);
      throw ApiError.unauthorized('Session no longer valid');
    }

    // Rotate: the old refresh token is invalidated the moment it is used.
    const next = { sub: user._id.toString(), role: user.role as Role, name: user.displayName };
    const rotated = signRefreshToken(next);
    user.refreshTokens = [
      ...user.refreshTokens.filter((t) => t !== hashed),
      hashToken(rotated),
    ].slice(-5);
    await user.save();

    setRefreshCookie(res, rotated);
    res.json({ user: user.toJSON(), accessToken: signAccessToken(next) });
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      try {
        const payload = verifyRefreshToken(token);
        const user = await User.findById(payload.sub).select('+refreshTokens');
        if (user) {
          user.refreshTokens = (user.refreshTokens ?? []).filter((t) => t !== hashToken(token));
          await user.save();
        }
      } catch {
        /* already invalid — just clear the cookie */
      }
    }
    clearRefreshCookie(res);
    res.json({ ok: true });
  })
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user!.sub);
    if (!user) throw ApiError.unauthorized();
    res.json({ user: user.toJSON() });
  })
);
