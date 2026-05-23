import { runChat } from '../services/chat/chatFlow.js';
import { supabase } from '../db/supabase.js';

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

    if (!supabase) {
      return res.json({ conversations: [], source: 'offline' });
    }

    const { data, error } = await supabase
      .from('conversations')
      .select('id, company_id, needs_human, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return res.json({ conversations: data ?? [], source: 'supabase' });
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

  if (!supabase) {
    return res.json({ conversation: null, messages: [], source: 'offline' });
  }

  try {
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id, company_id, needs_human, created_at')
      .eq('id', id)
      .eq('company_id', companyId)
      .maybeSingle();

    if (conversationError) {
      throw conversationError;
    }

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, conversation_id, role, message, confidence_score, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (messagesError) {
      throw messagesError;
    }

    return res.json({ conversation, messages: messages ?? [], source: 'supabase' });
  } catch (err) {
    console.error('getConversation error', err);
    return res.status(500).json({ message: 'Failed to load conversation', error: String(err) });
  }
}
