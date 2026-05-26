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

export function fetchSupportRequests(params = {}) {
  return requestJson(`/api/support-requests${buildQuery(params)}`);
}

export function updateSupportRequest(requestId, payload) {
  return requestJson(`/api/support-requests/${requestId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
