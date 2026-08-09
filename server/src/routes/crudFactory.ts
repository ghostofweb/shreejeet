import { Router } from 'express';
import type { Model } from 'mongoose';
import type { ZodTypeAny } from 'zod';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParam, listQuery } from './schemas.js';

interface CrudOptions<T> {
  model: Model<T>;
  createSchema: ZodTypeAny;
  updateSchema: ZodTypeAny;
  /** Default sort for the list endpoint. */
  sort?: Record<string, 1 | -1>;
  /** Fields searched by ?q= */
  searchFields?: string[];
  /** Runs after a doc is created/updated (e.g. enforcing a single anchor date). */
  afterWrite?: (doc: unknown) => Promise<void>;
}

/**
 * Every content type shares the same shape of CRUD, so it lives in one place.
 * All routes require auth — this app has no public content.
 */
export function createCrudRouter<T>(opts: CrudOptions<T>): Router {
  const { model, createSchema, updateSchema, sort = { createdAt: -1 }, searchFields = [] } = opts;
  const router = Router();

  router.use(requireAuth);

  router.get(
    '/',
    validate({ query: listQuery }),
    asyncHandler(async (req, res) => {
      const { page, limit, q } = req.query as unknown as { page: number; limit: number; q?: string };
      const filter: Record<string, unknown> = { isDeleted: { $ne: true } };
      if (q && searchFields.length) {
        filter.$or = searchFields.map((f) => ({ [f]: { $regex: q, $options: 'i' } }));
      }

      const [items, total] = await Promise.all([
        model
          .find(filter)
          .sort(sort)
          .skip((page - 1) * limit)
          .limit(limit)
          .lean(),
        model.countDocuments(filter),
      ]);

      res.json({ items: items.map(normalise), total, page, limit });
    })
  );

  router.get(
    '/:id',
    validate({ params: idParam }),
    asyncHandler(async (req, res) => {
      const doc = await model.findOne({ _id: req.params.id, isDeleted: { $ne: true } }).lean();
      if (!doc) throw ApiError.notFound();
      res.json(normalise(doc));
    })
  );

  router.post(
    '/',
    validate({ body: createSchema }),
    asyncHandler(async (req, res) => {
      const doc = await model.create(req.body);
      await opts.afterWrite?.(doc);
      res.status(201).json(doc.toJSON());
    })
  );

  router.patch(
    '/:id',
    validate({ params: idParam, body: updateSchema }),
    asyncHandler(async (req, res) => {
      const doc = await model.findOneAndUpdate(
        { _id: req.params.id, isDeleted: { $ne: true } },
        { $set: req.body },
        { new: true, runValidators: true }
      );
      if (!doc) throw ApiError.notFound();
      await opts.afterWrite?.(doc);
      res.json(doc.toJSON());
    })
  );

  // Soft delete — nothing in this app is ever truly thrown away.
  router.delete(
    '/:id',
    validate({ params: idParam }),
    asyncHandler(async (req, res) => {
      const doc = await model.findByIdAndUpdate(req.params.id, { $set: { isDeleted: true } });
      if (!doc) throw ApiError.notFound();
      res.json({ ok: true });
    })
  );

  return router;
}

/** lean() docs keep _id — give them the same shape as toJSON() output. */
export function normalise<T extends Record<string, unknown>>(doc: T): T & { id: string } {
  const { _id, __v, ...rest } = doc as Record<string, unknown>;
  return { ...rest, id: String(_id) } as T & { id: string };
}
