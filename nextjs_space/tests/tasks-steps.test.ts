import { describe, expect, it } from 'vitest';
import { parseSteps } from '../lib/tasks/steps';

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
});
