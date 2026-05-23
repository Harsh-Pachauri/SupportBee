// Placeholder Gemini embedding provider.
// This isolates Gemini embedding logic so it can be implemented later
// without touching ingestion/retrieval code. For now it will attempt
// to detect credentials and throw a clear error if used but not implemented.

export async function init() {
  // nothing to init for now
  if (!process.env.GEMINI_API_KEY) {
    console.warn('Gemini provider selected but GEMINI_API_KEY is not set.');
  } else {
    console.log('Gemini embedding provider selected (implementation pending).');
  }
}

export async function embed(text) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured for Gemini embedding provider');
  }
  // TODO: implement actual Gemini embeddings call here.
  // Keep error explicit so user knows it's not yet wired.
  throw new Error('Gemini embeddings provider not implemented in this repository.');
}
