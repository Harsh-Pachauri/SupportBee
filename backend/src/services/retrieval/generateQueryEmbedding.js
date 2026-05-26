import { generateEmbedding, getActiveProviderName } from '../ingestion/generateEmbeddings.js';
import { ragDebug } from '../../utils/ragDebug.js';

export async function generateQueryEmbedding(query) {
  ragDebug('Embeddings', 'Generating query embedding', {
    provider: getActiveProviderName(),
    queryLength: String(query || '').length,
  });

  return generateEmbedding(query);
}