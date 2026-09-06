const SYSTEM_INSTRUCTIONS = [
  'You are a helpful AI customer support assistant for a company support page.',
  'Use the recent conversation history to resolve follow-up questions, pronouns, and references.',
  'Use the retrieved company context for factual grounding.',
  'If the answer is unavailable, say: "I could not find this information in company documents."',
].join('\n');

export function buildPrompt({ history = '', context, question }) {
  const userContent = [
    'Recent conversation history:',
    history || 'None.',
    '',
    'Retrieved company context:',
    context,
    '',
    'Current user message:',
    question,
  ].join('\n');

  return {
    system: SYSTEM_INSTRUCTIONS,
    user: userContent,
    full: `${SYSTEM_INSTRUCTIONS}\n\n${userContent}`,
  };
}
