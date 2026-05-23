import { getCompanyBySlug } from '../services/retrieval/companyLookup.js';
import { runChat } from '../services/chat/chatFlow.js';

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
    return res.status(500).json({ message: 'Failed to load company info', error: String(err) });
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
      company,
      ...result,
    });
  } catch (err) {
    console.error('sendPublicChat error', err);
    return res.status(500).json({ message: 'Failed to process public chat', error: String(err) });
  }
}
