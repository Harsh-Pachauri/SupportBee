import { requestJson } from './api.js';

export function registerCompany(payload) {
  return requestJson('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function loginCompany(payload) {
  return requestJson('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchMe() {
  return requestJson('/api/auth/me');
}
