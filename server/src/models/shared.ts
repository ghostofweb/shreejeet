import { Schema } from 'mongoose';

export const AUTHORS = ['me', 'her', 'both'] as const;
export type Author = (typeof AUTHORS)[number];

export const SCENE_TYPES = [
  'sunrise',
  'blossom',
  'sky',
  'night',
  'rain',
  'snow',
  'city',
  'beach',
  'glow',
  'cozy',
] as const;
export type SceneType = (typeof SCENE_TYPES)[number];

export const STAR_TYPES = [
  'memory',
  'date',
  'love',
  'moment',
  'secret',
  'photo',
  'funny',
  'letter',
  'place',
  'note',
] as const;
export type StarType = (typeof STAR_TYPES)[number];

export const REASON_CATEGORIES = [
  'love',
  'funny',
  'cute',
  'attractive',
  'appreciate',
  'proud',
  'thought',
] as const;
export type ReasonCategory = (typeof REASON_CATEGORIES)[number];

/** Fields every content document carries. */
export const baseFields = {
  createdBy: { type: String, enum: AUTHORS, required: true, default: 'me' },
  isDeleted: { type: Boolean, default: false, index: true },
};

export const baseOptions = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform(_doc: unknown, ret: Record<string, unknown>) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
} as const;

/** A reference to an uploaded Media document, denormalised for fast reads. */
export const mediaRefSchema = new Schema(
  {
    mediaId: { type: Schema.Types.ObjectId, ref: 'Media' },
    url: { type: String, required: true },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    width: Number,
    height: Number,
    alt: String,
  },
  { _id: false }
);
