-- Fix embedding dimension: model produces 384-dim vectors, schema declared 768-dim.
-- Any existing rows have mismatched embeddings and cannot be used — truncate first.
-- The pdf-parse bug (fixed in the same release) prevented any valid chunks from
-- being written, so this table should be empty in practice.

TRUNCATE TABLE document_chunks;

-- Drop the existing function before altering the column it references.
DROP FUNCTION IF EXISTS match_document_chunks(UUID, vector, INT);
DROP FUNCTION IF EXISTS match_document_chunks(UUID, vector(768), INT);

-- Alter the column to the correct dimension.
ALTER TABLE document_chunks
  ALTER COLUMN embedding TYPE VECTOR(384);

-- Recreate the RPC function with the correct dimension.
CREATE OR REPLACE FUNCTION match_document_chunks(
  match_company_id UUID,
  query_embedding VECTOR(384),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  document_id UUID,
  chunk_text TEXT,
  embedding VECTOR(384),
  chunk_index INT,
  created_at TIMESTAMP,
  score FLOAT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    dc.id,
    dc.company_id,
    dc.document_id,
    dc.chunk_text,
    dc.embedding,
    dc.chunk_index,
    dc.created_at,
    1 - (dc.embedding <=> query_embedding) AS score
  FROM document_chunks dc
  WHERE dc.company_id = match_company_id
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
$$;
