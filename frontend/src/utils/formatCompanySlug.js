export function formatCompanySlug(value) {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '-');
}
