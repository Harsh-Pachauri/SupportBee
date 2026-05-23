const DEFAULT_PROVIDER = process.env.EMBEDDING_PROVIDER || 'local';
let provider = null;
let providerName = DEFAULT_PROVIDER;

function deterministicVector(text, dim = 384) {
  // simple deterministic pseudo-random generator based on text
  function xorshift32(seed) {
    let x = seed >>> 0;
    return function() {
      x ^= x << 13;
      x >>>= 0;
      x ^= x >>> 17;
      x >>>= 0;
      x ^= x << 5;
      x >>>= 0;
      return x / 0xffffffff;
    };
  }
  function hashStringToSeed(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  const seed = hashStringToSeed((text || '').slice(0, 1024));
  const rand = xorshift32(seed);
  const vec = new Array(dim);
  for (let i = 0; i < dim; i++) {
    vec[i] = rand() * 2 - 1;
  }
  return vec;
}

export async function initEmbeddingProvider() {
  providerName = process.env.EMBEDDING_PROVIDER || DEFAULT_PROVIDER;
  try {
    // dynamic import to keep optional deps out of main bundle
    // provider files should export `init()` and `embed(text)`
    provider = await import(`./providers/${providerName}.js`);
    if (provider && provider.init) {
      await provider.init();
    }
    console.log(`Embedding provider initialized: ${providerName}`);
  } catch (err) {
    console.warn(`Failed to load embedding provider ${providerName}:`, err && err.message ? err.message : err);
    if (providerName !== 'local') {
      console.log('Falling back to local provider.');
      try {
        provider = await import('./providers/local.js');
        if (provider && provider.init) await provider.init();
        providerName = 'local';
      } catch (e) {
        console.warn('Failed to load local provider fallback:', e && e.message ? e.message : e);
        provider = null;
      }
    }
  }
}

export function getActiveProviderName() {
  return providerName;
}

export async function generateEmbedding(text) {
  if (provider && provider.embed) {
    try {
      const vec = await provider.embed(text);
      if (Array.isArray(vec)) return vec;
      console.warn('Embedding provider returned non-array result, using deterministic fallback.');
    } catch (err) {
      console.warn(`Embedding provider ${providerName} failed:`, err && err.message ? err.message : err);
    }
  }
  // fallback deterministic 384-dim vector to match MiniLM
  return deterministicVector(text, 384);
}

export async function generateEmbeddingsBatch(texts) {
  const results = [];
  for (const t of texts) {
    results.push(await generateEmbedding(t));
  }
  return results;
}

// initialize eagerly (best-effort) so provider is ready for ingestion
initEmbeddingProvider().catch((e) => {
  console.warn('initEmbeddingProvider error:', e && e.message ? e.message : e);
});
