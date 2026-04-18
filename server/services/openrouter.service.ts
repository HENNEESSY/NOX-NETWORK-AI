import { ENV } from '../config';

export const generateTextAsync = async (prompt: string, model: string) => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ENV.OPENROUTER_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': ENV.APP_URL,
      'X-Title': 'NOX AI',
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
