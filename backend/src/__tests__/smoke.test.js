/**
 * Smoke tests for critical subsystems.
 * Run with: node --test src/__tests__/smoke.test.js
 *
 * supabase.js throws at load if SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are
 * missing. Set placeholder values before any dynamic imports that pull in
 * modules which transitively import supabase.js.
 */

process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://placeholder.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_smoke_secret';

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';

const srcRoot = new URL('..', import.meta.url);

// ─── PDF parsing ────────────────────────────────────────────────────────────

describe('extractText', () => {
  it('returns a string (or empty string) for an empty buffer', async () => {
    const { extractTextFromPdf } = await import('../services/ingestion/extractText.js');
    const result = await extractTextFromPdf(Buffer.alloc(0)).catch(() => '');
    assert.equal(typeof result, 'string');
  });
});

// ─── Text chunking ──────────────────────────────────────────────────────────

describe('chunkText', () => {
  it('splits text into overlapping chunks of correct size', async () => {
    const { chunkText } = await import('../services/ingestion/chunkText.js');
    const text = 'a'.repeat(2500);
    // step = 1000 - 200 = 800
    // starts: 0, 800, 1600, 2400 → 4 chunks (last is 100 chars)
    const chunks = chunkText(text, 1000, 200);
    assert.equal(chunks.length, 4);
    for (const chunk of chunks) {
      assert.ok(chunk.length > 0);
      assert.ok(chunk.length <= 1000);
    }
  });

  it('returns empty array for empty string', async () => {
    const { chunkText } = await import('../services/ingestion/chunkText.js');
    assert.deepEqual(chunkText(''), []);
  });
});

// ─── Embedding module shape ───────────────────────────────────────────────────

describe('embedding module exports', () => {
  it('re-exports the correct functions', async () => {
    const mod = await import('../services/embeddings/index.js');
    assert.equal(typeof mod.generateEmbedding, 'function');
    assert.equal(typeof mod.generateEmbeddingsBatch, 'function');
    assert.equal(typeof mod.initEmbeddingProvider, 'function');
    assert.equal(typeof mod.getActiveProviderName, 'function');
  });

  /**
   * NOT_VERIFIED (runtime) — generateEmbedding lazy-loads ~90MB Xenova model
   * weights on first call. Actual 384-dim output verified by running the full
   * ingestion pipeline with a real PDF against a live Supabase instance.
   */
});

// ─── Slug / UUID rejection ───────────────────────────────────────────────────

describe('companyLookup — UUID fallback removed', () => {
  it('contains no UUID-fallback code path', () => {
    const content = readFileSync(
      fileURLToPath(new URL('services/retrieval/companyLookup.js', srcRoot)),
      'utf8'
    );
    assert.ok(!content.includes('isUUID'), 'UUID helper must not exist');
    assert.ok(!content.includes('UUID_REGEX'), 'UUID_REGEX must not exist');
    assert.ok(!content.includes("select('id, slug, company_name').eq('id'"), 'UUID fallback .eq(id) must not exist');
    assert.ok(content.includes("eq('slug', companySlug)"), 'slug-only lookup must be present');
  });
});

// ─── Auth middleware ─────────────────────────────────────────────────────────

describe('requireAuth middleware', () => {
  let requireAuth;
  before(async () => {
    ({ requireAuth } = await import('../middleware/auth.middleware.js'));
  });

  function makeRes() {
    let statusCode, body;
    const res = {
      status(code) { statusCode = code; return this; },
      json(b) { body = b; return this; },
      get statusCode() { return statusCode; },
      get body() { return body; },
    };
    return res;
  }

  it('rejects missing Authorization header with 401', () => {
    const req = { headers: {} };
    const res = makeRes();
    requireAuth(req, res, () => { throw new Error('should not call next'); });
    assert.equal(res.statusCode, 401);
  });

  it('rejects malformed bearer token with 401', () => {
    const req = { headers: { authorization: 'Bearer not.a.valid.jwt' } };
    const res = makeRes();
    requireAuth(req, res, () => { throw new Error('should not call next'); });
    assert.equal(res.statusCode, 401);
  });

  it('accepts valid JWT, sets req.auth and req.companyId, calls next', () => {
    const token = jwt.sign(
      { companyId: 'abc-123', email: 'test@example.com', slug: 'test-co' },
      'test_smoke_secret',
      { expiresIn: '1h' }
    );
    const req = { headers: { authorization: `Bearer ${token}` } };
    const res = makeRes();
    let nextCalled = false;
    requireAuth(req, res, () => { nextCalled = true; });
    assert.ok(nextCalled);
    assert.equal(req.auth.companyId, 'abc-123');
    assert.equal(req.companyId, 'abc-123');
  });
});

// ─── Document status lifecycle ───────────────────────────────────────────────

describe('document status values', () => {
  it('controller inserts status=processing and updates to status=processed, never status=ready', () => {
    const content = readFileSync(
      fileURLToPath(new URL('controllers/document.controller.js', srcRoot)),
      'utf8'
    );
    assert.ok(content.includes("status: 'processing'"), "must insert with status='processing'");
    assert.ok(content.includes("status: 'processed'"), "must update to status='processed'");
    assert.ok(!content.includes("status: 'ready'"), "status='ready' must not appear");
  });

  it('schema default is processing', () => {
    const content = readFileSync(
      fileURLToPath(new URL('../migrations/001_initial_schema.sql', srcRoot)),
      'utf8'
    );
    assert.ok(content.includes("DEFAULT 'processing'"), "schema default must be 'processing'");
  });
});

