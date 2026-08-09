import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Media } from '../models/Media.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { idParam, listQuery } from './schemas.js';
import { normalise } from './crudFactory.js';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const MAX_IMAGE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO = 100 * 1024 * 1024; // 100MB

const ALLOWED = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/mp4',
  'audio/wav',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_VIDEO },
  fileFilter(_req, file, cb) {
    if (!ALLOWED.has(file.mimetype)) {
      cb(new ApiError(415, `We can't use ${file.mimetype} files`));
      return;
    }
    cb(null, true);
  },
});

if (env.mediaProvider === 'cloudinary') {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });
}

export const mediaRouter = Router();
mediaRouter.use(requireAuth);

mediaRouter.get(
  '/',
  validate({ query: listQuery }),
  asyncHandler(async (req, res) => {
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const filter = { isDeleted: { $ne: true } };
    const [items, total] = await Promise.all([
      Media.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Media.countDocuments(filter),
    ]);
    res.json({ items: items.map(normalise), total, page, limit });
  })
);

const uploadMeta = z.object({ alt: z.string().max(300).optional() });

mediaRouter.post(
  '/',
  upload.single('file'),
  validate({ body: uploadMeta }),
  asyncHandler(async (req, res) => {
    const file = req.file;
    if (!file) throw ApiError.badRequest('No file was sent');

    const isImage = file.mimetype.startsWith('image/');
    if (isImage && file.size > MAX_IMAGE) {
      throw ApiError.tooLarge('Images need to be under 10MB');
    }

    const kind = isImage ? 'image' : 'video';
    const author = (req.user!.role ?? 'me') as 'me' | 'her';

    let saved: {
      url: string;
      publicId?: string;
      provider: 'cloudinary' | 'local';
      width?: number;
      height?: number;
      duration?: number;
      format?: string;
    };

    if (env.mediaProvider === 'cloudinary') {
      const result = await new Promise<any>((resolve, reject) => {
        // Call through the uploader object — pulling the function out first
        // loses its `this` and Cloudinary signs the request wrong (403).
        // `auto` lets Cloudinary decide between video and raw for non-images.
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'our-little-world',
            resource_type: isImage ? 'image' : 'auto',
            chunk_size: 6_000_000,
          },
          (err, out) => {
            if (err) {
              console.error('Cloudinary upload failed:', err);
              reject(new ApiError(502, err.message || 'Upload to Cloudinary failed'));
              return;
            }
            resolve(out);
          }
        );
        stream.end(file.buffer);
      });
      saved = {
        url: result.secure_url,
        publicId: result.public_id,
        provider: 'cloudinary',
        width: result.width,
        height: result.height,
        duration: result.duration,
        format: result.format,
      };
    } else {
      // Unguessable filename so uploads can't be enumerated.
      const ext = path.extname(file.originalname) || '.bin';
      const name = `${crypto.randomBytes(16).toString('hex')}${ext}`;
      await fs.promises.writeFile(path.join(UPLOAD_DIR, name), file.buffer);
      saved = {
        url: `/uploads/${name}`,
        publicId: name,
        provider: 'local',
        format: ext.replace('.', ''),
      };
    }

    const doc = await Media.create({
      ...saved,
      type: kind,
      bytes: file.size,
      originalName: file.originalname,
      alt: req.body.alt,
      uploadedBy: author,
    });

    res.status(201).json(doc.toJSON());
  })
);

mediaRouter.delete(
  '/:id',
  validate({ params: idParam }),
  asyncHandler(async (req, res) => {
    const doc = await Media.findById(req.params.id);
    if (!doc) throw ApiError.notFound();

    if (doc.provider === 'cloudinary' && doc.publicId) {
      await cloudinary.uploader.destroy(doc.publicId).catch(() => undefined);
    } else if (doc.provider === 'local' && doc.publicId) {
      await fs.promises.unlink(path.join(UPLOAD_DIR, doc.publicId)).catch(() => undefined);
    }

    doc.isDeleted = true;
    await doc.save();
    res.json({ ok: true });
  })
);
