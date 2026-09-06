import { supabase } from '../../db/supabase.js';
import { generateQueryEmbedding } from './generateQueryEmbedding.js';
import { ragDebug } from '../../utils/ragDebug.js';

function cosineSimilarity(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length === 0 || b.length === 0) {
    return 0;
  }

  const length = Math.min(a.length, b.length);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < length; i++) {
    const x = Number(a[i]) || 0;
    const y = Number(b[i]) || 0;
    dot += x * y;
    normA += x * x;
    normB += y * y;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function normalizeEmbedding(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch {
      return [];
    }
  }
  return [];
}

function previewChunkText(text, maxLength = 140) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function getEmbeddingDimensions(value) {
  const normalized = normalizeEmbedding(value);
  return Array.isArray(normalized) ? normalized.length : 0;
}

function buildChunkDebugRows(chunks = [], limit = 5) {
  return chunks.slice(0, limit).map((chunk, index) => ({
    rank: index + 1,
    score: Number(chunk.score ?? 0),
    preview: previewChunkText(chunk.chunk_text),
  }));
}

function logRetrievalDebug({ query, result, queryEmbedding, sourceLabel }) {
  const topScores = result.chunks.slice(0, result.topK ?? 5).map((chunk) => Number(chunk.score ?? 0));
  const topChunk = result.chunks[0] ?? null;

  ragDebug('Retrieval', 'Trace', {
    query,
    source: result.source,
    sourceLabel,
    fallbackUsed: result.source !== 'pgvector-rpc',
    scoreType: result.scoreType,
    scoreDirection: 'higher-is-better',
    topScore: Number(result.topScore ?? 0),
    topScores,
    queryEmbeddingDimensions: Array.isArray(queryEmbedding) ? queryEmbedding.length : 0,
    retrievedVectorDimensions: getEmbeddingDimensions(topChunk?.embedding),
    topChunks: buildChunkDebugRows(result.chunks, result.topK ?? 5),
  });
}

export async function similaritySearch({ companyId, query, topK = 5 }) {
  const queryEmbedding = await generateQueryEmbedding(query);

  if (!companyId || !supabase) {
    const chunks = [];
    const result = {
      companyId,
      query,
      topK,
      chunks,
      topScore: 0,
      scoreType: 'cosine_similarity',
      queryEmbedding,
      source: 'offline',
    };

    logRetrievalDebug({
      query,
      result,
      queryEmbedding,
      sourceLabel: 'offline',
    });
    return result;
  }

  try {
    const { data, error } = await supabase.rpc('match_document_chunks', {
      match_company_id: companyId,
      query_embedding: queryEmbedding,
      match_count: topK,
    });

    if (error) {
      throw error;
    }

    const result = {
      companyId,
      query,
      topK,
      chunks: data ?? [],
      topScore: Number((data ?? [])[0]?.score ?? 0),
      scoreType: 'cosine_similarity',
      queryEmbedding,
      source: 'pgvector-rpc',
    };

    logRetrievalDebug({
      query,
      result,
      queryEmbedding,
      sourceLabel: 'pgvector-rpc',
    });
    return result;
  } catch (rpcError) {
    console.warn('pgvector RPC unavailable, using local similarity fallback:', rpcError.message || rpcError);
  }

  const { data, error } = await supabase
    .from('document_chunks')
    .select('id, company_id, document_id, chunk_text, embedding, chunk_index, created_at')
    .eq('company_id', companyId)
    .limit(1000);

  if (error) {
    throw error;
  }

  const scored = (data ?? [])
    .map((row) => ({
      ...row,
      embedding: normalizeEmbedding(row.embedding),
      score: cosineSimilarity(queryEmbedding, normalizeEmbedding(row.embedding)),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, topK);

  const result = {
    companyId,
    query,
    topK,
    chunks: scored,
    topScore: Number(scored[0]?.score ?? 0),
    scoreType: 'cosine_similarity',
    queryEmbedding,
    source: 'supabase-js-scored',
  };

  logRetrievalDebug({
    query,
    result,
    queryEmbedding,
    sourceLabel: 'js-cosine-fallback',
  });

  return result;
}
