import { supabase } from '../../db/supabase.js';
import { generateQueryEmbedding } from './generateQueryEmbedding.js';

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

export async function similaritySearch({ companyId, query, topK = 5 }) {
  const queryEmbedding = await generateQueryEmbedding(query);

  if (!companyId || !supabase) {
    return {
      companyId,
      query,
      topK,
      chunks: [],
      queryEmbedding,
      source: 'offline',
    };
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

    return {
      companyId,
      query,
      topK,
      chunks: data ?? [],
      queryEmbedding,
      source: 'pgvector-rpc',
    };
  } catch (rpcError) {
    console.warn('pgvector RPC unavailable, using local similarity fallback:', rpcError.message || rpcError);
  }

  const { data, error } = await supabase
    .from('document_chunks')
    .select('id, company_id, document_id, chunk_text, embedding, chunk_index, created_at')
    .eq('company_id', companyId);

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

  return {
    companyId,
    query,
    topK,
    chunks: scored,
    queryEmbedding,
    source: 'supabase-js-scored',
  };
}
