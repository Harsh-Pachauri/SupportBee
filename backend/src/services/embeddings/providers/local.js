import { ragDebug } from '../../../utils/ragDebug.js';

let _pipeline = null;

function getRawEmbeddingType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';

  const constructorName = value?.constructor?.name;
  if (constructorName) {
    return constructorName;
  }

  return typeof value;
}

function isTypedArrayView(value) {
  return ArrayBuffer.isView(value) && !(value instanceof DataView);
}

function toNumericArray(value) {
  if (value == null) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flat(Infinity).map((item) => Number(item)).filter((item) => Number.isFinite(item));
  }

  if (typeof value.tolist === 'function') {
    return toNumericArray(value.tolist());
  }

  if (isTypedArrayView(value)) {
    return Array.from(value, (item) => Number(item)).filter((item) => Number.isFinite(item));
  }

  if (value instanceof DataView) {
    return Array.from(new Uint8Array(value.buffer, value.byteOffset, value.byteLength), (item) => Number(item));
  }

  if (value instanceof ArrayBuffer) {
    return Array.from(new Float32Array(value), (item) => Number(item)).filter((item) => Number.isFinite(item));
  }

  if (typeof value === 'object') {
    if ('data' in value) {
      return toNumericArray(value.data);
    }

    if (typeof value.length === 'number' && value.length >= 0) {
      try {
        return Array.from(value, (item) => Number(item)).filter((item) => Number.isFinite(item));
      } catch {
        return [];
      }
    }
  }

  const numeric = Number(value);
  return Number.isFinite(numeric) ? [numeric] : [];
}

function isTensorLike(value) {
  return Boolean(value && typeof value === 'object' && Array.isArray(value.dims) && 'data' in value);
}

function getTensorShape(value) {
  if (!isTensorLike(value)) {
    return [];
  }

  return value.dims.filter((dim) => Number.isFinite(dim) && dim > 0);
}

function poolSentenceEmbeddingFromTensor(value) {
  const dims = getTensorShape(value);
  const data = toNumericArray(value?.data);

  if (dims.length === 0) {
    return [];
  }

  if (dims.length === 1) {
    return data.slice(0, dims[0]);
  }

  const hiddenSize = dims[dims.length - 1];
  const tokenCount = dims.slice(0, -1).reduce((product, dim) => product * dim, 1);

  if (!Number.isFinite(hiddenSize) || hiddenSize <= 0 || tokenCount <= 0) {
    return [];
  }

  if (data.length < tokenCount * hiddenSize) {
    return [];
  }

  const pooled = new Array(hiddenSize).fill(0);

  for (let tokenIndex = 0; tokenIndex < tokenCount; tokenIndex++) {
    const baseOffset = tokenIndex * hiddenSize;

    for (let dimensionIndex = 0; dimensionIndex < hiddenSize; dimensionIndex++) {
      const valueAtPosition = Number(data[baseOffset + dimensionIndex]);
      if (Number.isFinite(valueAtPosition)) {
        pooled[dimensionIndex] += valueAtPosition;
      }
    }
  }

  for (let dimensionIndex = 0; dimensionIndex < pooled.length; dimensionIndex++) {
    pooled[dimensionIndex] /= tokenCount;
  }

  return pooled;
}

function poolNestedArrayEmbeddings(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  if (!Array.isArray(value[0])) {
    return value.map((item) => Number(item)).filter((item) => Number.isFinite(item));
  }

  const hiddenSize = value[0].length;
  const pooled = new Array(hiddenSize).fill(0);

  for (const tokenVector of value) {
    if (!Array.isArray(tokenVector) || tokenVector.length !== hiddenSize) {
      return [];
    }

    for (let dimensionIndex = 0; dimensionIndex < hiddenSize; dimensionIndex++) {
      const valueAtPosition = Number(tokenVector[dimensionIndex]);
      if (Number.isFinite(valueAtPosition)) {
        pooled[dimensionIndex] += valueAtPosition;
      }
    }
  }

  for (let dimensionIndex = 0; dimensionIndex < pooled.length; dimensionIndex++) {
    pooled[dimensionIndex] /= value.length;
  }

  return pooled;
}

function getTensorDebugInfo(value) {
  const dims = getTensorShape(value);
  const dataLength = isTensorLike(value) ? (value.data?.length ?? 0) : 0;

  return {
    rawShape: dims,
    batchSize: dims[0] ?? null,
    tokenCount: dims.length >= 2 ? dims.slice(0, -1).reduce((product, dim) => product * dim, 1) : null,
    hiddenSize: dims.at(-1) ?? null,
    tensorDataLength: dataLength,
  };
}

function extractSentenceEmbedding(output) {
  if (output == null) {
    return [];
  }

  if (isTensorLike(output)) {
    return poolSentenceEmbeddingFromTensor(output);
  }

  if (typeof output.tolist === 'function') {
    return extractSentenceEmbedding(output.tolist());
  }

  if (Array.isArray(output)) {
    return poolNestedArrayEmbeddings(output);
  }

  if (isTypedArrayView(output)) {
    return Array.from(output, (item) => Number(item)).filter((item) => Number.isFinite(item));
  }

  if (output instanceof ArrayBuffer) {
    return Array.from(new Float32Array(output), (item) => Number(item)).filter((item) => Number.isFinite(item));
  }

  if (typeof output === 'object' && 'data' in output) {
    return extractSentenceEmbedding(output.data);
  }

  return [];
}

function validateSentenceEmbedding(vector, expectedDimensions = 384) {
  if (!Array.isArray(vector)) {
    return { valid: false, reason: 'not-an-array' };
  }

  if (vector.length !== expectedDimensions) {
    return { valid: false, reason: `unexpected-length:${vector.length}` };
  }

  for (const value of vector) {
    if (!Number.isFinite(Number(value))) {
      return { valid: false, reason: 'contains-non-finite-values' };
    }
  }

  return { valid: true, reason: 'ok' };
}

export async function init() {
  try {
    const { pipeline } = await import('@xenova/transformers');
    // feature-extraction returns token embeddings; we'll average them
    _pipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    ragDebug('Embeddings', 'Local model loaded', {
      provider: 'local',
      model: 'Xenova/all-MiniLM-L6-v2',
      vectorDimensionHint: 384,
    });
  } catch (err) {
    console.warn('Failed to initialize local embedding model:', err && err.message ? err.message : err);
    _pipeline = null;
  }
}

export async function embed(text) {
  if (!_pipeline) {
    throw new Error('Local embedding pipeline not initialized');
  }
  const res = await _pipeline(text);
  const rawType = getRawEmbeddingType(res);
  const rawHasData = res && typeof res === 'object' && 'data' in res;
  const rawIsTypedArray = isTypedArrayView(res);

  const tensorDebugInfo = getTensorDebugInfo(res);
  const embeddings = extractSentenceEmbedding(res);
  const validation = validateSentenceEmbedding(embeddings, 384);

  ragDebug('Embeddings', 'Local model output normalized', {
    rawType,
    rawConstructor: res?.constructor?.name || null,
    rawHasData,
    rawIsTypedArray,
    ...tensorDebugInfo,
    normalized: embeddings !== res,
    dimensions: Array.isArray(embeddings) ? embeddings.length : 0,
    poolingSuccess: validation.valid,
    validation,
  });

  if (validation.valid) {
    return embeddings.map((value) => Number(value));
  }

  return null;
}
