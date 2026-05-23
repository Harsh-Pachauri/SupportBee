// Deterministic fallback embedding generator (768 dims).
// If you configure a real embeddings provider later (Gemini, OpenAI, etc.),
// replace this implementation to call that provider and return the vector.

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

import { generateEmbedding, generateEmbeddingsBatch, initEmbeddingProvider, getActiveProviderName } from '../embeddings/index.js';

export { generateEmbedding, generateEmbeddingsBatch, initEmbeddingProvider, getActiveProviderName };
