import { z } from 'zod';
import {
  AUTHORS,
  REASON_CATEGORIES,
  SCENE_TYPES,
  STAR_TYPES,
} from '../models/shared.js';

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const idParam = z.object({ id: objectId });

const author = z.enum(AUTHORS);
const dateish = z.coerce.date();
const optionalDate = z.coerce.date().optional().nullable();

export const mediaRef = z.object({
  mediaId: objectId.optional(),
  url: z.string().min(1),
  type: z.enum(['image', 'video']).default('image'),
  width: z.number().optional(),
  height: z.number().optional(),
  alt: z.string().max(300).optional(),
});

/* ── Story ── */
export const storyEventCreate = z.object({
  date: dateish,
  endDate: optionalDate,
  title: z.string().min(1).max(160),
  description: z.string().max(6000).default(''),
  location: z.string().max(160).optional(),
  sceneType: z.enum(SCENE_TYPES).default('sunrise'),
  photos: z.array(mediaRef).max(20).default([]),
  video: mediaRef.optional().nullable(),
  specialMessage: z.string().max(600).optional(),
  order: z.number().int().default(0),
  createdBy: author.default('me'),
});
export const storyEventUpdate = storyEventCreate.partial();

/* ── Reasons ── */
export const reasonCreate = z.object({
  text: z.string().min(2).max(600),
  category: z.enum(REASON_CATEGORIES).default('love'),
  about: z.enum(['me', 'her']).default('her'),
  createdBy: author.default('me'),
});
export const reasonUpdate = reasonCreate.partial();

/* ── Stars ── */
export const starCreate = z.object({
  type: z.enum(STAR_TYPES).default('memory'),
  title: z.string().min(1).max(160),
  message: z.string().max(4000).optional(),
  photos: z.array(mediaRef).max(12).default([]),
  date: optionalDate,
  position: z
    .object({ x: z.number(), y: z.number(), z: z.number() })
    .partial()
    .optional(),
  groupKey: z.string().max(60).optional(),
  visibility: z.enum(['visible', 'hidden', 'unlock_at']).default('visible'),
  unlockAt: optionalDate,
  isSecret: z.boolean().default(false),
  createdBy: author.default('me'),
});
export const starUpdate = starCreate.partial();

/* ── Open When ── */
export const letterCreate = z.object({
  situation: z.string().min(1).max(160),
  body: z.string().min(1).max(20000),
  photos: z.array(mediaRef).max(12).default([]),
  audio: mediaRef.optional().nullable(),
  unlockRule: z.enum(['always', 'after_date', 'once']).default('always'),
  unlockAt: optionalDate,
  sealColor: z.string().max(24).default('#c9566b'),
  createdBy: author.default('me'),
});
export const letterUpdate = letterCreate.partial();

/* ── Confessions ── */
export const confessionCreate = z.object({
  prompt: z.string().min(1).max(200),
  text: z.string().min(1).max(8000),
  photo: mediaRef.optional().nullable(),
  date: optionalDate,
  lockRule: z.enum(['none', 'after_date', 'hold']).default('none'),
  unlockAt: optionalDate,
  createdBy: author.default('me'),
});
export const confessionUpdate = confessionCreate.partial();

/* ── Important Dates ── */
export const importantDateCreate = z.object({
  title: z.string().min(1).max(160),
  date: dateish,
  description: z.string().max(2000).optional(),
  location: z.string().max(160).optional(),
  message: z.string().max(2000).optional(),
  photo: mediaRef.optional().nullable(),
  recurrence: z.enum(['none', 'yearly']).default('none'),
  isAnchor: z.boolean().default(false),
  icon: z.string().max(24).default('heart'),
  createdBy: author.default('me'),
});
export const importantDateUpdate = importantDateCreate.partial();

export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().max(200).optional(),
});
