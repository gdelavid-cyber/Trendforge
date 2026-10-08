import { describe, it, expect, vi } from 'vitest';
import {
  registerHmhuPacket,
  resolveHmhuPacket,
  getPendingPacket,
  getAllPackets,
  HmhuPacket,
} from '@/lib/station/hmhu/protocol';
import { executeToolCall } from '@/lib/station/tools/registry';

describe('Help Me Help U (HMHU) Symbiotic Protocol', () => {
  it('registers a symbiotic packet and holds pending status', async () => {
    const packet: HmhuPacket = {
      id: 'HMHU-TEST-01',
      runId: 'run-test-123',
      createdAt: Date.now(),
      status: 'WAITING_COMMANDER',
      valueDelivered: {
        summary: 'Scraped 45 Reddit pain points regarding micro-SaaS invoicing.',
        category: 'INTEL',
        artifacts: [{ title: 'pain_points.json', path: 'artifacts/pain_points.json' }],
      },
      commanderAsk: {
        askType: 'DECISION',
        question: 'Which target audience should we build the prototype for?',
        recommendedAction: 'Freelance Consultants ($39/mo)',
        options: [
          'Freelance Consultants ($39/mo)',
          'Digital Agencies ($149/mo)',
          'Enterprise Teams ($499/mo)',
        ],
      },
      nextAutonomousStep: 'Generate Next.js scaffold and pricing page for selected tier',
    };

    const registered = await registerHmhuPacket(packet);
    expect(registered.id).toBe('HMHU-TEST-01');
    expect(registered.status).toBe('WAITING_COMMANDER');

    const pending = getPendingPacket('run-test-123');
    expect(pending).toBeDefined();
    expect(pending?.id).toBe('HMHU-TEST-01');
    expect(pending?.commanderAsk.question).toContain('target audience');
  });

  it('resolves a pending ask when commander sends directive', async () => {
    const resolved = await resolveHmhuPacket('HMHU-TEST-01', {
      selectedOption: 'Freelance Consultants ($39/mo)',
    });

    expect(resolved).toBeDefined();
    expect(resolved?.status).toBe('RESOLVED');
    expect(resolved?.commanderResponse?.selectedOption).toBe('Freelance Consultants ($39/mo)');
    expect(resolved?.commanderResponse?.respondedAt).toBeGreaterThan(0);

    // Pending should now be cleared
    const pending = getPendingPacket('run-test-123');
    expect(pending).toBeUndefined();
  });

  it('executes hmhu_deliver_value tool without pausing loop', async () => {
    const res = await executeToolCall('hmhu_deliver_value', {
      summary: 'Exported verified leads dataset with 120 qualified buyer emails.',
      category: 'LEADS',
      metrics: { leadsCount: 120, bounceRate: 0.02 },
    }, { runId: 'run-test-456' });

    expect(res.success).toBe(true);
    expect(res.deliverable.summary).toContain('Exported verified leads');
    expect(res.deliverable.metrics.leadsCount).toBe(120);
  });
});
