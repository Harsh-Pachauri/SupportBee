import { Router } from 'express';
import { createPublicSupportRequest, getPublicCompanyInfo, sendPublicChat } from '../controllers/public.controller.js';

const router = Router();

router.get('/:companySlug/info', getPublicCompanyInfo);
router.post('/:companySlug/chat', sendPublicChat);
router.post('/:companySlug/support-request', createPublicSupportRequest);

export default router;
