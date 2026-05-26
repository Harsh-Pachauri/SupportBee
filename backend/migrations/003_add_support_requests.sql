CREATE TABLE IF NOT EXISTS support_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT support_requests_contact_required CHECK (
    (email IS NOT NULL AND length(trim(email)) > 0) OR
    (phone IS NOT NULL AND length(trim(phone)) > 0)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_support_requests_unique_conversation
  ON support_requests(company_id, conversation_id);

CREATE INDEX IF NOT EXISTS idx_support_requests_company_id ON support_requests(company_id);
CREATE INDEX IF NOT EXISTS idx_support_requests_status ON support_requests(status);
CREATE INDEX IF NOT EXISTS idx_support_requests_conversation_id ON support_requests(conversation_id);

CREATE OR REPLACE FUNCTION set_support_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_support_requests_updated_at ON support_requests;

CREATE TRIGGER trg_support_requests_updated_at
BEFORE UPDATE ON support_requests
FOR EACH ROW EXECUTE FUNCTION set_support_requests_updated_at();
