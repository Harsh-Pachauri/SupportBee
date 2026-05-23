import { supabase } from '../../db/supabase.js';

export async function persistChatTurn({ companyId, conversationId = null, userMessage, assistantMessage }) {
  if (!supabase || !companyId || !userMessage || !assistantMessage) {
    return { savedConversationId: conversationId, skipped: true };
  }

  let savedConversationId = conversationId;

  if (!savedConversationId) {
    const { data: conversationData, error: conversationError } = await supabase
      .from('conversations')
      .insert([{ company_id: companyId, needs_human: false }])
      .select('id')
      .single();

    if (conversationError) {
      throw conversationError;
    }

    savedConversationId = conversationData.id;
  }

  const { error: messageError } = await supabase.from('messages').insert([
    { conversation_id: savedConversationId, role: 'user', message: userMessage },
    { conversation_id: savedConversationId, role: 'assistant', message: assistantMessage, confidence_score: null },
  ]);

  if (messageError) {
    throw messageError;
  }

  return { savedConversationId, skipped: false };
}