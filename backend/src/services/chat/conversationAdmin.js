import { supabase } from '../../db/supabase.js';
import { classifyConfidence } from './confidence.js';
import { isMissingColumnError } from './schemaCompatibility.js';

function parsePositiveInt(value, fallback, maxValue) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return typeof maxValue === 'number' ? Math.min(parsed, maxValue) : parsed;
}

function normalizeStatusFilter(status) {
  const value = String(status || '').trim().toLowerCase();
  if (!value || value === 'all') {
    return 'all';
  }

  if (['active', 'escalated', 'resolved'].includes(value)) {
    return value;
  }

  return 'all';
}

function truncatePreview(message, maxLength = 120) {
  const text = String(message || '').trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function buildConversationSummary(conversation, messages = []) {
  const orderedMessages = messages.slice().sort((left, right) => new Date(left.created_at) - new Date(right.created_at));
  const latestMessage = orderedMessages[orderedMessages.length - 1] ?? null;
  const latestAssistantMessage = orderedMessages.slice().reverse().find((message) => message.role === 'assistant' && message.confidence_score !== null && message.confidence_score !== undefined) ?? null;
  const latestConfidenceScore = latestAssistantMessage?.confidence_score ?? null;
  const latestConfidence = latestConfidenceScore === null ? null : classifyConfidence(Number(latestConfidenceScore));

  return {
    conversation_id: conversation.id,
    status: conversation.status || (conversation.needs_human ? 'escalated' : 'active'),
    needs_human: Boolean(conversation.needs_human),
    latest_message_preview: truncatePreview(latestMessage?.message || ''),
    latest_confidence_score: latestConfidenceScore === null ? null : Number(latestConfidenceScore),
    latest_confidence_level: latestConfidence?.level ?? null,
    message_count: messages.length,
    created_at: conversation.created_at || latestMessage?.created_at || null,
    updated_at: conversation.updated_at || latestMessage?.created_at || conversation.created_at || null,
  };
}

async function fetchConversationMessages(companyId, conversationIds) {
  if (!supabase || !companyId || !conversationIds.length) {
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, role, message, confidence_score, created_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function listCompanyConversations({ companyId, status = 'all', escalatedOnly = false, page = 1, limit = 20 }) {
  const normalizedStatus = normalizeStatusFilter(status);
  const safePage = parsePositiveInt(page, 1);
  const safeLimit = parsePositiveInt(limit, 20, 50);

  if (!companyId) {
    throw new Error('companyId is required');
  }

  if (!supabase) {
    return {
      conversations: [],
      meta: {
        page: safePage,
        limit: safeLimit,
        total: 0,
        totalPages: 0,
        status: normalizedStatus,
        escalatedOnly: Boolean(escalatedOnly),
      },
      source: 'offline',
    };
  }

  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit - 1;

  let query = supabase
    .from('conversations')
    .select('id, company_id, needs_human, status, created_at', { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(start, end);

  if (normalizedStatus !== 'all') {
    if (normalizedStatus === 'escalated') {
      query = query.eq('needs_human', true);
    } else {
      query = query.eq('status', normalizedStatus);
    }
  } else if (escalatedOnly) {
    query = query.eq('needs_human', true);
  }

  let { data: conversations, error, count } = await query;

  if (error && isMissingColumnError(error, 'status')) {
    let fallbackQuery = supabase
      .from('conversations')
      .select('id, company_id, needs_human, created_at', { count: 'exact' })
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .range(start, end);

    if (normalizedStatus === 'escalated' || escalatedOnly) {
      fallbackQuery = fallbackQuery.eq('needs_human', true);
    } else if (normalizedStatus === 'active') {
      fallbackQuery = fallbackQuery.eq('needs_human', false);
    }

    const fallback = await fallbackQuery;
    conversations = fallback.data;
    error = fallback.error;
    count = fallback.count;
  }

  if (error) {
    throw error;
  }

  const conversationRows = conversations ?? [];
  const conversationIds = conversationRows.map((conversation) => conversation.id);
  const messageRows = await fetchConversationMessages(companyId, conversationIds);

  const messagesByConversation = new Map();
  for (const message of messageRows) {
    if (!messagesByConversation.has(message.conversation_id)) {
      messagesByConversation.set(message.conversation_id, []);
    }

    messagesByConversation.get(message.conversation_id).push(message);
  }

  const summaries = conversationRows
    .map((conversation) => {
      const messages = messagesByConversation.get(conversation.id) ?? [];
      return buildConversationSummary(conversation, messages);
    })
    .sort((left, right) => new Date(right.updated_at || right.created_at || 0) - new Date(left.updated_at || left.created_at || 0));

  console.log(
    `Conversation list fetched for company ${companyId}: page=${safePage} limit=${safeLimit} ` +
    `status=${normalizedStatus} escalatedOnly=${Boolean(escalatedOnly)} returned=${summaries.length}`
  );

  return {
    conversations: summaries,
    meta: {
      page: safePage,
      limit: safeLimit,
      total: count ?? summaries.length,
      totalPages: Math.max(1, Math.ceil((count ?? summaries.length) / safeLimit)),
      status: normalizedStatus,
      escalatedOnly: Boolean(escalatedOnly),
    },
    source: 'supabase',
  };
}

export async function getCompanyConversationDetail({ companyId, conversationId }) {
  if (!companyId || !conversationId) {
    throw new Error('companyId and conversationId are required');
  }

  if (!supabase) {
    return { conversation: null, messages: [], summary: null, source: 'offline' };
  }

  let { data: conversation, error } = await supabase
    .from('conversations')
    .select('id, company_id, needs_human, status, created_at')
    .eq('id', conversationId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error && isMissingColumnError(error, 'status')) {
    const fallback = await supabase
      .from('conversations')
      .select('id, company_id, needs_human, created_at')
      .eq('id', conversationId)
      .eq('company_id', companyId)
      .maybeSingle();

    conversation = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }

  if (!conversation) {
    return { conversation: null, messages: [], summary: null, source: 'supabase' };
  }

  const { data: messages, error: messagesError } = await supabase
    .from('messages')
    .select('id, conversation_id, role, message, confidence_score, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw messagesError;
  }

  const summary = buildConversationSummary(conversation, messages ?? []);

  console.log(`Conversation detail fetched for company ${companyId}: conversation=${conversationId}`);

  return {
    conversation: {
      ...conversation,
      ...summary,
    },
    messages: messages ?? [],
    summary,
    source: 'supabase',
  };
}
