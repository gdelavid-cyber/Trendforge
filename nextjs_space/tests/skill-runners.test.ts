import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParsedStep } from '../lib/tasks/steps';

// Skill-runner registry v2. The integration vault is mocked so these tests
// exercise gating/resolution logic without real keys; global fetch is stubbed
// so research/social/trade runners are exercised against fixtures. The core
// invariant under test: a missing key yields a BLOCKED outcome with zero LLM
// calls and zero network calls — never a faked success.

const getIntegrationMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/integrations/vault', () => ({
  getIntegration: getIntegrationMock,
}));

const bucketConfigMock = vi.hoisted(() => vi.fn());
vi.mock('@/lib/aws-config', () => ({
  getBucketConfig: bucketConfigMock,
  createS3Client: () => {
    throw new Error('S3 client must not be constructed when no bucket is configured');
  },
}));

const dbMock = vi.hoisted(() => ({
  prisma: {
    user: { findUniqueOrThrow: vi.fn() },
    userIntegrationKey: { findUniqueOrThrow: vi.fn() },
  },
}));
vi.mock('@/lib/db', () => dbMock);

import { createSkillRunner } from '../lib/execution/runners';

function makeStep(action: ParsedStep['action'], title = 'Test step'): ParsedStep {
  const externalByDefault = ['send', 'deploy', 'trade', 'post'];
  return {
    id: 's1',
    index: 0,
    title,
    description: 'fixture description',
    action,
    external: externalByDefault.includes(action),
    tools: [],
    estimatedTime: '',
    outputType: 'text',
    source: 'structured',
  };
}

function makeCtx(llm: ReturnType<typeof vi.fn>) {
  return {
    taskTitle: 'Fixture task',
    companionName: 'Nova',
    previousResults: [] as string[],
    userId: 'user-fixtures',
    userTaskId: 'ut-fixtures',
    stepIndex: 0,
    llm: llm as unknown as (m: { role: string; content: string }[], jsonMode?: boolean) => Promise<string>,
  };
}

