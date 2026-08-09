import mongoose, { Schema } from 'mongoose';
import { AUTHORS, baseOptions } from './shared.js';

const mediaSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    provider: { type: String, enum: ['cloudinary', 'local'], default: 'local' },
    type: { type: String, enum: ['image', 'video'], default: 'image' },
    width: Number,
    height: Number,
    bytes: Number,
    /** Seconds — video only, used to label thumbnails in the picker. */
    duration: Number,
    /** e.g. "mp4", "png" — shown as a badge so the two are never confused. */
    format: String,
    originalName: String,
    alt: String,
    uploadedBy: { type: String, enum: AUTHORS, default: 'me' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  baseOptions
);

export const Media = mongoose.model('Media', mediaSchema);
