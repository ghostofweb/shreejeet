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
    alt: String,
    uploadedBy: { type: String, enum: AUTHORS, default: 'me' },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  baseOptions
);

export const Media = mongoose.model('Media', mediaSchema);
