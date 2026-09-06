import { afterAll, describe, expect, it } from 'vitest';
import { prisma } from '../lib/core/db';
import { isDuplicate, calculateSimilarity, REDDIT_SCRAPING_CHANNELS } from '../lib/pipeline';
import { validateHighProfitabilityCriteria, harvestNextCouncilSignal } from '../lib/council/signal-harvester';
import { getCouncilMemory, deriveCouncilLearning } from '../lib/council/council-memory';
import { runCouncilDebate } from '../lib/council/council-runner';

const RUN_PREFIX = `council-mem-test-${Date.now()}`;
const createdSessionIds: string[] = [];

afterAll(async () => {
  if (createdSessionIds.length > 0) {
    await prisma.councilSession.deleteMany({
      where: { id: { in: createdSessionIds } },
    });
  }
  await prisma.$disconnect();
});

describe('Scraper Anti-Repetition & Council Adaptive Intelligence', () => {
  describe('1. Scraper Diversity & Strict Anti-Repetition', () => {
    it('provides distinct rotating channels across commercial sectors', () => {
      expect(REDDIT_SCRAPING_CHANNELS.length).toBeGreaterThanOrEqual(4);
      const categories = REDDIT_SCRAPING_CHANNELS.map((c) => c.category);
      expect(categories).toContain('SMB & Contractor Demand');
      expect(categories).toContain('Agency & B2B Arbitrage');
    });

    it('accurately identifies and eliminates duplicate task titles and near-duplicates', () => {
      const existing = ['Deploy Autonomous AI Voice Receptionists for Dental Clinics'];

      // Exact match
      expect(isDuplicate('Deploy Autonomous AI Voice Receptionists for Dental Clinics', existing, 0.45)).toBe(true);

      // Minor variation (must be caught as duplicate to avoid repeating the same concept)
      expect(isDuplicate('Deploy Autonomous Voice Receptionists for Dental Clinics', existing, 0.45)).toBe(true);

      // Completely different niche and target (must pass)
      expect(isDuplicate('Automated Chargeback Evidence Recovery for Shopify Brands', existing, 0.45)).toBe(false);
    });
  });

  describe('2. Council High-Profitability Filter Gate', () => {
    it('rejects low-margin, consumer fluff, and speculative memes', () => {
      const lowMargin = validateHighProfitabilityCriteria({
        title: 'Micro-Dropshipping Print On Demand Phone Cases',
        rawInsight: 'High competition, 12% gross margins after ad spend.',
        estimatedMargin: '12%',
      });
      expect(lowMargin.valid).toBe(false);
      expect(lowMargin.rejectionReason).toContain('Margin too low');

      const cryptoScam = validateHighProfitabilityCriteria({
        title: 'Launch Viral Meme Coin Launchpad Staking',
        rawInsight: 'Speculative meme token community staking.',
        estimatedMargin: '85%',
      });
      expect(cryptoScam.valid).toBe(false);
      expect(cryptoScam.rejectionReason).toContain('Banned speculative vector');

      const consumerFluff = validateHighProfitabilityCriteria({
        title: 'Dating App Profile Bio Enhancer',
        rawInsight: 'Help singles get more swipes on Tinder.',
        estimatedMargin: '80%',
      });
      expect(consumerFluff.valid).toBe(false);
    });

    it('approves real-deal B2B commercial arbitrage plays with high margins', () => {
      const b2bPlay = validateHighProfitabilityCriteria({
        title: 'Autonomous B2B Emergency Voice Dispatch for Contractors',
        rawInsight: 'Service contractors miss 40% of night calls; $450 setup + $150/mo retainer.',
        estimatedMargin: '82.5%',
      });
      expect(b2bPlay.valid).toBe(true);
    });

    it('dynamically harvests valid commercial signals', async () => {
      const harvested = await harvestNextCouncilSignal();
      expect(harvested).toBeDefined();
      expect(harvested.title).toBeTruthy();
      expect(harvested.expectedMarginPercent).toBeGreaterThanOrEqual(70);
      expect(harvested.dealSizeRange).toBeTruthy();
    });
  });

  describe('3. Council Adaptive Memory & Learning System', () => {
    it('loads historical intelligence profile with benchmarks and risk flags', async () => {
      const memory = await getCouncilMemory();
      expect(memory).toBeDefined();
      expect(memory.averageApprovedMarginPercent).toBeGreaterThanOrEqual(70);
      expect(memory.provenWinningVectors.length).toBeGreaterThanOrEqual(1);
      expect(memory.cumulativeRiskFlags.length).toBeGreaterThanOrEqual(1);
      expect(memory.recentLearnedHeuristics.length).toBeGreaterThanOrEqual(1);
    });

    it('derives new learning heuristics based on deliberation outcomes', () => {
      const approvedLearning = deriveCouncilLearning({
        title: 'Autonomous B2B Emergency Voice Dispatch for Contractors',
        sentiment: 'bullish',
        passed: true,
        score: 88,
        margin: 82.5,
        riskFlags: ['Background audio noise interference'],
      });
      expect(approvedLearning.heuristic).toContain('Calibrated');
      expect(approvedLearning.heuristic).toContain('82.5% margin');
      expect(approvedLearning.confidenceDelta).toBeGreaterThan(0);

      const rejectedLearning = deriveCouncilLearning({
        title: 'Meme Token Staking Bot',
        sentiment: 'bearish',
        passed: false,
        score: 45,
        margin: 10,
        riskFlags: ['Regulatory scrutiny', 'Extreme volatility'],
      });
      expect(rejectedLearning.heuristic).toContain('Defensive Filter');
      expect(rejectedLearning.confidenceDelta).toBeLessThan(0);
    });

    it('executes Council debate, incorporates memory, and persists new learned heuristic', async () => {
      const testTitle = `${RUN_PREFIX}: Automated RFP Bid Dossier Preparation for SMBs`;
      const session = await runCouncilDebate({
        title: testTitle,
        source: 'Municipal Chamber Feeds',
        rawInsight: 'Subcontractors miss municipal bids due to 100-page compliance paperwork. AI compiles draft in 4 hours for $1,200.',
        estimatedMargin: '85%',
        estimatedVelocity: '48 hours',
      });

      createdSessionIds.push(session.id);

      expect(session.id).toBeTruthy();
      expect(session.debateTranscript).toBeDefined();
      expect(session.gatekeeperVerdict).toBeDefined();
      expect(session.gatekeeperScore).toBeGreaterThanOrEqual(80);

      // Check persisted learning
      const conclusion = session.conclusion as any;
      expect(conclusion?.councilLearning).toBeDefined();
      expect(conclusion.councilLearning.heuristic).toBeTruthy();
      expect(conclusion.councilLearning.deliberationsCompleted).toBeGreaterThan(0);
    });
  });
});
