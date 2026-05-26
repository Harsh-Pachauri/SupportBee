import { supabase } from '../../db/supabase.js';
import { getOrCreateConversation } from './conversationMemory.js';

export async function persistChatTurn({
  companyId,
  conversationId = null,
  userMessage,
  assistantMessage,
  confidenceScore = null,
}) {
  if (!supabase || !companyId || !userMessage || !assistantMessage) {
    return { savedConversationId: conversationId, skipped: true };
  }

  const { conversationId: savedConversationId, created } = await getOrCreateConversation({
    companyId,
    conversationId,
  });

  if (created) {
    console.log(`Persisting first chat turn into newly created conversation ${savedConversationId}`);
  }

  const { error: messageError } = await supabase.from('messages').insert([
    { conversation_id: savedConversationId, role: 'user', message: userMessage },
    {
      conversation_id: savedConversationId,
      role: 'assistant',
      message: assistantMessage,
      confidence_score: confidenceScore,
    },
  ]);

  if (messageError) {
    throw messageError;
  }

  console.log(`Stored assistant confidence score for conversation ${savedConversationId}: ${confidenceScore ?? 'null'}`);

  return { savedConversationId, skipped: false };
}