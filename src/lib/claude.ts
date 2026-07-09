export const callClaude = async (
  systemPrompt: string,
  userContent: string,
  maxTokens = 1000
): Promise<string> => {
  const key = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!key) {
    console.warn('No Anthropic API key configured');
    return '';
  }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(`Anthropic API ${res.status}: ${e?.error?.message ?? 'Unknown error'}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
};

export const callClaudeJSON = async <T>(
  systemPrompt: string,
  userContent: string,
  maxTokens = 1000
): Promise<T> => {
  const text = await callClaude(systemPrompt, userContent, maxTokens);
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  return JSON.parse(cleaned) as T;
};
