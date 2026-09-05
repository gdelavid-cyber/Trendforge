import { describe, expect, it } from 'vitest';
import { classifyAction, parseSteps, toStructuredStepsJson } from '../lib/pipeline/steps';

describe('task steps parser', () => {
  it('returns an empty list for null/undefined/empty input', () => {
    expect(parseSteps(null)).toEqual([]);
    expect(parseSteps(undefined)).toEqual([]);
    expect(parseSteps('')).toEqual([]);
  });

  it('parses legacy JSON string arrays into advisory steps', () => {
    const raw = JSON.stringify(['Sign up for OpenClaw free tier', 'Build a demo agent']);
    const steps = parseSteps(raw);

    expect(steps).toHaveLength(2);
    expect(steps[0]).toMatchObject({
      index: 0,
      title: 'Sign up for OpenClaw free tier',
      action: 'analyze',
      external: false,
      source: 'legacy',
    });
  });

  it('never marks legacy steps as external, even send-like wording', () => {
    const raw = JSON.stringify(['Send cold emails to 20 clients', 'Deploy the bot']);
    const steps = parseSteps(raw);
    expect(steps.every((s) => s.external === false)).toBe(true);
  });

  it('parses structured steps and defaults external by action type', () => {
    const raw = JSON.stringify([
      { id: 's1', title: 'Research 20 clients', action: 'research' },
      { id: 's2', title: 'Draft pitch per client', action: 'draft' },
      { id: 's3', title: 'Send pitches', action: 'send' },
      { id: 's4', title: 'Internal summary', action: 'analyze', external: true },
    ]);
    const steps = parseSteps(raw);

    expect(steps).toHaveLength(4);
    // research/draft are internal by default
    expect(steps[0].external).toBe(false);
    expect(steps[1].external).toBe(false);
    // send gates by default
    expect(steps[2].external).toBe(true);
    // explicit override wins over the action default (even odd ones)
    expect(steps[3].external).toBe(true);
    expect(steps.every((s) => s.source === 'structured')).toBe(true);
  });

  it('rejects unknown actions to analyze and keeps valid fields', () => {
    const raw = JSON.stringify([{ id: 'x', title: 'Do a backflip', action: 'yolo' }]);
    const steps = parseSteps(raw);
    expect(steps[0].action).toBe('analyze');
    expect(steps[0].title).toBe('Do a backflip');
  });

  it('drops malformed entries instead of crashing', () => {
    const raw = JSON.stringify([null, 42, { title: 'Valid step', action: 'research' }, {}]);
    const steps = parseSteps(raw);
    expect(steps).toHaveLength(1);
    expect(steps[0].title).toBe('Valid step');
  });

  it('handles unparseable JSON strings by returning empty', () => {
    expect(parseSteps('{not json')).toEqual([]);
    expect(parseSteps('"just a string"')).toEqual([]);
    expect(parseSteps('42')).toEqual([]);
  });

  it('accepts already-parsed arrays straight from Prisma Json columns', () => {
    const arr = [{ id: 'a', title: 'Scrape leads', action: 'scrape', tools: ['scraper'], estimatedTime: '10m' }];
    const steps = parseSteps(arr);
    expect(steps).toHaveLength(1);
    expect(steps[0]).toMatchObject({ action: 'scrape', tools: ['scraper'], estimatedTime: '10m' });
  });

  describe('classifyAction (legacy text → executable action)', () => {
    it('classifies outbound wording as send regardless of drafting verbs', () => {
      expect(classifyAction('Send personalized 45-second screen recordings to owners')).toBe('send');
      expect(classifyAction('Warm up domains and sequence 3-step outreach')).toBe('send');
    });

    it('classifies research/scrape/draft/generate families', () => {
      expect(classifyAction('Scrape Google Maps for local businesses')).toBe('scrape');
      expect(classifyAction('Identify high-intent buyer personas')).toBe('research');
      expect(classifyAction('Draft a pitch per prospect')).toBe('draft');
      expect(classifyAction('Build a demo agent for a restaurant')).toBe('generate');
      expect(classifyAction('Review the numbers')).toBe('analyze');
    });
  });

  describe('toStructuredStepsJson (storage upgrade path)', () => {
    it('upgrades legacy string steps into gated structured steps', () => {
      const out = JSON.parse(toStructuredStepsJson(['Research 20 clients', 'Send cold emails']));
      expect(out).toHaveLength(2);
      expect(out[0]).toMatchObject({ action: 'research', external: false, source: 'structured' });
      expect(out[1]).toMatchObject({ action: 'send', external: true });
    });

    it('passes through already-structured steps unchanged in kind', () => {
      const src = [{ id: 's1', title: 'Deploy landing page', action: 'deploy' }];
      const out = JSON.parse(toStructuredStepsJson(src));
      expect(out[0].source).toBe('structured');
      expect(out[0].external).toBe(true);
    });
  });
});
