export function chunkText(text, chunkSize = 1000, chunkOverlap = 200) {
  const chunks = [];
  const step = Math.max(1, chunkSize - chunkOverlap);

  for (let start = 0; start < text.length; start += step) {
    chunks.push(text.slice(start, start + chunkSize));
  }

  return chunks.filter(Boolean);
}