const jsonResponse = (body: unknown, status = 200) =>
  ({
    ok: status < 400,
    status,
    headers: { get: () => 'application/json' },
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

const htmlResponse = (html: string) =>
  ({
    ok: true,
    status: 200,
    headers: { get: () => 'text/html' },
    text: async () => html,
  }) as unknown as Response;

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('skill runner gating (honesty invariant)', () => {
  it('blocks send with zero LLM calls and zero network calls when no email key exists', async () => {
    getIntegrationMock.mockResolvedValue(null);
    let llmCalls = 0;
    const llm = vi.fn(async () => ((llmCalls++, 'SHOULD_NOT_BE_CALLED')));
    const outcome = await createSkillRunner(llm).run(makeStep('send'), makeCtx(llm));

    expect(outcome.blocked).toBe(true);
    expect(outcome.output).toContain('BLOCKED');
    expect(outcome.artifact).toBeUndefined();
    expect(llmCalls).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(getIntegrationMock).toHaveBeenCalledWith('user-fixtures', 'sendgrid');
    expect(getIntegrationMock).toHaveBeenCalledWith('user-fixtures', 'resend');
  });

  it('blocks post when no X token exists', async () => {
    getIntegrationMock.mockResolvedValue(null);
    let llmCalls = 0;
    const llm = vi.fn(async () => ((llmCalls++, 'TWEET_DRAFT')));
    const outcome = await createSkillRunner(llm).run(makeStep('post', 'Announce launch'), makeCtx(llm));

    expect(outcome.blocked).toBe(true);
    expect(outcome.output).toContain('X/Twitter');
    expect(llmCalls).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks deploy until deployment automation ships', async () => {
    const llm = vi.fn(async () => 'DEPLOYED');
    const outcome = await createSkillRunner(llm).run(makeStep('deploy'), makeCtx(llm));
    expect(outcome.blocked).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('internal actions', () => {
  it('routes draft/generate/analyze through the LLM only', async () => {
    const llm = vi.fn(async () => 'STUB_OUTPUT');
    for (const action of ['draft', 'generate', 'analyze'] as const) {
      const outcome = await createSkillRunner(llm).run(makeStep(action), makeCtx(llm));
      expect(outcome.blocked).toBeFalsy();
      expect(outcome.output).toBe('STUB_OUTPUT');
    }
    expect(fetchMock).not.toHaveBeenCalled();
    expect(llm).toHaveBeenCalledTimes(3);
  });
});

describe('research runner resolution order', () => {
  it('prefers the connected serper key over DuckDuckGo and grounds output in fetched pages', async () => {
    getIntegrationMock.mockImplementation(async (_u: string, provider: string) =>
      provider === 'websearch' ? { apiKey: 'sk-serper', vendor: 'serper' } : null
    );
    fetchMock.mockImplementation(async (input: any) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.startsWith('https://google.serper.dev')) {
        return jsonResponse({ organic: [{ title: 'Serper hit', link: 'https://example.com/a', snippet: 'snippet' }] });
      }
      if (url === 'https://example.com/a') {
        return htmlResponse('<html><body><p>Grounded page content about the topic.</p></body></html>');
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const llm = vi.fn(async (_messages: { role: string; content: string }[]) => 'SYNTHESIS');
    const outcome = await createSkillRunner(llm as unknown as (m: { role: string; content: string }[]) => Promise<string>)
      .run(makeStep('research'), makeCtx(llm));

    expect(outcome.blocked).toBeFalsy();
    expect(outcome.artifact?.kind).toBe('RESEARCH');
    expect((outcome.artifact?.meta as any)?.sources).toEqual(['https://example.com/a']);
    expect(outcome.output).toContain('SYNTHESIS');
    expect(outcome.output).toContain('Sources (serper)');
    expect(outcome.output).not.toContain('[UNVERIFIED');
    expect(fetchMock.mock.calls.some(([r]: any[]) => String(r).startsWith('https://google.serper.dev'))).toBe(true);
    expect(fetchMock.mock.calls.some(([r]: any[]) => String(r).includes('duckduckgo'))).toBe(false);
    // Synthesis prompt must carry the live extract, not free-form invention.
    const messages = (llm.mock.calls as unknown as { role: string; content: string }[][][])[0][0];
    expect(messages[1].content).toContain('https://example.com/a');
  });

  it('falls back to DuckDuckGo HTML search when no websearch key is connected', async () => {
    getIntegrationMock.mockResolvedValue(null);
    fetchMock.mockImplementation(async (input: any) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.includes('duckduckgo.com/html/')) {
        const target = encodeURIComponent('https://example.com/ddg');
        return htmlResponse(
          `<html><a class="result__a" href="/l/?uddg=${target}">DDG result</a></html>`
        );
      }
      if (url === 'https://example.com/ddg') {
        return htmlResponse('<html><body><p>Live fallback content.</p></body></html>');
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const llm = vi.fn(async () => 'DDG_SYNTHESIS');
    const outcome = await createSkillRunner(llm).run(makeStep('scrape', 'Find leads'), makeCtx(llm));

    expect(outcome.blocked).toBeFalsy();
    expect(outcome.output).toContain('Sources (duckduckgo)');
    expect(outcome.artifact?.kind).toBe('RESEARCH');
  });

  it('labels output UNVERIFIED instead of inventing sources when nothing is reachable', async () => {
    getIntegrationMock.mockResolvedValue(null);
    fetchMock.mockRejectedValue(new Error('network down'));

    const llm = vi.fn(async () => 'BEST_EFFORT');
    const outcome = await createSkillRunner(llm).run(makeStep('research'), makeCtx(llm));

    expect(outcome.blocked).toBeFalsy();
    expect(outcome.output).toContain('[UNVERIFIED');
    expect(outcome.artifact?.kind).toBe('RESEARCH');
    expect((outcome.artifact?.meta as any)?.sources).toEqual([]);
  });
});

describe('email runner', () => {
  it('sends through the first connected provider and records an EMAIL artifact', async () => {
    getIntegrationMock.mockImplementation(async (_u: string, provider: string) => {
      if (provider === 'sendgrid') return { apiKey: 'SG.key' };
      return null;
    });
    dbMock.prisma.userIntegrationKey.findUniqueOrThrow.mockResolvedValue({
      meta: { verifiedSender: 'me@example.com' },
    });
    dbMock.prisma.user.findUniqueOrThrow.mockResolvedValue({ email: 'account@example.com' });

    fetchMock.mockImplementation(async (input: any) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.startsWith('https://api.sendgrid.com')) {
        return { ok: true, status: 202, headers: { get: (h: string) => (h === 'x-message-id' ? 'msg-1' : null) } } as Response;
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const llm = vi.fn(async () => 'Hello from your companion.');
    const step = makeStep('send', 'Send welcome note');
    step.description = 'Email bob@client.com about onboarding';
    const outcome = await createSkillRunner(llm).run(step, makeCtx(llm));

    expect(outcome.blocked).toBeFalsy();
    expect(outcome.artifact?.kind).toBe('EMAIL');
    expect((outcome.artifact?.meta as any)?.recipient).toBe('bob@client.com');
    expect((outcome.artifact?.meta as any)?.provider).toBe('sendgrid');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.sendgrid.com/v3/mail/send');
    const payload = JSON.parse(init.body);
    expect(payload.from.email).toBe('me@example.com');
    expect(payload.personalizations[0].to[0].email).toBe('bob@client.com');
  });
});

describe('social runner', () => {
  it('posts via X API v2 with the drafted tweet and records a POST artifact', async () => {
    getIntegrationMock.mockImplementation(async (_u: string, provider: string) =>
      provider === 'x' ? { accessToken: 'token-x' } : null
    );
    fetchMock.mockResolvedValue(jsonResponse({ data: { id: 'tweet-9' } }));

    const llm = vi.fn(async () => 'We just shipped something great.');
    const outcome = await createSkillRunner(llm).run(makeStep('post', 'Announce'), makeCtx(llm));

    expect(outcome.blocked).toBeFalsy();
    expect(outcome.artifact?.kind).toBe('POST');
    expect(outcome.artifact?.url).toBe('https://x.com/i/web/status/tweet-9');
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe('https://api.twitter.com/2/tweets');
    expect(JSON.parse(init.body).text).toBe('We just shipped something great.');
  });
});

describe('file runner', () => {
  it('renders markdown inline when S3 is unconfigured and records a FILE artifact', async () => {
    bucketConfigMock.mockReturnValue({ bucketName: '', folderPrefix: '' });
    const llm = vi.fn(async () => '# Deliverable\n\nReal content.');
    const outcome = await createSkillRunner(llm).run(makeStep('export', 'Write playbook doc'), makeCtx(llm));

    expect(outcome.blocked).toBeFalsy();
    expect(outcome.artifact?.kind).toBe('FILE');
    expect(outcome.artifact?.name).toBe('write-playbook-doc.md');
    expect(outcome.artifact?.url).toBeNull();
    expect((outcome.artifact?.meta as any)?.inline).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('renders CSV when the step asks for a spreadsheet', async () => {
    bucketConfigMock.mockReturnValue({ bucketName: '', folderPrefix: '' });
    const llm = vi.fn(async () => 'col_a,col_b\n1,2');
    const step = makeStep('export', 'Export leads');
    step.description = 'Give me a csv spreadsheet of prospects';
    const outcome = await createSkillRunner(llm).run(step, makeCtx(llm));

    expect(outcome.artifact?.name).toBe('export-leads.csv');
    expect((outcome.artifact?.meta as any)?.format).toBe('csv');
  });
});

describe('trade runner', () => {
  it('stages an order ticket from live Gamma data without moving funds', async () => {
    getIntegrationMock.mockImplementation(async (_u: string, provider: string) =>
      provider === 'polymarket' ? { apiKey: 'pk' } : null
    );
    fetchMock.mockImplementation(async (input: any) => {
      const url = String(input instanceof Request ? input.url : input);
      if (url.startsWith('https://gamma-api.polymarket.com')) {
        return jsonResponse([
          {
            question: 'Will the fixture market resolve YES?',
            outcomes: JSON.stringify(['YES', 'NO']),
            outcomePrices: JSON.stringify(['0.62', '0.38']),
            slug: 'fixture-market',
          },
        ]);
      }
      throw new Error(`unexpected fetch ${url}`);
    });

    const llm = vi.fn(async () => JSON.stringify({ outcome: 'YES', sizeUsdc: 25, reasoning: 'edge' }));
    const outcome = await createSkillRunner(llm).run(makeStep('trade'), makeCtx(llm));

    expect(outcome.blocked).toBeFalsy();
    expect(outcome.artifact?.kind).toBe('TRADE');
    expect((outcome.artifact?.meta as any)?.live).toBe(false);
    expect((outcome.artifact?.meta as any)?.outcome).toBe('YES');
    expect((outcome.artifact?.meta as any)?.sizeUsdc).toBe(25);
    expect(outcome.output).toContain('STAGED TRADE TICKET');
    expect(outcome.output).toContain('no funds moved');
    // No CLOB order routing call was made — staging only.
    expect(fetchMock.mock.calls.every(([r]: any[]) => String(r).startsWith('https://gamma-api.polymarket.com'))).toBe(true);
  });
});
