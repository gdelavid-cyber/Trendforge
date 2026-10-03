import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildStarNetSessionId,
  checkStarNetCapabilities,
  starnetServeLlm,
  validateStarNetApiKey,
} from '../lib/execution/starnet-serve';
import { makeLlm } from '../lib/execution/llm';
import { openAiCompatibleLlm } from '../lib/intelligence/user-llm';
import { encodeBase58, generateAutonomousWallet } from '../lib/money/wallet';
import { decryptSecret, encryptSecret } from '../lib/core/encryption';
import { SKILLS_LIBRARY } from '../lib/intelligence/tools/skills-library';
import { real as realSkillMap } from '../lib/intelligence/tools/executor';
import { convertStarNetExportToWeb4 } from '../lib/experience/export/agent-exporter';
import {
  attenuateCapabilities,
  canAgentUseTool,
  resolveStationCapabilities,
} from '../lib/station/capability-registry';
import { createLoopBreaker, UNKNOWN_TOOL_SUMMARY } from '../lib/station/loop-breaker';
import {
  interpretVerification,
  parseAndFilterBeliefs,
  redactSecrets,
} from '../lib/station/reflect-and-verify';
import { runStationAutonomousLoop } from '../lib/station/engine';

describe('StarNet Harness Adapter & Multi-Tenant Isolation (Weaknesses #14, #15, #16)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
    delete process.env.LLM_PROVIDER;
    delete process.env.STARNET_SERVE_URL;
    delete process.env.STARNET_API_KEY;
  });

  it('enforces StarNet 16-character minimum API key contract', () => {
    expect(() => validateStarNetApiKey('short-key')).toThrow(/at least 16 characters/);
    expect(validateStarNetApiKey('starnet-valid-secret-key-1234')).toBe('starnet-valid-secret-key-1234');
  });

  it('generates tenant-isolated X-StarNet-Session-Id headers per user and task', () => {
    const s1 = buildStarNetSessionId('user_alpha', 'task_101');
    const s2 = buildStarNetSessionId('user_beta', 'task_101');
    expect(s1).toBe('trendly-user_alpha-task_101');
    expect(s2).toBe('trendly-user_beta-task_101');
    expect(s1).not.toBe(s2);
  });

  it('calls StarNet /v1/chat/completions with Bearer auth, X-StarNet-Session-Id, and JSON mode', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 'chatcmpl-starnet-1',
          choices: [{ message: { role: 'assistant', content: '{"ok":true}' }, finish_reason: 'stop' }],
          starnet: { status: 'complete', run_id: 'run_99' },
        }),
    });

    const llm = starnetServeLlm({
      baseUrl: 'http://127.0.0.1:8787',
      apiKey: 'starnet-valid-secret-key-1234',
      model: 'starnet-agent',
      userId: 'user_42',
      taskId: 'task_7',
    });

    const out = await llm([{ role: 'user', content: 'Return JSON' }], true);
    expect(out).toBe('{"ok":true}');

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:8787/v1/chat/completions');
    expect(init.headers.Authorization).toBe('Bearer starnet-valid-secret-key-1234');
    expect(init.headers['X-StarNet-Session-Id']).toBe('trendly-user_42-task_7');
    const body = JSON.parse(init.body);
    expect(body.model).toBe('starnet-agent');
    expect(body.response_format).toEqual({ type: 'json_object' });
  });

  it('surfaces BLOCKED by StarNet station when starnet.status is blocked (capdenied)', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify({
          id: 'chatcmpl-starnet-blocked',
          choices: [
            {
              message: {
                role: 'assistant',
                content: 'I could not run bash because Web Relay / Code Workbench is not placed.',
              },
              finish_reason: 'length',
            },
          ],
          starnet: {
            status: 'blocked',
            reason: 'Missing capability: code_exec (Place Code Workbench on station floor)',
          },
        }),
    });

    const llm = starnetServeLlm({
      baseUrl: 'http://127.0.0.1:8787',
      apiKey: 'starnet-valid-secret-key-1234',
    });

    await expect(llm([{ role: 'user', content: 'Run tests' }])).rejects.toThrow(
      /BLOCKED by StarNet station: Missing capability: code_exec/
    );
  });

  it('checkStarNetCapabilities queries /health, /v1/capabilities, and /v1/models and reports missing furniture props', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ status: 'ok', platform: 'starnet-agent', version: '0.12.5' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ capabilities: ['web_fetch', 'memory_store'] }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [{ id: 'starnet-agent' }, { id: 'nova-builder' }] }),
      });

    const report = await checkStarNetCapabilities({
      baseUrl: 'http://127.0.0.1:8787',
      apiKey: 'starnet-valid-secret-key-1234',
      requiredCapabilities: ['web_fetch', 'code_exec'],
    });

    expect(report.ok).toBe(false);
    expect(report.version).toBe('0.12.5');
    expect(report.capabilities).toEqual(['web_fetch', 'memory_store']);
    expect(report.missing).toEqual(['code_exec']);
    expect(report.models).toEqual(['starnet-agent', 'nova-builder']);
  });

  it('makeLlm dispatches to StarNet when LLM_PROVIDER=starnet', () => {
    process.env.LLM_PROVIDER = 'starnet';
    process.env.STARNET_SERVE_URL = 'http://127.0.0.1:8787';
    process.env.STARNET_API_KEY = 'starnet-valid-secret-key-1234';
    const fn = makeLlm();
    expect(typeof fn).toBe('function');
  });

  it('openAiCompatibleLlm supports provider="starnet" with tenant-scoped X-StarNet-Session-Id', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          choices: [{ message: { content: 'STARNET_BYOK_OK' } }],
          starnet: { status: 'complete' },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const llm = openAiCompatibleLlm({
      userId: 'user_byok_99',
      provider: 'starnet',
      model: 'starnet-agent',
      baseUrl: 'http://127.0.0.1:8787',
      apiKey: 'starnet-valid-secret-key-1234',
    });

    const reply = await llm([{ role: 'user', content: 'ping' }]);
    expect(reply).toBe('STARNET_BYOK_OK');
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://127.0.0.1:8787/v1/chat/completions');
    expect(init.headers['X-StarNet-Session-Id']).toBe('trendly-user-user_byok_99');
  });
});