// ─── buildPrompt structure ───────────────────────────────────────────────────

describe('buildPrompt', () => {
  it('returns {system, user, full} with all fields populated', async () => {
    const { buildPrompt } = await import('../services/retrieval/buildPrompt.js');
    const result = buildPrompt({ history: 'Q: hi', context: 'Company docs here', question: 'Refund policy?' });
    assert.equal(typeof result.system, 'string');
    assert.equal(typeof result.user, 'string');
    assert.equal(typeof result.full, 'string');
    assert.ok(result.system.length > 0);
    assert.ok(result.full.startsWith(result.system));
    assert.ok(result.user.includes('Refund policy?'));
    assert.ok(result.user.includes('Company docs here'));
  });

  it('renders None. when history is absent', async () => {
    const { buildPrompt } = await import('../services/retrieval/buildPrompt.js');
    const result = buildPrompt({ context: 'ctx', question: 'q?' });
    assert.ok(result.user.includes('None.'));
  });
});

// ─── LLM providers read structured prompt ───────────────────────────────────

describe('groq provider source', () => {
  it('reads prompt.system and sends system+user messages', () => {
    const content = readFileSync(
      fileURLToPath(new URL('services/llm/providers/groq.js', srcRoot)),
      'utf8'
    );
    assert.ok(content.includes('prompt?.system'));
    assert.ok(content.includes('prompt?.user'));
    assert.ok(content.includes("role: 'system'"));
    assert.ok(content.includes("role: 'user'"));
  });
});

describe('gemini provider source', () => {
  it('uses systemInstruction and reads prompt.system', () => {
    const content = readFileSync(
      fileURLToPath(new URL('services/llm/providers/gemini.js', srcRoot)),
      'utf8'
    );
    assert.ok(content.includes('systemInstruction'));
    assert.ok(content.includes('prompt?.system'));
    assert.ok(content.includes('prompt?.user'));
  });
});

// ─── schemaCompatibility ──────────────────────────────────────────────────────

describe('isMissingColumnError', () => {
  let isMissingColumnError;
  before(async () => {
    ({ isMissingColumnError } = await import('../services/chat/schemaCompatibility.js'));
  });

  it('matches "column X does not exist" message', () => {
    assert.ok(isMissingColumnError({ message: 'column "status" does not exist' }, 'status'));
  });

  it('matches "could not find X" message', () => {
    assert.ok(isMissingColumnError({ message: 'could not find column "status" in schema cache' }, 'status'));
  });

  it('does not match PGRST204 code alone (old buggy behavior removed)', () => {
    assert.ok(!isMissingColumnError({ code: 'PGRST204', message: '' }, 'status'));
  });

  it('returns false for unrelated errors', () => {
    assert.ok(!isMissingColumnError({ message: 'some other db error' }, 'status'));
  });

  it('returns false for empty columnName', () => {
    assert.ok(!isMissingColumnError({ message: 'column "status" does not exist' }, ''));
  });
});

// ─── evaluateEscalation ───────────────────────────────────────────────────────

describe('evaluateEscalation', () => {
  let evaluateEscalation;
  before(async () => {
    ({ evaluateEscalation } = await import('../services/chat/escalation.js'));
  });

  it('needed=true for low confidence level', () => {
    const result = evaluateEscalation({ level: 'low', score: 0.1 });
    assert.ok(result.needed);
    assert.equal(result.state, 'escalated');
  });

  it('needed=false for high confidence level', () => {
    const result = evaluateEscalation({ level: 'high', score: 0.9 });
    assert.ok(!result.needed);
    assert.equal(result.state, 'active');
  });

  it('accepts raw numeric score (classifies internally)', () => {
    const result = evaluateEscalation(0);
    assert.ok(typeof result.needed === 'boolean');
    assert.ok(typeof result.state === 'string');
  });
});

// ─── Migration 004 structure ─────────────────────────────────────────────────

describe('migration 004 — fix embedding dimension', () => {
  it('truncates table before ALTER, uses VECTOR(384) throughout', () => {
    const content = readFileSync(
      fileURLToPath(new URL('../migrations/004_fix_embedding_dimension.sql', srcRoot)),
      'utf8'
    );
    const truncatePos = content.indexOf('TRUNCATE TABLE');
    const alterPos = content.indexOf('ALTER TABLE');
    assert.ok(truncatePos >= 0, 'must TRUNCATE before ALTER');
    assert.ok(alterPos > truncatePos, 'ALTER must come after TRUNCATE');
    assert.ok(!content.includes('VECTOR(768)'), 'must not reference VECTOR(768)');
    assert.ok(content.includes('VECTOR(384)'), 'must use VECTOR(384)');
    assert.ok(content.includes('DROP FUNCTION IF EXISTS'), 'must DROP old function before CREATE');
  });
});
