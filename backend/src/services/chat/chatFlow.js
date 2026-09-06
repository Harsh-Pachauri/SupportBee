import { retrieveRelevantChunks } from '../retrieval/retrieveChunks.js';
import { buildPrompt } from '../retrieval/buildPrompt.js';
import { generateResponse } from '../llm/generateResponse.js';
import { persistChatTurn } from './persistChatTurn.js';
import { classifyConfidence } from './confidence.js';
import { persistConversationEscalation } from './escalation.js';
import { ragDebug } from '../../utils/ragDebug.js';
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
  const confidence = classifyConfidence(retrieval.topScore ?? 0, undefined, {
    log: true,
    context: 'chat-response',
  });
  const context = buildContext(retrieval.chunks);
  const prompt = buildPrompt({ history: historyText, context, question: message });
  const promptFull = prompt.full;

  ragDebug('Retrieval', 'Chat request summary', {
    conversationId: activeConversationId,
    query: message,
    recentMessages: recentMessages.length,
    estimatedHistoryTokens: estimatePromptTokens(historyText),
    retrievalSource: retrieval.source,
    scoreType: retrieval.scoreType,
    topScore: Number(retrieval.topScore ?? 0),
    topScores: retrieval.chunks.slice(0, topK).map((chunk) => Number(chunk.score ?? 0)),
    confidence: {
      score: confidence.score,
      level: confidence.level,
    },
  });

  const answer = await generateResponse(prompt);

  if (!retrieval.chunks.length) {
    ragDebug('Retrieval', 'Quality warning', {
      conversationId: activeConversationId,
      query: message,
      reason: 'no matching chunks returned',
    });
  }

  const persistenceResult = await persistChatTurn({
    companyId,
    conversationId: activeConversationId,
    userMessage: message,
    assistantMessage: answer,
    confidenceScore: confidence.score,
  });

  const escalation = await persistConversationEscalation({
    companyId,
    conversationId: activeConversationId,
    confidence,
  });

  ragDebug('Retrieval', 'Request complete', {
    conversationId: persistenceResult.savedConversationId ?? activeConversationId,
    query: message,
    topScore: Number(retrieval.topScore ?? 0),
    confidence: {
      score: confidence.score,
      level: confidence.level,
    },
    escalation: {
      needed: escalation.needed,
      status: escalation.state,
      persisted: escalation.persisted,
    },
  });

  return {
    conversationId: persistenceResult.savedConversationId ?? activeConversationId,
    persistenceResult,
    answer,
    confidence,
    escalation: {
      needed: escalation.needed,
      status: escalation.state,
      persisted: escalation.persisted,
    },
    retrieval,
    context,
    prompt: promptFull,
    recentMessages,
    historyText,
    memoryLimit,
  };
}