describe('All 17 SKILLS_LIBRARY Skills Wired in Executor (Weakness #5)', () => {
  it('registers a real handler function for every skill in SKILLS_LIBRARY', () => {
    expect(SKILLS_LIBRARY.length).toBeGreaterThanOrEqual(17);
    for (const skill of SKILLS_LIBRARY) {
      expect(typeof realSkillMap[skill.id]).toBe('function');
    }
  });
});

describe('Real Cryptographic Wallet & Encryption Guard (Weaknesses #11, #12)', () => {
  it('generates valid Base58 Ed25519 Solana addresses with encrypted private keys', () => {
    const wallet = generateAutonomousWallet('agent-test-1', 'SOLANA');
    // Real 32-byte Ed25519 public key in Base58 is 32-44 chars, no 0/O/I/l, not 'Sol' + hex
    expect(wallet.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    expect(wallet.publicKey).toMatch(/^[0-9a-f]{64}$/);
    expect(wallet.encryptedPrivateKey).toBeTruthy();
    const decryptedPkcs8Hex = decryptSecret(wallet.encryptedPrivateKey!);
    expect(decryptedPkcs8Hex.length).toBeGreaterThanOrEqual(64);
  });

  it('generates valid 0x EVM addresses with secp256k1 keys for BASE', () => {
    const wallet = generateAutonomousWallet('agent-test-2', 'BASE');
    expect(wallet.address).toMatch(/^0x[0-9a-f]{40}$/);
    expect(wallet.encryptedPrivateKey).toBeTruthy();
  });

  it('encrypts and decrypts secrets symmetrically', () => {
    const ct = encryptSecret('super-secret-value');
    expect(decryptSecret(ct)).toBe('super-secret-value');
  });
});

describe('StarNet Dossier <-> Trendly WEB4-AGENT-1.0 Exporter (Interoperability)', () => {
  it('converts a StarNet exported agent dossier into WEB4-AGENT-1.0 format', () => {
    const pkg = convertStarNetExportToWeb4({
      agentId: 'lyra-scout',
      name: 'Lyra',
      class: 'Signal Scout',
      persona: 'High-conviction market signal researcher on StarNet Station.',
      model: 'starnet-agent',
      skills: [{ id: 'web_research' }],
    });
    expect(pkg.formatVersion).toBe('WEB4-AGENT-1.0');
    expect(pkg.metadata.name).toBe('Lyra');
    expect(pkg.avatarConfiguration.source).toBe('starnet-station');
  });
});

describe('Native TrendForge Station Engine (Upgraded In-App Autonomous Harness)', () => {
  it('auto-provisions all station modules and enforces monotonic capability attenuation on sub-agents', () => {
    const parent = resolveStationCapabilities({
      userId: 'u_station_1',
      agentId: 'overseer',
      maxBudgetUsdc: 2.0,
    });
    expect(parent.hasCompute).toBe(true);
    expect(canAgentUseTool(parent, 'scrape_reddit_painpoints').ok).toBe(true);
    expect(canAgentUseTool(parent, 'nextjs_microsaas_builder').ok).toBe(true);

    // Delegate a sub-agent restricted strictly to Reddit scraping
    const worker = attenuateCapabilities(
      parent,
      'reddit_scout',
      ['scrape_reddit_painpoints', 'non_existent_escalation'],
      0.5
    );
    expect(canAgentUseTool(worker, 'scrape_reddit_painpoints').ok).toBe(true);
    expect(canAgentUseTool(worker, 'nextjs_microsaas_builder').ok).toBe(false);
    expect(worker.maxBudgetUsdc).toBe(0.5);
  });

  it('stops hallucinated unknown tools and no-progress identical polling via deterministic LoopBreaker', () => {
    const breaker = createLoopBreaker({ unattended: true });

    // 3 consecutive unknown tool strikes -> hard stop
    for (let i = 1; i <= 2; i++) {
      const v = breaker.observe(
        [{ id: 'c1', name: 'hallucinated_tool' }],
        [{ callId: 'c1', isError: true, summary: UNKNOWN_TOOL_SUMMARY }]
      );
      expect(v.stop).toBeNull();
    }
    const third = breaker.observe(
      [{ id: 'c1', name: 'hallucinated_tool' }],
      [{ callId: 'c1', isError: true, summary: UNKNOWN_TOOL_SUMMARY }]
    );
    expect(third.stop?.failureCode).toBe('unknown_tools');
  });

  it('filters transient chatter, redacts secrets, and deduplicates beliefs in Cortex reflection', () => {
    const raw = [
      'FACT: We discussed building a SaaS app in this session.',
      'FACT: To use OpenRouter, you should set sk-or-v1-1234567890abcdef12345678 in your env.',
      'PREFERENCE: Operator prefers B2B SaaS verticals with $99+/mo ARPU and fast Stripe checkout.',
      'FACT: Operator targets B2B SaaS verticals with $99+/mo ARPU and fast Stripe checkout.',
      'FACT: Primary target market is independent Shopify Plus merchants.',
    ].join('\n');

    expect(redactSecrets('key is sk-or-v1-1234567890abcdef12345678')).toContain('[REDACTED_SECRET]');

    const beliefs = parseAndFilterBeliefs(raw, 'u_test_reflect', []);
    // Line 1 is dropped (transient), Line 2 is dropped (advice + redacted secret),
    // Line 4 is dropped (Jaccard near-duplicate of Line 3), leaving 2 clean durable beliefs!
    expect(beliefs).toHaveLength(2);
    expect(beliefs[0].kind).toBe('profile');
    expect(beliefs[1].kind).toBe('fact');
  });

  it('executes a multi-turn autonomous tool loop, verifies evidence, and reflects durable beliefs', async () => {
    let callCount = 0;
    const mockBaseLlm = vi.fn(async () => {
      callCount++;
      if (callCount === 1) {
        return `<station_tool_call>{"tool": "station.inspect", "args": {}}</station_tool_call>\n<station_tool_call>{"tool": "verify.run", "args": {"exitCode": 0, "output": "4 passed, 0 failed"}}</station_tool_call>`;
      }
      if (callCount === 2) {
        return 'Station inspection and verification complete. All 8 station modules are online and 4 deterministic checks passed with zero errors across the autonomous harness.';
      }
      return 'FACT: Autonomous station harness verified 8 active modules.';
    });

    const result = await runStationAutonomousLoop(
      [{ role: 'user', content: 'Inspect the station and verify readiness.' }],
      false,
      {
        userId: 'u_loop_test',
        agentId: 'overseer',
        baseLlm: mockBaseLlm,
        enableReflection: true,
      }
    );

    expect(result.status).toBe('complete');
    expect(result.turnsUsed).toBe(2);
    expect(result.toolTraces).toHaveLength(2);
    expect(result.toolTraces[0].tool).toBe('station.inspect');
    expect(result.toolTraces[0].ok).toBe(true);
    expect(result.toolTraces[1].tool).toBe('verify.run');
    expect(result.toolTraces[1].ok).toBe(true);
    expect(result.newBeliefs).toHaveLength(1);
    expect(interpretVerification({ exitCode: 0, out: '4 passed' }).passed).toBe(true);
  });
});

