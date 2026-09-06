import { supabase } from '../../db/supabase.js';

export async function saveDocumentChunks({ companyId, documentId, chunks }) {
  if (!supabase || !companyId || !documentId || !Array.isArray(chunks) || chunks.length === 0) {
    return { saved: 0, skipped: true };
  }

  const rows = chunks.map((chunk) => ({
    company_id: companyId,
    document_id: documentId,
    chunk_text: chunk.chunkText,
    embedding: chunk.embedding,
    chunk_index: chunk.chunkIndex,
  }));

  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const { error } = await supabase.from('document_chunks').insert(rows.slice(i, i + BATCH_SIZE));
    if (error) throw error;
  }

  return { saved: rows.length, skipped: false };
}