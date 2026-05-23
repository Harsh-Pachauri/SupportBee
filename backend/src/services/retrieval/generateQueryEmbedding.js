import { generateEmbedding, getActiveProviderName } from '../ingestion/generateEmbeddings.js';

export async function generateQueryEmbedding(query) {
  console.log(`Generating query embedding using provider: ${getActiveProviderName()}`);
  return generateEmbedding(query);
}