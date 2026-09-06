import { getCompanyBySlug } from '../services/retrieval/companyLookup.js';
import { runChat } from '../services/chat/chatFlow.js';
import { createSupportRequest } from '../services/support/supportRequest.service.js';

export async function getPublicCompanyInfo(req, res) {
  try {
    const { companySlug } = req.params;
    const company = await getCompanyBySlug(companySlug);

    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    return res.json({
      company,
      supportPage: `/support/${company.slug}`,
    });
  } catch (err) {
    console.error('getPublicCompanyInfo error', err);
    return res.status(500).json({ message: 'Failed to load company info' });
  }
}

export async function sendPublicChat(req, res) {
  try {
    const { companySlug } = req.params;
    const { message, conversationId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'message is required.' });
    }

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const result = await runChat({
      companyId: company.id,
      message,
      conversationId,
    });

    return res.json({
      message: 'Public chat completed',
      conversationId: result.conversationId,
      answer: result.answer,
      confidence: result.confidence,
      escalation: result.escalation,
    });
  } catch (err) {
    console.error('sendPublicChat error', err);
    return res.status(500).json({ message: 'Failed to process public chat' });
  }
}

export async function createPublicSupportRequest(req, res) {
  try {
    const { companySlug } = req.params;
    const { conversationId, email, phone, notes } = req.body;

    if (!conversationId) {
      return res.status(400).json({ message: 'conversationId is required.' });
    }

    const company = await getCompanyBySlug(companySlug);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const result = await createSupportRequest({
      companyId: company.id,
      conversationId,
      email,
      phone,
      notes,
    });

    return res.status(result.created ? 201 : 200).json({
      message: result.alreadySubmitted ? 'Support request already submitted' : 'Support request submitted',
      supportRequest: result.supportRequest,
      created: result.created,
      alreadySubmitted: result.alreadySubmitted,
    });
  } catch (err) {
    console.error('createPublicSupportRequest error', err);
    return res.status(err.statusCode || 500).json({
      message: err.message || 'Failed to submit support request',
    });
  }
}
