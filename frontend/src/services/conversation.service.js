import { requestJson } from './api.js';

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

export function fetchConversations(params = {}) {
  return requestJson(`/api/chat/conversations${buildQuery(params)}`);
}

export function fetchConversationDetail(conversationId) {
  return requestJson(`/api/chat/conversations/${conversationId}`);
}
