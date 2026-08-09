import { Router } from 'express';
import { z } from 'zod';
import {
  AppSetting,
  Confession,
  ImportantDate,
  OpenWhenLetter,
  Reason,
  StoryEvent,
  UniverseStar,
} from '../models/content.js';
import { Media } from '../models/Media.js';
import { asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

export const adminRouter = Router();
adminRouter.use(requireAuth);

const ALIVE = { isDeleted: { $ne: true } };

adminRouter.get(
  '/stats',
  asyncHandler(async (_req, res) => {
    const [memories, stars, reasons, letters, confessions, dates, media] = await Promise.all([
      StoryEvent.countDocuments(ALIVE),
      UniverseStar.countDocuments(ALIVE),
      Reason.countDocuments(ALIVE),
      OpenWhenLetter.countDocuments(ALIVE),
      Confession.countDocuments(ALIVE),
      ImportantDate.countDocuments(ALIVE),
      Media.countDocuments(ALIVE),
    ]);
    res.json({ memories, stars, reasons, letters, confessions, dates, media });
  })
);

export const settingsRouter = Router();
settingsRouter.use(requireAuth);

settingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const rows = await AppSetting.find().lean();
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  })
);

const settingsPatch = z.record(z.string().max(60), z.unknown());

settingsRouter.patch(
  '/',
  validate({ body: settingsPatch }),
  asyncHandler(async (req, res) => {
    const entries = Object.entries(req.body as Record<string, unknown>);
    await Promise.all(
      entries.map(([key, value]) =>
        AppSetting.updateOne({ key }, { $set: { value } }, { upsert: true })
      )
    );
    const rows = await AppSetting.find().lean();
    res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
  })
);
