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

  const { error } = await supabase.from('document_chunks').insert(rows);

  if (error) {
    throw error;
  }

  return { saved: rows.length, skipped: false };
}