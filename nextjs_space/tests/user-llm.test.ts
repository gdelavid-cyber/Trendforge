import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { prisma } from '../lib/db';
import { encryptSecret } from '../lib/encryption';
import { getUserLlmConfig, openAiCompatibleLlm } from '../lib/llm/user-llm';

// User BYOK brains: endpoint normalization, wire format, and encrypted
// storage round-trip against ephemeral rows in the dev database.

const RUN = `userllm-${Date.now()}`;
let userId: string;

const fetchMock = vi.hoisted(() =>
  vi.fn(async (_url: string | URL | Request, _init?: RequestInit) =>
    new Response(JSON.stringify({ choices: [{ message: { content: 'BRAIN_SAYS_HI' } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
);

beforeAll(async () => {
  const user = await prisma.user.create({
    data: {
      email: `${RUN}@userllm-test.local`,
      name: 'BYOK Test User',
      passwordHash: 'test-fixture-not-a-login',
    },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.userLlmKey.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('openAiCompatibleLlm wire format', () => {
  it('routes OpenRouter configs to the OpenRouter endpoint with attribution headers', async () => {
    vi.stubGlobal('fetch', fetchMock);
    try {
      const llm = openAiCompatibleLlm({
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4',
        baseUrl: null,
        apiKey: 'sk-or-v1-test',
      });
      const out = await llm([
        { role: 'system', content: 'be brief' },
        { role: 'user', content: 'hello' },
      ]);

      expect(out).toBe('BRAIN_SAYS_HI');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.model).toBe('anthropic/claude-sonnet-4');
      expect(body.messages).toHaveLength(2);
      expect(body.response_format).toBeUndefined();
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers.Authorization).toBe('Bearer sk-or-v1-test');
      expect(headers['X-Title']).toBe('Trendly');
    } finally {
      vi.unstubAllGlobals();
      fetchMock.mockClear();
    }
  });

  it('normalizes custom base URLs and forwards json mode as response_format', async () => {
    vi.stubGlobal('fetch', fetchMock);
    try {
      const llm = openAiCompatibleLlm({
        provider: 'custom',
        model: 'qwen3-coder',
        baseUrl: 'https://gw.example.test/v1/',
        apiKey: 'k',
      });
      await llm([{ role: 'user', content: 'give json' }], true);

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('https://gw.example.test/v1/chat/completions');
      const body = JSON.parse((init as RequestInit).body as string);
      expect(body.response_format).toEqual({ type: 'json_object' });
      const headers = (init as RequestInit).headers as Record<string, string>;
      expect(headers['HTTP-Referer']).toBeUndefined();
    } finally {
      vi.unstubAllGlobals();
      fetchMock.mockClear();
    }
  });

  it('accepts base URLs that already end in /chat/completions verbatim', async () => {
    vi.stubGlobal('fetch', fetchMock);
    try {
      const llm = openAiCompatibleLlm({
        provider: 'custom',
        model: 'm',
        baseUrl: 'https://gw.example.test/v1/chat/completions',
        apiKey: 'k',
      });
      await llm([{ role: 'user', content: 'x' }]);
      expect(fetchMock.mock.calls[0][0]).toBe('https://gw.example.test/v1/chat/completions');
    } finally {
      vi.unstubAllGlobals();
      fetchMock.mockClear();
    }
  });

  it('rejects custom configs without a base URL instead of hitting a bogus endpoint', async () => {
    const llm = openAiCompatibleLlm({ provider: 'custom', model: 'm', baseUrl: null, apiKey: 'k' });
    await expect(llm([{ role: 'user', content: 'x' }])).rejects.toThrow(/base URL/i);
  });

  it('surfaces upstream failures with status and truncated body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('{"error":"quota"}', { status: 402 }))
    );
    try {
      const llm = openAiCompatibleLlm({
        provider: 'openrouter',
        model: 'm',
        baseUrl: null,
        apiKey: 'k',
      });
      await expect(llm([{ role: 'user', content: 'x' }])).rejects.toThrow(/\(402\)/);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});

describe('getUserLlmConfig storage round-trip', () => {
  it('decrypts the stored key and returns full config', async () => {
    await prisma.userLlmKey.create({
      data: {
        userId,
        provider: 'openrouter',
        model: 'anthropic/claude-sonnet-4',
        encryptedKey: encryptSecret('sk-live-secret-123'),
      },
    });

    const cfg = await getUserLlmConfig(userId);
    expect(cfg).not.toBeNull();
    expect(cfg!.provider).toBe('openrouter');
    expect(cfg!.model).toBe('anthropic/claude-sonnet-4');
    expect(cfg!.apiKey).toBe('sk-live-secret-123');
  });

  it('returns null for users without a connected brain', async () => {
    const cfg = await getUserLlmConfig(`no-such-user-${RUN}`);
    expect(cfg).toBeNull();
  });
});
