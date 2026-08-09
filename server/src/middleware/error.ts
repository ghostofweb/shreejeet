import type { NextFunction, Request, Response } from 'express';
import { MongoServerError } from 'mongodb';
import { ApiError } from '../lib/errors.js';
import { env } from '../config/env.js';

export function notFound(_req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound('That endpoint does not exist'));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message, details: err.details });
    return;
  }

  if (err instanceof MongoServerError && err.code === 11000) {
    res.status(409).json({ error: 'That already exists' });
    return;
  }

  const message = err instanceof Error ? err.message : 'Unknown error';
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    error: env.isProd ? 'Something went wrong on our side' : message,
  });
}
