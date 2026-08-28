import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('Testing OpenRouter Live API Connection...');
  const key = process.env.OPENROUTER_API_KEY;
  console.log(`Key Prefix: ${key?.slice(0, 18)}...`);

  if (!key) throw new Error('OPENROUTER_API_KEY not found');

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': 'https://trendly.ai',
      'X-Title': 'Trendly Revenue Swarm',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3-haiku',
      messages: [{ role: 'user', content: 'Say "Trendly Swarm Brain Live" in 4 words' }],
      max_tokens: 20,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('❌ OpenRouter Error:', JSON.stringify(data, null, 2));
  } else {
    console.log('✅ OpenRouter Connected Successfully!');
    console.log('Model Response:', data.choices?.[0]?.message?.content);
    console.log('Usage Tokens:', data.usage);
  }
}

main();
