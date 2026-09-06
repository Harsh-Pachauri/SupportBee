const DEFAULT_MODEL = 'llama-3.1-8b-instant';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

function getGroqConfig() {
  return {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || DEFAULT_MODEL,
  };
}

function formatError(message, status, payload) {
  const error = new Error(message);
  error.status = status;
  error.payload = payload;
  return error;
}

export function getProviderName() {
  return 'groq';
}

export async function generate(prompt) {
  const { apiKey, model } = getGroqConfig();

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const systemContent = prompt?.system ?? '';
  const userContent = prompt?.user ?? prompt?.full ?? String(prompt);

  const startedAt = Date.now();
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      temperature: 0.2,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = payload?.error?.message || payload?.message || response.statusText || 'Unknown Groq error';
    throw formatError(`Groq request failed: ${detail}`, response.status, payload);
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq response did not contain message content');
  }

  console.log(`Groq response generated in ${Date.now() - startedAt}ms using model ${model}`);
  return content;
}
