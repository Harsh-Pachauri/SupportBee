import { similaritySearch } from './similaritySearch.js';

export async function retrieveRelevantChunks({ companyId, query, topK }) {
  return similaritySearch({ companyId, query, topK });
}
