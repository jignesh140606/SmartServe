import { Router } from 'express';
import {
  uploadAttachments,
  getAttachments,
  deleteAttachment,
} from '../controllers/attachment.controller.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/upload.js';

const router = Router();

// Require JWT authentication for all attachment endpoints
router.use(authenticate);

// Upload files to a ticket or complaint (up to 5 files)
router.post('/:itemType/:itemId', upload.array('files', 5), uploadAttachments);

// Get all attachments for a ticket or complaint
router.get('/:itemType/:itemId', getAttachments);

// Delete a specific attachment
router.delete('/:id', deleteAttachment);

export default router;
