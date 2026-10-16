import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('Testing infer.dev / inferhub Live API Connection...');
  const key = process.env.INFER_API_KEY || process.env.INFERDEV_API_KEY || process.env.INFERHUB_API_KEY;
  const baseUrl = process.env.INFER_BASE_URL || process.env.INFERDEV_BASE_URL || process.env.INFERHUB_BASE_URL || 'https://api.inferhub.dev/v1';
  const model = process.env.INFER_MODEL || process.env.INFERDEV_MODEL || process.env.INFERHUB_MODEL || 'gemini-3.6-flash';

  if (!key) {
    console.log('ℹ️  No INFER_API_KEY / INFERHUB_API_KEY found in environment.');
    console.log('   Add INFER_API_KEY=<your_key> to .env to activate infer.dev inference.');
    return;
  }

  console.log(`Key Prefix: ${key.slice(0, 10)}...`);
  console.log(`Endpoint: ${baseUrl}/chat/completions`);
  console.log(`Model: ${model}`);

  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      signal: AbortSignal.timeout(15000),
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say "Trendly Swarm Infer.dev Online" in 5 words' }],
        max_tokens: 30,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error('❌ infer.dev Error:', JSON.stringify(data, null, 2));
    } else {
      console.log('✅ infer.dev Connected Successfully!');
      console.log('Model Response:', data.choices?.[0]?.message?.content);
      console.log('Usage Tokens:', data.usage);
    }
  } catch (err: any) {
    console.error('❌ Connection Exception:', err.message);
  }
}

main();
