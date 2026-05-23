import { requestJson } from './api.js';

export function getPublicCompanyInfo(companySlug) {
  return requestJson(`/api/public/${companySlug}/info`);
}

export function sendPublicChat(companySlug, payload) {
  return requestJson(`/api/public/${companySlug}/chat`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function sendInternalChat(payload) {
  return requestJson('/api/chat', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
