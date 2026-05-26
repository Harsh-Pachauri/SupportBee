import { supabase } from '../../db/supabase.js';

const VALID_STATUSES = new Set(['pending', 'contacted', 'resolved']);

function normalizeText(value) {
  if (value === undefined || value === null) {
    return '';
  }

  return String(value).trim();
}

function sanitizeSupportRequest(row) {
  if (!row) return null;

  return {
    id: row.id,
    company_id: row.company_id,
    conversation_id: row.conversation_id,
    email: row.email || '',
    phone: row.phone || '',
    notes: row.notes || '',
    status: row.status || 'pending',
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

function ensureValidContact({ email, phone }) {
  if (!email && !phone) {
    const error = new Error('Provide an email or phone number for follow-up.');
    error.statusCode = 400;
    throw error;
  }

  if (email) {
    const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isEmailValid) {
      const error = new Error('Please provide a valid email address.');
      error.statusCode = 400;
      throw error;
    }
  }

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) {
      const error = new Error('Please provide a valid phone number.');
      error.statusCode = 400;
      throw error;
    }
  }
}

async function ensureConversationForCompany({ companyId, conversationId }) {
  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('conversations')
    .select('id, company_id, needs_human, status, created_at')
    .eq('id', conversationId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const missingError = new Error('Conversation not found for this company.');
    missingError.statusCode = 404;
    throw missingError;
  }

  return data;
}

export async function createSupportRequest({ companyId, conversationId, email, phone, notes }) {
  if (!companyId || !conversationId) {
    const error = new Error('companyId and conversationId are required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedEmail = normalizeText(email).toLowerCase();
  const normalizedPhone = normalizeText(phone);
  const normalizedNotes = normalizeText(notes);

  ensureValidContact({ email: normalizedEmail, phone: normalizedPhone });

  if (!supabase) {
    return {
      supportRequest: null,
      created: false,
      source: 'offline',
      alreadySubmitted: false,
    };
  }

  await ensureConversationForCompany({ companyId, conversationId });

  const { data: existing, error: existingError } = await supabase
    .from('support_requests')
    .select('id, company_id, conversation_id, email, phone, notes, status, created_at, updated_at')
    .eq('company_id', companyId)
    .eq('conversation_id', conversationId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existing) {
    return {
      supportRequest: sanitizeSupportRequest(existing),
      created: false,
      source: 'supabase',
      alreadySubmitted: true,
    };
  }

  const { data, error } = await supabase
    .from('support_requests')
    .insert([
      {
        company_id: companyId,
        conversation_id: conversationId,
        email: normalizedEmail || null,
        phone: normalizedPhone || null,
        notes: normalizedNotes || null,
        status: 'pending',
      },
    ])
    .select('id, company_id, conversation_id, email, phone, notes, status, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return {
    supportRequest: sanitizeSupportRequest(data),
    created: true,
    source: 'supabase',
    alreadySubmitted: false,
  };
}

export async function listSupportRequests({ companyId, status = 'all', page = 1, limit = 20 }) {
  if (!companyId) {
    const error = new Error('companyId is required.');
    error.statusCode = 400;
    throw error;
  }

  if (!supabase) {
    return {
      supportRequests: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0, status: 'all' },
      source: 'offline',
    };
  }

  const normalizedStatus = normalizeText(status).toLowerCase() || 'all';
  const safeStatus = VALID_STATUSES.has(normalizedStatus) ? normalizedStatus : 'all';
  const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Math.min(Number(limit), 50) : 20;
  const start = (safePage - 1) * safeLimit;
  const end = start + safeLimit - 1;

  let query = supabase
    .from('support_requests')
    .select('id, company_id, conversation_id, email, phone, notes, status, created_at, updated_at', { count: 'exact' })
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .range(start, end);

  if (safeStatus !== 'all') {
    query = query.eq('status', safeStatus);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    supportRequests: (data ?? []).map((row) => sanitizeSupportRequest(row)),
    meta: {
      page: safePage,
      limit: safeLimit,
      total: count ?? 0,
      totalPages: Math.max(1, Math.ceil((count ?? 0) / safeLimit)),
      status: safeStatus,
    },
    source: 'supabase',
  };
}

export async function updateSupportRequestStatus({ companyId, requestId, status }) {
  if (!companyId || !requestId) {
    const error = new Error('companyId and requestId are required.');
    error.statusCode = 400;
    throw error;
  }

  const normalizedStatus = normalizeText(status).toLowerCase();
  if (!VALID_STATUSES.has(normalizedStatus)) {
    const error = new Error('status must be pending, contacted, or resolved.');
    error.statusCode = 400;
    throw error;
  }

  if (!supabase) {
    return { supportRequest: null, source: 'offline' };
  }

  const { data, error } = await supabase
    .from('support_requests')
    .update({ status: normalizedStatus })
    .eq('id', requestId)
    .eq('company_id', companyId)
    .select('id, company_id, conversation_id, email, phone, notes, status, created_at, updated_at')
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const missingError = new Error('Support request not found for this company.');
    missingError.statusCode = 404;
    throw missingError;
  }

  return {
    supportRequest: sanitizeSupportRequest(data),
    source: 'supabase',
  };
}
