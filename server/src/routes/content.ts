import { Router } from 'express';
import { Types } from 'mongoose';
import { z } from 'zod';
import {
  Confession,
  ImportantDate,
  OpenWhenLetter,
  Reason,
  StoryEvent,
  UniverseStar,
} from '../models/content.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createCrudRouter, normalise } from './crudFactory.js';
import {
  confessionCreate,
  confessionUpdate,
  idParam,
  importantDateCreate,
  importantDateUpdate,
  letterCreate,
  letterUpdate,
  reasonCreate,
  reasonUpdate,
  starCreate,
  starUpdate,
  storyEventCreate,
  storyEventUpdate,
} from './schemas.js';

const ALIVE = { isDeleted: { $ne: true } };

/* ── 🏠 Story ─────────────────────────────────────────────────── */
export const storyRouter = createCrudRouter({
  model: StoryEvent,
  createSchema: storyEventCreate,
  updateSchema: storyEventUpdate,
  sort: { date: 1, order: 1 },
  searchFields: ['title', 'description', 'location'],
});

/* ── 🌹 Reasons ───────────────────────────────────────────────── */
export const reasonsRouter = Router();

const randomQuery = z.object({
  exclude: z.string().optional(),
  about: z.enum(['me', 'her']).optional(),
});

reasonsRouter.get(
  '/random',
  requireAuth,
  validate({ query: randomQuery }),
  asyncHandler(async (req, res) => {
    const { exclude, about } = req.query as unknown as z.infer<typeof randomQuery>;
    const excluded = (exclude ?? '')
      .split(',')
      .filter((id) => /^[a-f\d]{24}$/i.test(id));

    const base: Record<string, unknown> = { ...ALIVE };
    if (about) base.about = about;

    const pick = async (filter: Record<string, unknown>) => {
      const [doc] = await Reason.aggregate([{ $match: filter }, { $sample: { size: 1 } }]);
      return doc ?? null;
    };

    // Try to avoid a recent repeat; if that empties the pool, fall back to any.
    let doc = excluded.length
      ? await pick({ ...base, _id: { $nin: excluded.map((id) => new Types.ObjectId(id)) } })
      : null;
    doc ??= await pick(base);

    if (!doc) throw ApiError.notFound('No reasons written yet');

    await Reason.updateOne({ _id: doc._id }, { $inc: { timesShown: 1 } });
    res.json(normalise(doc));
  })
);

reasonsRouter.use(
  createCrudRouter({
    model: Reason,
    createSchema: reasonCreate,
    updateSchema: reasonUpdate,
    searchFields: ['text'],
  })
);

/* ── 🌌 Universe ──────────────────────────────────────────────── */
export const starsRouter = Router();

function isStarLocked(star: { visibility: string; unlockAt?: Date | null }): boolean {
  if (star.visibility === 'hidden') return true;
  if (star.visibility === 'unlock_at') {
    return !star.unlockAt || new Date(star.unlockAt) > new Date();
  }
  return false;
}

/** Locked stars still render in the sky, but their content never leaves the server. */
function stripLocked<T extends Record<string, any>>(star: T) {
  const doc = normalise(star);
  if (!isStarLocked(doc as any)) return { ...doc, locked: false };
  return {
    id: doc.id,
    type: doc.type,
    position: doc.position,
    colorSeed: doc.colorSeed,
    isSecret: doc.isSecret,
    visibility: doc.visibility,
    unlockAt: doc.unlockAt ?? null,
    locked: true,
  };
}

starsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (_req, res) => {
    const stars = await UniverseStar.find(ALIVE).lean();
    res.json({ items: stars.map(stripLocked), total: stars.length });
  })
);

starsRouter.get(
  '/:id',
  requireAuth,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const star = await UniverseStar.findOne({ _id: req.params.id, ...ALIVE }).lean();
    if (!star) throw ApiError.notFound();
    if (isStarLocked(star as any)) throw ApiError.forbidden('This star is not ready to open yet');
    res.json(normalise(star));
  })
);

starsRouter.use(
  createCrudRouter({
    model: UniverseStar,
    createSchema: starCreate,
    updateSchema: starUpdate,
    searchFields: ['title', 'message'],
  })
);

