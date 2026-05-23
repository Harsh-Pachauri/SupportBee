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
  const embeddings = await Promise.all(chunks.map((chunk, i) => {
    if (i % 50 === 0) console.log(`Embedding progress: ${i}/${chunks.length}`);
    return generateEmbedding(chunk);
  }));

  return {
    text,
    chunks: chunks.map((chunk, index) => ({
      chunkText: chunk,
      chunkIndex: index,
      embedding: embeddings[index],
    })),
  };
}
