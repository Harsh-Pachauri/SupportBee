import { Router } from 'express';
import { listCompanySupportRequests, patchCompanySupportRequest } from '../controllers/supportRequest.controller.js';
import { requireAuth, requireCompanyId } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', requireAuth, requireCompanyId, listCompanySupportRequests);
router.patch('/:id', requireAuth, requireCompanyId, patchCompanySupportRequest);

export default router;
