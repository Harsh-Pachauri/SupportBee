const DEFAULT_MODEL = 'gemini-2.0-flash';

function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
  };
}

export function getProviderName() {
  return 'gemini';
}

export async function generate(prompt) {
  const { apiKey, model } = getGeminiConfig();

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const startedAt = Date.now();
  const module = await import('@google/genai');
  const GoogleGenAI = module.GoogleGenAI ?? module.default?.GoogleGenAI ?? null;

  if (!GoogleGenAI) {
    throw new Error('Unable to load GoogleGenAI client');
  }

  const client = new GoogleGenAI({ apiKey });
  const response = await client.models.generateContent({
    model,
    contents: prompt,
  });

  const text = response?.text || response?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') || '';
  if (!text) {
    throw new Error('Gemini response did not contain text');
  }

  console.log(`Gemini response generated in ${Date.now() - startedAt}ms using model ${model}`);
  return text;
}
