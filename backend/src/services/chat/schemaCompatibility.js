export function isMissingColumnError(error, columnName) {
  const message = String(error?.message || error || '').toLowerCase();
  const code = String(error?.code || '').toUpperCase();
  const normalizedColumn = String(columnName || '').toLowerCase();

  if (!normalizedColumn) {
    return false;
  }

  return (
    (message.includes('column') && message.includes(normalizedColumn) && message.includes('does not exist')) ||
    (message.includes('could not find') && message.includes(normalizedColumn))
  );
}
