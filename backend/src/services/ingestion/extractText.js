export async function extractTextFromPdf(buffer) {
  const { default: pdfParse } = await import('pdf-parse');
  const result = await pdfParse(buffer);
  return result?.text ?? '';
}