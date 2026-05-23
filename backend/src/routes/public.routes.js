import { Router } from 'express';
import { getPublicCompanyInfo, sendPublicChat } from '../controllers/public.controller.js';

const router = Router();

router.get('/:companySlug/info', getPublicCompanyInfo);
router.post('/:companySlug/chat', sendPublicChat);

export default router;
