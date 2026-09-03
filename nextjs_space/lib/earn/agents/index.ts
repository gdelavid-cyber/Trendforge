export * from './types';
export * from './trend-scout';
export * from './deliverable-architect';
export * from './buyer-hunter';
export * from './outreach-composer';
export * from './video-production';
export * from './platform-scout';
export * from './sales-closer';
export * from './quality-controller';
export * from './analytics-optimizer';

import { AgentMetadata } from './types';

export function getActiveSwarmAgents(): AgentMetadata[] {
  return [
    {
      id: 'agent-1',
      name: 'Trend Scout',
      role: 'Monitors 50+ sources & scores opportunities (0-100)',
      avatarIcon: 'Radar',
      color: '#00F0FF',
      status: 'complete',
      currentTask: 'Indexed 347 HVAC Upwork jobs & surging TikTok audio hooks',
      lastUpdated: '1 min ago',
    },
    {
      id: 'agent-2',
      name: 'Deliverable Architect',
      role: 'Designs & compiles turnkey client deliverables',
      avatarIcon: 'Layers',
      color: '#38bdf8',
      status: 'complete',
      currentTask: 'Vapi JSON call flows & Remotion TSX video projects compiled',
      lastUpdated: 'Just now',
    },
    {
      id: 'agent-3',
      name: 'Buyer Hunter',
      role: 'Discovers verified decision-makers & scores purchase intent',
      avatarIcon: 'Users',
      color: '#00FF66',
      status: 'working',
      currentTask: 'Qualifying 5 local contractor leads in Dallas & Phoenix (70+ score)',
      estimatedTimeRemaining: '30s',
      lastUpdated: 'Live',
    },
    {
      id: 'agent-4',
      name: 'Outreach Composer',
      role: 'Crafts high-converting cold pitches across 3 frameworks',
      avatarIcon: 'Mail',
      color: '#f59e0b',
      status: 'waiting_approval',
      currentTask: 'Staged 3 personalized Free Sample pitches awaiting user authorization',
      lastUpdated: 'Live',
    },
    {
      id: 'agent-5',
      name: 'Video Production Engine',
      role: 'Renders 9:16 vertical videos & scores viral clip moments',
      avatarIcon: 'Video',
      color: '#FF007A',
      status: 'working',
      currentTask: 'ElevenLabs voiceover synthesis & Remotion kinetic captions rendering',
      estimatedTimeRemaining: '45s',
      lastUpdated: 'Live',
    },
    {
      id: 'agent-6',
      name: 'Platform Arbitrage Scout',
      role: 'Scouts Whop, Gumroad, Stan, Etsy for digital distribution',
      avatarIcon: 'Store',
      color: '#8b5cf6',
      status: 'complete',
      currentTask: 'Evaluated 20 platforms. Top recommendation: Whop (95% payout)',
      lastUpdated: '2 mins ago',
    },
    {
      id: 'agent-7',
      name: 'Sales Closer',
      role: 'Handles objections & generates Stripe recurring invoices',
      avatarIcon: 'DollarSign',
      color: '#00FF66',
      status: 'idle',
      currentTask: 'Ready to draft counter-proposals and payment links',
      lastUpdated: 'Standing by',
    },
    {
      id: 'agent-8',
      name: 'Quality Controller',
      role: 'Enforces 1080p resolution, zero typos, and anti-spam gates',
      avatarIcon: 'ShieldCheck',
      color: '#38bdf8',
      status: 'complete',
      currentTask: 'Verified 6 checks. Deliverables scored 9.6/10 (AUTO_APPROVED)',
      lastUpdated: 'Just now',
    },
    {
      id: 'agent-9',
      name: 'Analytics & Optimizer',
      role: 'Calculates unit economics & weekly intelligence telemetry',
      avatarIcon: 'TrendingUp',
      color: '#FFD700',
      status: 'complete',
      currentTask: 'Effective hourly rate calculated: $950/hr on Quick Wins',
      lastUpdated: 'Live',
    },
  ];
}