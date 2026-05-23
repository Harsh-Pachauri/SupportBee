import { supabase } from '../../db/supabase.js';

function getMemoryLimit() {
  const value = Number.parseInt(process.env.CHAT_MEMORY_MESSAGES || '8', 10);
  return Number.isFinite(value) && value > 0 ? value : 8;
}

export function getChatMemoryLimit() {
  return getMemoryLimit();
}

export async function getOrCreateConversation({ companyId, conversationId = null }) {
  if (!companyId) {
    throw new Error('companyId is required');
  }

  if (!supabase) {
    return { conversation: null, conversationId, created: false, source: 'offline' };
  }

  if (conversationId) {
    const { data: existingConversation, error: existingConversationError } = await supabase
      .from('conversations')
      .select('id, company_id, needs_human, created_at')
      .eq('id', conversationId)
      .eq('company_id', companyId)
      .maybeSingle();

    if (existingConversationError) {
      throw existingConversationError;
    }

    if (existingConversation) {
      return { conversation: existingConversation, conversationId: existingConversation.id, created: false, source: 'supabase' };
    }

    console.warn(`Conversation ${conversationId} not found for company ${companyId}; creating a new isolated session.`);
  }

  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert([{ company_id: companyId, needs_human: false }])
    .select('id, company_id, needs_human, created_at')
    .single();

  if (error) {
    throw error;
  }

  console.log(`Created conversation ${conversation.id} for company ${companyId}`);
  return { conversation, conversationId: conversation.id, created: true, source: 'supabase' };
}

export async function getRecentConversationMessages({ companyId, conversationId, limit = getMemoryLimit() }) {
  if (!supabase || !companyId || !conversationId) {
    return { messages: [], skipped: true, source: 'offline' };
  }

  const { data: conversation, error: conversationError } = await supabase
    .from('conversations')
    .select('id, company_id')
    .eq('id', conversationId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (conversationError) {
    throw conversationError;
  }

  if (!conversation) {
    console.warn(`Skipping history lookup for conversation ${conversationId}; company ${companyId} did not match.`);
    return { messages: [], skipped: true, source: 'supabase', companyMismatch: true };
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, role, message, confidence_score, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  const messages = (data ?? []).slice().reverse();
  return { messages, skipped: false, source: 'supabase', limit };
}

export function formatConversationHistory(messages = []) {
  if (!messages.length) {
    return '';
  }

  return messages
    .map((message) => {
      const speaker = message.role === 'assistant' ? 'Assistant' : 'User';
      return `${speaker}: ${message.message}`;
    })
    .join('\n');
}

export function estimatePromptTokens(text = '') {
  return Math.max(0, Math.ceil(String(text).length / 4));
}
