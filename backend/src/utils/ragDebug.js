function isDebugEnabled() {
  return String(process.env.DEBUG_RAG || '').trim().toLowerCase() === 'true';
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return '"[unserializable]"';
  }
}

export function isRagDebugEnabled() {
  return isDebugEnabled();
}

export function ragDebug(section, message, details = null) {
  if (!isDebugEnabled()) {
    return;
  }

  const suffix = details && (typeof details !== 'object' || Object.keys(details).length > 0)
    ? ` ${safeStringify(details)}`
    : '';

  console.log(`[${section}] ${message}${suffix}`);
}
