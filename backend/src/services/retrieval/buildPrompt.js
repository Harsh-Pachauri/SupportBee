export function buildPrompt({ history = '', context, question }) {
  return [
    'You are a helpful AI customer support assistant for a company support page.',
    'Use the recent conversation history to resolve follow-up questions, pronouns, and references.',
    'Use the retrieved company context for factual grounding.',
    'If the answer is unavailable, say: "I could not find this information in company documents."',
    '',
    'Recent conversation history:',
    history || 'None.',
    '',
    'Retrieved company context:',
    context,
    '',
    'Current user message:',
    question,
  ].join('\n');
}
