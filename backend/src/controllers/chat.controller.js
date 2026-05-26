import { runChat } from '../services/chat/chatFlow.js';
import { getCompanyConversationDetail, listCompanyConversations } from '../services/chat/conversationAdmin.js';

export async function createChat(req, res) {
  try {
    const companyId = req.companyId;
    const { message, conversationId } = req.body;

    if (!companyId || !message) {
      return res.status(400).json({ message: 'companyId and message are required.' });
    }

    const result = await runChat({ companyId, message, conversationId });

    return res.json({
      message: 'Chat completed',
      ...result,
    });
  } catch (err) {
    console.error('createChat error', err);
    return res.status(500).json({ message: 'Failed to process chat', error: String(err) });
  }
}

export async function listConversations(req, res) {
  try {
    const companyId = req.companyId;

    if (!companyId) {
      return res.status(400).json({ message: 'companyId is required.' });
    }

    const result = await listCompanyConversations({
      companyId,
      status: req.query.status,
      escalatedOnly: req.query.escalatedOnly === 'true' || req.query.escalatedOnly === '1',
      page: req.query.page,
      limit: req.query.limit,
    });

    return res.json(result);
  } catch (err) {
    console.error('listConversations error', err);
    return res.status(500).json({ message: 'Failed to load conversations', error: String(err) });
  }
}

export async function getConversation(req, res) {
  const { id } = req.params;
  const companyId = req.companyId;

  if (!id || !companyId) {
    return res.status(400).json({ message: 'id and companyId are required.' });
  }

  try {
    const result = await getCompanyConversationDetail({
      companyId,
      conversationId: id,
    });

    return res.json(result);
  } catch (err) {
    console.error('getConversation error', err);
    return res.status(500).json({ message: 'Failed to load conversation', error: String(err) });
  }
}
