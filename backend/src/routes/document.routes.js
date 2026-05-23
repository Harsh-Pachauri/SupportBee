import { Router } from 'express';
import multer from 'multer';
import { uploadDocument, listDocuments, deleteDocument } from '../controllers/document.controller.js';
import { requireAuth, requireCompanyId } from '../middleware/auth.middleware.js';

const router = Router();

// Use memory storage for quick processing; later swap to disk or direct upload to Supabase
const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

router.post('/upload', requireAuth, requireCompanyId, upload.single('file'), uploadDocument);
router.get('/', requireAuth, requireCompanyId, listDocuments);
router.delete('/:id', requireAuth, requireCompanyId, deleteDocument);

export default router;
