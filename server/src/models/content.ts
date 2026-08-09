import mongoose, { Schema } from 'mongoose';
import {
  AUTHORS,
  REASON_CATEGORIES,
  SCENE_TYPES,
  STAR_TYPES,
  baseFields,
  baseOptions,
  mediaRefSchema,
} from './shared.js';

/* ── 🏠 Our Story ─────────────────────────────────────────────── */
const storyEventSchema = new Schema(
  {
    date: { type: Date, required: true, index: true },
    endDate: Date,
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    location: String,
    sceneType: { type: String, enum: SCENE_TYPES, default: 'sunrise' },
    photos: { type: [mediaRefSchema], default: [] },
    video: mediaRefSchema,
    specialMessage: String,
    order: { type: Number, default: 0 },
    ...baseFields,
  },
  baseOptions
);
export const StoryEvent = mongoose.model('StoryEvent', storyEventSchema);

/* ── 🌹 Reasons ───────────────────────────────────────────────── */
const reasonSchema = new Schema(
  {
    text: { type: String, required: true, trim: true },
    category: { type: String, enum: REASON_CATEGORIES, default: 'love' },
    /** Who the reason is *about* — lets us show the right person's reasons. */
    about: { type: String, enum: ['me', 'her'], default: 'her' },
    timesShown: { type: Number, default: 0 },
    ...baseFields,
  },
  baseOptions
);
reasonSchema.index({ text: 'text' });
export const Reason = mongoose.model('Reason', reasonSchema);

/* ── 🌌 Our Universe ──────────────────────────────────────────── */
const universeStarSchema = new Schema(
  {
    type: { type: String, enum: STAR_TYPES, default: 'memory' },
    title: { type: String, required: true, trim: true },
    message: String,
    photos: { type: [mediaRefSchema], default: [] },
    date: Date,
    position: {
      x: { type: Number, default: () => (Math.random() - 0.5) * 60 },
      y: { type: Number, default: () => (Math.random() - 0.5) * 34 },
      z: { type: Number, default: () => (Math.random() - 0.5) * 40 },
    },
    colorSeed: { type: Number, default: () => Math.random() },
    groupKey: String,
    visibility: {
      type: String,
      enum: ['visible', 'hidden', 'unlock_at'],
      default: 'visible',
      index: true,
    },
    unlockAt: Date,
    isSecret: { type: Boolean, default: false },
    ...baseFields,
  },
  baseOptions
);
export const UniverseStar = mongoose.model('UniverseStar', universeStarSchema);

/* ── 💌 Open When ─────────────────────────────────────────────── */
const openWhenSchema = new Schema(
  {
    situation: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    photos: { type: [mediaRefSchema], default: [] },
    audio: mediaRefSchema,
    unlockRule: { type: String, enum: ['always', 'after_date', 'once'], default: 'always' },
    unlockAt: Date,
    openedBy: {
      type: [
        new Schema(
          { role: { type: String, enum: ['me', 'her'] }, at: { type: Date, default: Date.now } },
          { _id: false }
        ),
      ],
      default: [],
    },
    sealColor: { type: String, default: '#c9566b' },
    ...baseFields,
  },
  baseOptions
);
export const OpenWhenLetter = mongoose.model('OpenWhenLetter', openWhenSchema);

/* ── 🫣 Confessions ───────────────────────────────────────────── */
const confessionSchema = new Schema(
  {
    prompt: { type: String, required: true, trim: true },
    text: { type: String, required: true },
    photo: mediaRefSchema,
    date: Date,
    lockRule: { type: String, enum: ['none', 'after_date', 'hold'], default: 'none' },
    unlockAt: Date,
    revealedBy: {
      type: [
        new Schema(
          { role: { type: String, enum: ['me', 'her'] }, at: { type: Date, default: Date.now } },
          { _id: false }
        ),
      ],
      default: [],
    },
    ...baseFields,
  },
  baseOptions
);
export const Confession = mongoose.model('Confession', confessionSchema);

/* ── 🗓️ Important Dates ───────────────────────────────────────── */
const importantDateSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    date: { type: Date, required: true, index: true },
    description: String,
    location: String,
    message: String,
    photo: mediaRefSchema,
    recurrence: { type: String, enum: ['none', 'yearly'], default: 'none' },
    /** The single date the "days together" counter is measured from. */
    isAnchor: { type: Boolean, default: false },
    emoji: { type: String, default: '❤️' },
    ...baseFields,
  },
  baseOptions
);
export const ImportantDate = mongoose.model('ImportantDate', importantDateSchema);

/* ── ⚙️ Settings ──────────────────────────────────────────────── */
const appSettingSchema = new Schema(
  { key: { type: String, required: true, unique: true }, value: Schema.Types.Mixed },
  { timestamps: true }
);
export const AppSetting = mongoose.model('AppSetting', appSettingSchema);

export const AUTHOR_VALUES = AUTHORS;
