import { afterEach, describe, expect, it } from 'vitest';
import { checkServiceKey, serviceUserId } from '../lib/growth/nova/service-auth';
import { buildNovaSystemPrompt, isTransportArtifact } from '../lib/growth/nova/brain';
import type { NovaBriefing } from '../lib/growth/nova/reads';

// Bidirectional Nova x OpenCode: service trust boundary + grounded brain prompt.

const KEY = 'test-service-key-123';
const OLD = process.env.NOVA_SERVICE_KEY;

afterEach(() => {
  if (OLD === undefined) delete process.env.NOVA_SERVICE_KEY;
  else process.env.NOVA_SERVICE_KEY = OLD;
});

function req(headers: Record<string, string> = {}, url = 'http://x/api/nova/briefing?userId=u1'): Request {
  return new Request(url, { headers });
}

describe('service-auth', () => {
  it('fails closed with no key configured', () => {
    delete process.env.NOVA_SERVICE_KEY;
    expect(checkServiceKey(req({ 'x-nova-key': 'anything' }))).toBe(false);
  });

  it('rejects wrong keys, missing headers, and length mismatches', () => {
    process.env.NOVA_SERVICE_KEY = KEY;
    expect(checkServiceKey(req({ 'x-nova-key': 'wrong' }))).toBe(false);
    expect(checkServiceKey(req())).toBe(false);
    expect(checkServiceKey(req({ 'x-nova-key': KEY + 'x' }))).toBe(false);
  });

  it('accepts the exact key and binds an explicit userId', () => {
    process.env.NOVA_SERVICE_KEY = KEY;
    expect(checkServiceKey(req({ 'x-nova-key': KEY }))).toBe(true);
    expect(serviceUserId(req({ 'x-nova-key': KEY }), new URL('http://x/?userId=u1'))).toBe('u1');
    expect(serviceUserId(req({ 'x-nova-key': KEY }), new URL('http://x/'))).toBeNull();
  });

  it('ignores keys smuggled in the query string (header-only)', () => {
    process.env.NOVA_SERVICE_KEY = KEY;
    expect(checkServiceKey(req({}, `http://x/?x-nova-key=${KEY}`))).toBe(false);
  });
});

describe('buildNovaSystemPrompt', () => {
  const briefing: NovaBriefing = {
    generatedAt: '2026-01-01T00:00:00Z',
    wallet: { available: true, realIncomeUsdc: 5, agents: 1, fundedAgents: 1 },
    credits: { available: true, balance: 50, allocation: 100 },
    quota: { available: false },
    swarm: { available: false },
    trends: { available: false },
    insights: [],
  };

  it('states the proposal-only law and grounds numbers', () => {
    const prompt = buildNovaSystemPrompt(briefing, ['[STEP] x: y.'], ['User: hi']);
    expect(prompt).toMatch(/cannot execute/i);
    expect(prompt).toMatch(/never claim/i);
    expect(prompt).toContain('$5.00');
    expect(prompt).toContain('worker.run');
    expect(prompt).toContain('[STEP] x: y.');
    expect(prompt).toContain('User: hi');
  });

  it('names missing sections instead of filling them', () => {
    const prompt = buildNovaSystemPrompt(briefing, [], []);
    expect(prompt).toMatch(/couldn't reach: quota, swarm, trends/);
  });
});

describe('isTransportArtifact', () => {
  it('rejects error and fabrication JSON', () => {
    expect(isTransportArtifact('{"success":true}')).toBe(true);
    expect(isTransportArtifact('{"trends":[]}')).toBe(true);
    expect(isTransportArtifact('{"title":"Monetize X","earnings_low":300}')).toBe(true);
  });

  it('keeps prose, including prose that opens with a brace', () => {
    expect(isTransportArtifact('Ledger income: $0.00 across 0 agents.')).toBe(false);
    expect(isTransportArtifact('{brackets} are just punctuation here')).toBe(false);
    expect(isTransportArtifact('')).toBe(false);
  });
});
