export function buildPrompt({ context, question }) {
  return [
    'You are a helpful AI customer support assistant.',
    'Answer ONLY using the provided context.',
    'If the answer is unavailable, say: "I could not find this information in company documents."',
    '',
    'Context:',
    context,
    '',
    'Question:',
    question,
  ].join('\n');
}
