import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { errorHandler, notFound } from './middleware/error.js';
import { authRouter } from './routes/auth.js';
import { adminRouter, settingsRouter } from './routes/admin.js';
import { mediaRouter, UPLOAD_DIR } from './routes/media.js';
import {
  confessionsRouter,
  datesRouter,
  lettersRouter,
  reasonsRouter,
  starsRouter,
  storyRouter,
} from './routes/content.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false,
    })
  );

  const origins = env.clientOrigin.split(',').map((o) => o.trim());
  app.use(
    cors({
      origin: env.isProd ? origins : (origin, cb) => cb(null, true),
      credentials: true,
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());
  if (!env.isProd) app.use(morgan('dev'));

  // Locally-stored media. In production MEDIA_PROVIDER should be cloudinary.
  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d', index: false }));

  app.get('/health', (_req, res) => res.json({ ok: true, at: new Date().toISOString() }));

  const api = express.Router();
  api.use('/auth', authRouter);

  // Everything below is private content; each router enforces auth itself.
  api.use(
    rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false })
  );
  api.use('/story', storyRouter);
  api.use('/reasons', reasonsRouter);
  api.use('/stars', starsRouter);
  api.use('/letters', lettersRouter);
  api.use('/confessions', confessionsRouter);
  api.use('/dates', datesRouter);
  api.use('/media', mediaRouter);
  api.use('/admin', adminRouter);
  api.use('/settings', settingsRouter);

  app.use('/api/v1', api);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
