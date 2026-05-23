import { retrieveRelevantChunks } from '../retrieval/retrieveChunks.js';
import { buildPrompt } from '../retrieval/buildPrompt.js';
import { generateResponse } from '../llm/generateResponse.js';
import { persistChatTurn } from './persistChatTurn.js';
import {
  estimatePromptTokens,
  formatConversationHistory,
  getChatMemoryLimit,
  getOrCreateConversation,
  getRecentConversationMessages,
} from './conversationMemory.js';

function buildContext(chunks) {
  return chunks
    .map((chunk, index) => `Chunk ${index + 1} (score: ${Number(chunk.score || 0).toFixed(4)}):\n${chunk.chunk_text}`)
    .join('\n\n');
}

export async function runChat({ companyId, message, conversationId = null, topK = 5 }) {
  const conversationResult = await getOrCreateConversation({ companyId, conversationId });
  const activeConversationId = conversationResult.conversationId;
  const memoryLimit = getChatMemoryLimit();

  const recentMessagesResult = await getRecentConversationMessages({
    companyId,
    conversationId: activeConversationId,
    limit: memoryLimit,
  });

  const recentMessages = recentMessagesResult.messages ?? [];
  const historyText = formatConversationHistory(recentMessages);

  const retrieval = await retrieveRelevantChunks({ companyId, query: message, topK });
  const context = buildContext(retrieval.chunks);
  const prompt = buildPrompt({ history: historyText, context, question: message });

  console.log(
    `Chat memory loaded for conversation ${activeConversationId}: ${recentMessages.length} messages, ` +
    `~${estimatePromptTokens(historyText)} tokens; retrieval chunks=${retrieval.chunks.length}`
  );

  const answer = await generateResponse(prompt);

  const persistenceResult = await persistChatTurn({
    companyId,
    conversationId: activeConversationId,
    userMessage: message,
    assistantMessage: answer,
  });

  return {
    conversationId: persistenceResult.savedConversationId ?? activeConversationId,
    persistenceResult,
    answer,
    retrieval,
    context,
    prompt,
    recentMessages,
    historyText,
    memoryLimit,
  };
}