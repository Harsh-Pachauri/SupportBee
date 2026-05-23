let _pipeline = null;

export async function init() {
  try {
    const { pipeline } = await import('@xenova/transformers');
    // feature-extraction returns token embeddings; we'll average them
    _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log('Local embedding model loaded (all-MiniLM-L6-v2)');
  } catch (err) {
    console.warn('Failed to initialize local embedding model:', err && err.message ? err.message : err);
    _pipeline = null;
  }
}

function meanPool(tokenEmbeddings) {
  if (!Array.isArray(tokenEmbeddings)) return tokenEmbeddings;
  // tokenEmbeddings: [numTokens][dim]
  const numTokens = tokenEmbeddings.length;
  if (numTokens === 0) return [];
  const dim = tokenEmbeddings[0].length;
  const out = new Array(dim).fill(0);
  for (let i = 0; i < numTokens; i++) {
    const tok = tokenEmbeddings[i];
    for (let j = 0; j < dim; j++) out[j] += tok[j];
  }
  for (let j = 0; j < out.length; j++) out[j] /= numTokens;
  return out;
}

export async function embed(text) {
  if (!_pipeline) {
    throw new Error('Local embedding pipeline not initialized');
  }
  // transformers pipeline may accept string and return nested arrays
  const res = await _pipeline(text);
  // Some versions return {data: ...} or directly an array
  const embeddings = Array.isArray(res) ? res : res?.data ?? res;
  // If embeddings is [tokens][dim], average
  if (Array.isArray(embeddings) && Array.isArray(embeddings[0])) {
    return meanPool(embeddings);
  }
  // Otherwise, if it's already flat array
  return embeddings;
}
