import { retrieveRelevantChunks } from '../retrieval/retrieveChunks.js';
import { buildPrompt } from '../retrieval/buildPrompt.js';
import { generateResponse } from '../llm/generateResponse.js';
import { persistChatTurn } from './persistChatTurn.js';

function buildContext(chunks) {
  return chunks
    .map((chunk, index) => `Chunk ${index + 1} (score: ${Number(chunk.score || 0).toFixed(4)}):\n${chunk.chunk_text}`)
    .join('\n\n');
}

export async function runChat({ companyId, message, conversationId = null, topK = 5 }) {
  const retrieval = await retrieveRelevantChunks({ companyId, query: message, topK });
  const context = buildContext(retrieval.chunks);
  const prompt = buildPrompt({ context, question: message });
  const answer = await generateResponse(prompt);

  const persistenceResult = await persistChatTurn({
    companyId,
    conversationId,
    userMessage: message,
    assistantMessage: answer,
  });

  return {
    conversationId: persistenceResult.savedConversationId ?? conversationId,
    persistenceResult,
    answer,
    retrieval,
    context,
    prompt,
  };
}