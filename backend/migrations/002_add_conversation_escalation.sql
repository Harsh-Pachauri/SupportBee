ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

UPDATE conversations
SET status = CASE
  WHEN needs_human = TRUE THEN 'escalated'
  ELSE COALESCE(status, 'active')
END;

CREATE INDEX IF NOT EXISTS idx_conversations_status ON conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_needs_human ON conversations(needs_human);
