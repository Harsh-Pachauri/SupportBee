import { supabase } from '../../db/supabase.js';

export async function persistChatTurn({
  companyId,
  conversationId,
  userMessage,
  assistantMessage,
  confidenceScore = null,
}) {
  if (!supabase || !companyId || !conversationId || !userMessage || !assistantMessage) {
    return { savedConversationId: conversationId ?? null, skipped: true };
  }

  const { error: messageError } = await supabase.from('messages').insert([
    { conversation_id: conversationId, role: 'user', message: userMessage },
    {
      conversation_id: conversationId,
      role: 'assistant',
      message: assistantMessage,
      confidence_score: confidenceScore,
    },
  ]);

  if (messageError) {
    throw messageError;
  }

  console.log(`Stored assistant confidence score for conversation ${conversationId}: ${confidenceScore ?? 'null'}`);

  return { savedConversationId: conversationId, skipped: false };
}