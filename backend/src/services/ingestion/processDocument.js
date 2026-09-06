import { extractTextFromPdf } from './extractText.js';
import { chunkText } from './chunkText.js';
import { generateEmbedding, getActiveProviderName } from './generateEmbeddings.js';

export async function processDocument({ buffer }) {
  if (!buffer) {
    return { chunks: [] };
  }

  const text = await extractTextFromPdf(buffer);
  const chunks = chunkText(text);
  console.log(`Processing document: ${chunks.length} chunks. Embedding provider: ${getActiveProviderName()}`);

  const embeddingResults = await Promise.allSettled(
    chunks.map((chunk, i) => {
      if (i % 50 === 0) console.log(`Embedding progress: ${i}/${chunks.length}`);
      return generateEmbedding(chunk);
    })
  );

  const successfulChunks = [];
  let failedCount = 0;
  for (let i = 0; i < chunks.length; i++) {
    const result = embeddingResults[i];
    if (result.status === 'fulfilled' && result.value) {
      successfulChunks.push({ chunkText: chunks[i], chunkIndex: i, embedding: result.value });
    } else {
      failedCount++;
      console.warn(`Chunk ${i} embedding failed: ${result.reason?.message ?? 'null embedding'}`);
    }
  }

  if (failedCount > 0) {
    console.warn(`${failedCount}/${chunks.length} chunks failed to embed and were skipped.`);
  }

  return { text, chunks: successfulChunks };
}
