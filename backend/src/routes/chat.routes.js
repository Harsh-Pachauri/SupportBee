import { Router } from 'express';
import { createChat, listConversations, getConversation } from '../controllers/chat.controller.js';
import { requireAuth, requireCompanyId } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', requireAuth, requireCompanyId, createChat);
router.get('/conversations', requireAuth, requireCompanyId, listConversations);
router.get('/conversations/:id', requireAuth, requireCompanyId, getConversation);

export default router;
