import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/db';
import { getGuideStatus, markGuideSeen, markTourDone } from '../lib/guide/status';
import { GUIDE_PAGES, condensedGuideForPrompt, guideForPath } from '../lib/guide/content';

// T5: guide/tour state persists on OnboardingProgress (the same surface the
// status API exposes), and the content catalog stays internally consistent.

const RUN = `guide-${Date.now()}`;
let userId: string;

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `${RUN}@guide-test.local`, name: 'Guide Test User', passwordHash: 'x' },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.onboardingProgress.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

describe('guide status persistence (backing the status API)', () => {
  it('starts with tourDone=false and guideSeenAt=null, creating progress lazily', async () => {
    const status = await getGuideStatus(userId);
    expect(status.tourDone).toBe(false);
    expect(status.guideSeenAt).toBeNull();

    const row = await prisma.onboardingProgress.findUniqueOrThrow({ where: { userId } });
    expect(row.step).toBe(0);
    expect(row.isCompleted).toBe(false);
  });

  it('markGuideSeen stamps guideSeenAt exactly once and is repeatable', async () => {
    const first = await markGuideSeen(userId);
    expect(first.guideSeenAt).toBeInstanceOf(Date);
    const firstTime = first.guideSeenAt!.getTime();

    // Repeat visit must not clear or error.
    const second = await markGuideSeen(userId);
    expect(second.guideSeenAt!.getTime()).toBeGreaterThanOrEqual(firstTime);
    expect(second.tourDone).toBe(false);
  });

  it('markTourDone persists tourDone=true independently of guideSeenAt', async () => {
    const status = await markTourDone(userId);
    expect(status.tourDone).toBe(true);

    const row = await prisma.onboardingProgress.findUniqueOrThrow({ where: { userId } });
    expect(row.tourDone).toBe(true);
    expect(row.guideSeenAt).not.toBeNull(); // earlier mark kept
  });
});

describe('guide content catalog', () => {
  it('covers every documented page with honest structure', () => {
    for (const page of GUIDE_PAGES) {
      expect(page.path.startsWith('/')).toBe(true);
      expect(page.whatItDoes.length).toBeGreaterThan(20);
      expect(page.actions.length).toBeGreaterThan(0);
      expect(page.tips.length).toBeGreaterThan(0);
    }
  });

  it('tour selectors are data-tour attributes present in the codebase', async () => {
    const fs = await import('fs');
    const path = await import('path');
    let corpus = '';
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(tsx?|ts)$/.test(entry.name)) corpus += fs.readFileSync(full, 'utf8');
      }
    };
    walk(path.resolve(__dirname, '../app'));
    walk(path.resolve(__dirname, '../components'));

    for (const page of GUIDE_PAGES) {
      for (const step of page.tour) {
        expect(step.selector).toMatch(/^\[data-tour="[^"]+"\]$/);
        const attr = step.selector.match(/data-tour="([^"]+)"/)![1];
        expect(corpus.includes(`data-tour="${attr}"`)).toBe(true);
      }
    }
  });

  it('resolves the right guide for exact paths, prefixes, and dynamic routes', () => {
    expect(guideForPath('/dashboard')?.title).toBe('Dashboard');
    expect(guideForPath('/tasks?tab=stream')?.title).toBe('Weekly Tasks');
    expect(guideForPath('/tasks/some-task-id')?.title).toBe('Task Detail');
    expect(guideForPath('/agents/web4')?.title).toBe('Sovereign Agents');
    expect(guideForPath('/totally-unknown')).toBeNull();
  });

  it('produces a non-empty condensed catalog for the companion prompt', () => {
    const lines = condensedGuideForPrompt().split('\n');
    expect(lines.length).toBe(GUIDE_PAGES.length);
    expect(lines[0]).toMatch(/^- .+ \(\/.+?\): .+$/);
  });
});
