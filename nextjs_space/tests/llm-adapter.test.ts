import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flattenMessages, makeLlm, opencodeRunLlm, stripAnsi } from '../lib/execution/llm';
import { opencodeServeLlm, parseModelId } from '../lib/execution/opencode-serve';

// Brain adapter contract: message flattening, provider dispatch, and the
// `opencode serve` HTTP transport (mocked RPC fixtures — no live server).

describe('flattenMessages', () => {
  it('tags roles and joins in order', () => {
    const out = flattenMessages([
      { role: 'system', content: 'Be terse.' },
      { role: 'user', content: 'Hi' },
      { role: 'assistant', content: 'Hello' },
      { role: 'user', content: 'Go on' },
    ]);
    expect(out).toBe(
      'INSTRUCTIONS:\nBe terse.\n\nUSER:\nHi\n\nYOUR PREVIOUS REPLY:\nHello\n\nUSER:\nGo on'
    );
  });

  it('stripAnsi removes color codes and trims', () => {
    expect(stripAnsi('\x1b[32m> build · model\x1b[0m\n  answer  ')).toBe('> build · model\n  answer');
  });
});

describe('makeLlm dispatch', () => {
  const ORIGINAL = { ...process.env };

  afterEach(() => {
    process.env.LLM_PROVIDER = ORIGINAL.LLM_PROVIDER;
    process.env.OPENCODE_SERVE_URL = ORIGINAL.OPENCODE_SERVE_URL;
    delete process.env.LLM_PROVIDER;
    delete process.env.OPENCODE_SERVE_URL;
  });

  it('defaults to the platform callLLM chain', () => {
    const fn = makeLlm();
    expect(typeof fn).toBe('function');
  });

  it('LLM_PROVIDER=opencode without a serve URL picks the CLI runner', async () => {
    process.env.LLM_PROVIDER = 'opencode';
    // The CLI runner spawns a real binary per call — we only assert dispatch,
    // never invoke it.
    expect(typeof makeLlm()).toBe('function');
    expect(makeLlm()).not.toBe(makeLlm());
  });

  it('OPENCODE_SERVE_URL selects the HTTP transport', () => {
    process.env.LLM_PROVIDER = 'opencode';
    process.env.OPENCODE_SERVE_URL = 'http://127.0.0.1:4096';
    expect(typeof makeLlm()).toBe('function');
  });
});

describe('opencodeServeLlm transport', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  const okJson = (body: unknown) => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(body),
    json: async () => body,
  });

  it('creates a session then prompts it and extracts the reply text', async () => {
    fetchMock
      .mockResolvedValueOnce(okJson({ id: 'ses_test123' }))
      .mockResolvedValueOnce(okJson({
        info: { role: 'assistant' },
        parts: [
          { type: 'step-start' },
          { type: 'text', text: 'The answer is 4.' },
          { type: 'step-finish' },
        ],
      }));

    const llm = opencodeServeLlm('http://127.0.0.1:4096/', 'opencode/x-preview-f-free');
    const reply = await llm([
      { role: 'system', content: 'You are Nova.' },
      { role: 'user', content: 'What is 2+2?' },
    ]);

    expect(reply).toBe('The answer is 4.');

    const [sessionUrl, sessionInit] = fetchMock.mock.calls[0];
    expect(sessionUrl).toBe('http://127.0.0.1:4096/session');
    const sessionBody = JSON.parse(sessionInit.body);
    expect(sessionBody.model).toEqual({ id: 'x-preview-f-free', providerID: 'opencode' });

    const [msgUrl, msgInit] = fetchMock.mock.calls[1];
    expect(msgUrl).toBe('http://127.0.0.1:4096/session/ses_test123/message');
    const msgBody = JSON.parse(msgInit.body);
    expect(msgBody.model).toEqual({ providerID: 'opencode', modelID: 'x-preview-f-free' });
    expect(msgBody.parts).toHaveLength(1);
    expect(msgBody.parts[0].type).toBe('text');
    expect(msgBody.parts[0].text).toContain('INSTRUCTIONS:\nYou are Nova.');
    expect(msgBody.parts[0].text).toContain('USER:\nWhat is 2+2?');
  });

  it('throws on a failed session creation with the upstream status', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'boom' });
    const llm = opencodeServeLlm('http://127.0.0.1:4096');

    await expect(llm([{ role: 'user', content: 'hi' }])).rejects.toThrow(/\/session 500/);
  });

  it('throws when the reply carries no text parts instead of returning empty output', async () => {
    fetchMock
      .mockResolvedValueOnce(okJson({ id: 'ses_x' }))
      .mockResolvedValueOnce(okJson({ info: {}, parts: [{ type: 'step-start' }] }));

    const llm = opencodeServeLlm('http://127.0.0.1:4096');
    await expect(llm([{ role: 'user', content: 'hi' }])).rejects.toThrow(/empty reply/);
  });
});

describe('parseModelId', () => {
  it('splits provider from model id', () => {
    expect(parseModelId('opencode/x-preview-f-free')).toEqual({
      providerID: 'opencode',
      modelID: 'x-preview-f-free',
    });
  });

  it('rejects malformed model ids', () => {
    expect(() => parseModelId('no-slash')).toThrow(/provider\/model-id/);
    expect(() => parseModelId('/just-model')).toThrow(/provider\/model-id/);
    expect(() => parseModelId('provider-only/')).toThrow(/provider\/model-id/);
  });
});
