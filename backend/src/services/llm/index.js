import { generate as generateGroq, getProviderName as getGroqProviderName } from './providers/groq.js';
import { generate as generateGemini, getProviderName as getGeminiProviderName } from './providers/gemini.js';

const FALLBACK_RESPONSE = 'I could not find this information in company documents.';
const warnedProviders = new Set();

function getConfiguredProviderName() {
  return String(process.env.LLM_PROVIDER || 'groq').trim().toLowerCase();
}

function getProviderModule(providerName) {
  if (providerName === 'gemini') {
    return { name: getGeminiProviderName(), generate: generateGemini };
  }

  return { name: getGroqProviderName(), generate: generateGroq };
}

function logOnce(providerName, message) {
  if (warnedProviders.has(providerName)) {
    return;
  }

  warnedProviders.add(providerName);
  console.warn(message);
}

export function getActiveLlmProvider() {
  return getConfiguredProviderName();
}

// prompt must be a {system, user, full} object from buildPrompt.
export async function generateResponse(prompt) {
  const configuredProvider = getConfiguredProviderName();
  const provider = getProviderModule(configuredProvider);
  const startedAt = Date.now();

  console.log(`LLM provider selected: ${provider.name}`);

  try {
    const response = await provider.generate(prompt);
    console.log(`LLM response completed in ${Date.now() - startedAt}ms using ${provider.name}`);
    return response;
  } catch (err) {
    const status = err?.status ? ` status=${err.status}` : '';
    logOnce(provider.name, `LLM provider ${provider.name} failed${status}: ${err?.message || err}`);
    console.warn('Using fallback response instead of failing the chat request.');
    return FALLBACK_RESPONSE;
  }
}
