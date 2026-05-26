import { ragDebug } from '../../utils/ragDebug.js';

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getConfidenceThresholds() {
  const high = toNumber(process.env.CONFIDENCE_HIGH_THRESHOLD, 0.8);
  const medium = toNumber(process.env.CONFIDENCE_MEDIUM_THRESHOLD, 0.6);

  return {
    high: Math.min(1, Math.max(0, high)),
    medium: Math.min(1, Math.max(0, medium)),
  };
}

export function normalizeConfidenceScore(score) {
  if (!Number.isFinite(score)) {
    return 0;
  }

  return Math.min(1, Math.max(0, score));
}

export function classifyConfidence(score, thresholds = getConfidenceThresholds(), options = {}) {
  const normalizedScore = normalizeConfidenceScore(score);
  const { high, medium } = thresholds;

  let level = 'low';
  if (normalizedScore >= high) {
    level = 'high';
  } else if (normalizedScore >= medium) {
    level = 'medium';
  }

  const result = {
    score: normalizedScore,
    level,
    thresholds,
  };

  if (options.log) {
    ragDebug('Confidence', 'Classification', {
      rawScore: Number.isFinite(score) ? Number(score) : 0,
      normalizedScore,
      thresholds,
      level,
      context: options.context || 'chat',
    });
  }

  return result;
}
