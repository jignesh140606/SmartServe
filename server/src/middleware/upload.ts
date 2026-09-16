import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Multer storage configuration.
 * Files are stored in server/uploads/ with unique timestamped filenames.
 */
const storage = multer.diskStorage({
  destination(_req: Request, _file: Express.Multer.File, cb) {
    cb(null, uploadsDir);
  },
  filename(_req: Request, file: Express.Multer.File, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

/**
 * Allowed file types for upload.
 */
const ALLOWED_MIMETYPES = [
  // Images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // Text / Logs
  'text/plain',
  'text/csv',
  'application/json',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
];

function fileFilter(_req: Request, file: Express.Multer.File, cb: FileFilterCallback) {
  if (ALLOWED_MIMETYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type "${file.mimetype}" is not allowed. Accepted: images, PDFs, text files, documents, archives.`));
  }
}

/**
 * Configured Multer upload middleware.
 * - Max file size: 10 MB
 * - Max files per request: 5
 */
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 5,
  },
});

export default upload;