/* ── 💌 Open When ─────────────────────────────────────────────── */
export const lettersRouter = Router();

function isLetterLocked(l: { unlockRule: string; unlockAt?: Date | null }): boolean {
  if (l.unlockRule === 'after_date') return !l.unlockAt || new Date(l.unlockAt) > new Date();
  return false;
}

lettersRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const letters = await OpenWhenLetter.find(ALIVE).sort({ createdAt: -1 }).lean();
    const role = req.user!.role;
    res.json({
      items: letters.map((l) => {
        const doc = normalise(l);
        const locked = isLetterLocked(doc as any);
        const openedByMe = (doc.openedBy ?? []).some((o: any) => o.role === role);
        const { body, photos, audio, ...meta } = doc as any;
        // The body is only delivered through POST /:id/open.
        return { ...meta, locked, openedByMe, hasPhotos: (photos ?? []).length > 0 };
      }),
      total: letters.length,
    });
  })
);

lettersRouter.post(
  '/:id/open',
  requireAuth,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const letter = await OpenWhenLetter.findOne({ _id: req.params.id, ...ALIVE });
    if (!letter) throw ApiError.notFound();
    if (isLetterLocked(letter as any)) {
      throw ApiError.forbidden('This letter is not ready to be opened yet');
    }

    const role = req.user!.role as 'me' | 'her';
    const alreadyOpened = letter.openedBy.some((o) => o.role === role);
    if (!alreadyOpened) {
      letter.openedBy.push({ role, at: new Date() });
      await letter.save();
    }

    res.json({ ...letter.toJSON(), firstOpen: !alreadyOpened });
  })
);

lettersRouter.use(
  createCrudRouter({
    model: OpenWhenLetter,
    createSchema: letterCreate,
    updateSchema: letterUpdate,
    searchFields: ['situation', 'body'],
  })
);

/* ── 🫣 Confessions ───────────────────────────────────────────── */
export const confessionsRouter = Router();

function isConfessionLocked(c: { lockRule: string; unlockAt?: Date | null }): boolean {
  if (c.lockRule === 'after_date') return !c.unlockAt || new Date(c.unlockAt) > new Date();
  return false;
}

confessionsRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const items = await Confession.find(ALIVE).sort({ createdAt: -1 }).lean();
    const role = req.user!.role;
    res.json({
      items: items.map((c) => {
        const doc = normalise(c);
        const locked = isConfessionLocked(doc as any);
        const revealedByMe = (doc.revealedBy ?? []).some((r: any) => r.role === role);
        if (locked) {
          const { text, photo, ...meta } = doc as any;
          return { ...meta, locked: true, revealedByMe };
        }
        return { ...doc, locked: false, revealedByMe };
      }),
      total: items.length,
    });
  })
);

confessionsRouter.post(
  '/:id/reveal',
  requireAuth,
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const c = await Confession.findOne({ _id: req.params.id, ...ALIVE });
    if (!c) throw ApiError.notFound();
    if (isConfessionLocked(c as any)) throw ApiError.forbidden('Not yet');

    const role = req.user!.role as 'me' | 'her';
    if (!c.revealedBy.some((r) => r.role === role)) {
      c.revealedBy.push({ role, at: new Date() });
      await c.save();
    }
    res.json(c.toJSON());
  })
);

confessionsRouter.use(
  createCrudRouter({
    model: Confession,
    createSchema: confessionCreate,
    updateSchema: confessionUpdate,
    searchFields: ['prompt', 'text'],
  })
);

/* ── 🗓️ Important Dates ───────────────────────────────────────── */
export const datesRouter = createCrudRouter({
  model: ImportantDate,
  createSchema: importantDateCreate,
  updateSchema: importantDateUpdate,
  sort: { date: 1 },
  searchFields: ['title', 'description', 'location'],
  // Only one date can be the anchor for the "days together" counter.
  afterWrite: async (doc: any) => {
    if (doc?.isAnchor) {
      await ImportantDate.updateMany(
        { _id: { $ne: doc._id }, isAnchor: true },
        { $set: { isAnchor: false } }
      );
    }
  },
});
