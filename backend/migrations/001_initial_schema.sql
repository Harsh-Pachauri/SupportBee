CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  chunk_text TEXT NOT NULL,
  embedding VECTOR(768),
  chunk_index INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  needs_human BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  message TEXT NOT NULL,
  confidence_score FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chatbots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  chatbot_name TEXT DEFAULT 'Support Assistant',
  welcome_message TEXT DEFAULT 'Hello! How can I help you today?',
  theme_color TEXT DEFAULT '#000000',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_documents_company_id ON documents(company_id);
CREATE INDEX idx_document_chunks_company_id ON document_chunks(company_id);
CREATE INDEX idx_document_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_conversations_company_id ON conversations(company_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

CREATE OR REPLACE FUNCTION match_document_chunks(
  match_company_id UUID,
  query_embedding VECTOR(768),
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  company_id UUID,
  document_id UUID,
  chunk_text TEXT,
  embedding VECTOR(768),
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
