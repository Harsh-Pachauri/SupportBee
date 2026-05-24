import { getStoredCompany, requestFormData, requestJson } from './api.js';

export function uploadDocument(file) {
  const company = getStoredCompany();
  const formData = new FormData();
  formData.append('file', file);
  if (company?.id) {
    formData.append('companyId', company.id);
  }

  return requestFormData('/api/documents/upload', formData);
}

export function fetchDocuments() {
  return requestJson('/api/documents');
}

export function removeDocument(documentId) {
  return requestJson(`/api/documents/${documentId}`, {
    method: 'DELETE',
  });
}
