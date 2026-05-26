import { supabase } from '../../db/supabase.js';
import { classifyConfidence, getConfidenceThresholds } from './confidence.js';
import { isMissingColumnError } from './schemaCompatibility.js';
import { ragDebug } from '../../utils/ragDebug.js';

export function evaluateEscalation(confidence, thresholds = getConfidenceThresholds()) {
  const evaluatedConfidence = classifyConfidence(confidence?.score ?? confidence ?? 0, thresholds, {
    log: false,
    context: 'escalation-evaluation',
  });

  return {
    ...evaluatedConfidence,
    needed: evaluatedConfidence.level === 'low',
    state: evaluatedConfidence.level === 'low' ? 'escalated' : 'active',
  };
}

export async function persistConversationEscalation({ companyId, conversationId, confidence }) {
  const escalation = evaluateEscalation(confidence);

  ragDebug('Escalation', 'Decision', {
    conversationId,
    companyId,
    triggered: escalation.needed,
    reason: escalation.needed ? `confidence level = ${escalation.level}` : `confidence level = ${escalation.level}`,
    score: Number(escalation.score ?? 0),
    level: escalation.level,
  });

  if (!escalation.needed) {
    return { ...escalation, skipped: true, persisted: false };
  }

  if (!supabase || !companyId || !conversationId) {
    ragDebug('Escalation', 'Persistence skipped', {
      conversationId: conversationId ?? 'n/a',
      companyId,
      score: Number(escalation.score ?? 0),
      level: escalation.level,
      reason: 'database context unavailable',
    });
    return { ...escalation, skipped: true, persisted: false };
  }

  ragDebug('Escalation', 'Persistence started', {
    conversationId,
    companyId,
    score: Number(escalation.score ?? 0),
    level: escalation.level,
    update: { needs_human: true, status: 'escalated' },
  });

  const withStatus = async () => supabase
    .from('conversations')
    .update({ needs_human: true, status: 'escalated' })
    .eq('id', conversationId)
    .eq('company_id', companyId)
    .select('id, company_id, needs_human, status, created_at')
    .maybeSingle();

  let { data, error } = await withStatus();

  if (error && isMissingColumnError(error, 'status')) {
    console.warn('Conversation status column is missing; persisting escalation without status field.');
    const fallback = await supabase
      .from('conversations')
      .update({ needs_human: true })
      .eq('id', conversationId)
      .eq('company_id', companyId)
      .select('id, company_id, needs_human, created_at')
      .maybeSingle();

    data = fallback.data;
    error = fallback.error;
  }

  if (error) {
    throw error;
  }

  ragDebug('Escalation', 'Persistence complete', {
    conversationId,
    companyId,
    persisted: true,
    needs_human: Boolean(data?.needs_human),
    status: data?.status || escalation.state,
  });

  return {
    ...escalation,
    persisted: true,
    skipped: false,
    conversation: data ?? null,
  };
}
