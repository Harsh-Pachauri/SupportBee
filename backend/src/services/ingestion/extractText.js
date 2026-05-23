export async function extractTextFromPdf(buffer) {
  const { PDFParse } = await import('pdf-parse');

  if (typeof PDFParse !== 'function') {
    throw new Error('pdf-parse module did not expose the PDFParse class.');
  }

  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();
    return result?.text ?? '';
  } finally {
    await parser.destroy();
  }
}