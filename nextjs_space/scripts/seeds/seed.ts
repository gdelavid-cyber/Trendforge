import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const HIDDEN_TEST_EMAIL = process.env.HIDDEN_TEST_EMAIL;
const HIDDEN_TEST_PASSWORD = process.env.HIDDEN_TEST_PASSWORD;
const DEMO_PASSWORD = process.env.DEMO_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !HIDDEN_TEST_EMAIL || !HIDDEN_TEST_PASSWORD || !DEMO_PASSWORD) {
  console.error(
    'Seed aborted: set ADMIN_EMAIL, ADMIN_PASSWORD, HIDDEN_TEST_EMAIL, HIDDEN_TEST_PASSWORD and DEMO_PASSWORD in nextjs_space/.env'
  );
  process.exit(1);
}

async function main() {
  console.log('Seeding Trendly database...');

  // Hidden test account (mandatory)
  const hiddenTestHash = await bcrypt.hash(HIDDEN_TEST_PASSWORD!, 10);
  await prisma.user.upsert({
    where: { email: HIDDEN_TEST_EMAIL! },
    update: { passwordHash: hiddenTestHash },
    create: {
      email: HIDDEN_TEST_EMAIL!,
      name: 'Test Admin',
      passwordHash: hiddenTestHash,
      role: 'ADMIN',
      favorCredits: 10,
    },
  });

  // Requested admin user
  const adminHash = await bcrypt.hash(ADMIN_PASSWORD!, 10);
  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL! },
    update: { passwordHash: adminHash },
    create: {
      email: ADMIN_EMAIL!,
      name: 'Trendly Admin',
      passwordHash: adminHash,
      role: 'ADMIN',
      favorCredits: 99,
      isMentor: true,
      isVIP: true,
      totalEarnings: 12500,
    },
  });

  // Demo users for stories/community
  const demoHash = await bcrypt.hash(DEMO_PASSWORD!, 10);
  const demoUser1 = await prisma.user.upsert({
    where: { email: 'sarah@demo.com' },
    update: { passwordHash: demoHash },
    create: {
      email: 'sarah@demo.com',
      name: 'Sarah Chen',
      passwordHash: demoHash,
      role: 'PREMIUM',
      totalEarnings: 4200,
      skills: ['copywriting', 'ai-tools', 'social-media'],
      isMentor: true,
    },
  });
  const demoUser2 = await prisma.user.upsert({
    where: { email: 'marcus@demo.com' },
    update: { passwordHash: demoHash },
    create: {
      email: 'marcus@demo.com',
      name: 'Marcus Johnson',
      passwordHash: demoHash,
      role: 'PRO',
      totalEarnings: 8900,
      skills: ['development', 'ai-agents', 'automation'],
      isVIP: true,
    },
  });
  const demoUser3 = await prisma.user.upsert({
    where: { email: 'elena@demo.com' },
    update: { passwordHash: demoHash },
    create: {
      email: 'elena@demo.com',
      name: 'Elena Rodriguez',
      passwordHash: demoHash,
      role: 'FREE',
      totalEarnings: 320,
      skills: ['design', 'video-editing'],
    },
  });

  // Trends
  const now = new Date();
  const trend1 = await prisma.trend.upsert({
    where: { id: 'trend-openclaw-ai' },
    update: {},
    create: {
      id: 'trend-openclaw-ai',
      name: 'OpenClaw AI Agent Economy',
      sourcePlatforms: ['Twitter/X', 'Reddit', 'YouTube', 'ProductHunt'],
      mentionVelocity: 847,
      sentimentScore: 0.89,
      confidence: 0.94,
      category: 'AGENT_ECONOMY',
      status: 'ACTIVE',
      detectedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      hoursSinceDetection: 3,
    },
  });
  const trend2 = await prisma.trend.upsert({
    where: { id: 'trend-ai-avatar' },
    update: {},
    create: {
      id: 'trend-ai-avatar',
      name: 'AI Avatar YouTube Channels',
      sourcePlatforms: ['YouTube', 'TikTok', 'Twitter/X'],
      mentionVelocity: 623,
      sentimentScore: 0.82,
      confidence: 0.88,
      category: 'AI_CONTENT',
      status: 'ACTIVE',
      detectedAt: new Date(now.getTime() - 6 * 60 * 60 * 1000),
      hoursSinceDetection: 6,
    },
  });
  const trend3 = await prisma.trend.upsert({
    where: { id: 'trend-micro-saas' },
    update: {},
    create: {
      id: 'trend-micro-saas',
      name: 'Micro-SaaS with Cursor IDE',
      sourcePlatforms: ['Twitter/X', 'Reddit', 'HackerNews', 'IndieHackers'],
      mentionVelocity: 512,
      sentimentScore: 0.91,
      confidence: 0.92,
      category: 'AI_TOOLS',
      status: 'ACTIVE',
      detectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      hoursSinceDetection: 2,
    },
  });

  const weekOf = new Date();
  weekOf.setHours(0, 0, 0, 0);
  weekOf.setDate(weekOf.getDate() - weekOf.getDay() + 1); // Monday

  // 10 Tasks
  const tasks = [
    {
      id: 'task-1', trendId: trend1.id, title: 'Build a Custom AI Agent for Local Businesses',
      description: 'Create and sell AI-powered customer service agents to local businesses using OpenClaw framework.',
      steps: JSON.stringify(['Sign up for OpenClaw free tier', 'Complete the "Agent Builder" tutorial (2 hours)', 'Identify 5 local businesses without chatbots', 'Build a demo agent for a restaurant/salon', 'Pitch to business owners with live demo']),
      difficulty: 'ZERO' as const, startupCost: 0, timeToFirstDollar: '3-5 days',
      estimatedEarningsLow: 200, estimatedEarningsHigh: 1500, riskLevel: 'LOW' as const,
      riskExplanation: 'Low financial risk as tools are free. Time investment risk if businesses are not interested.',
      mitigationStrategy: 'Start with businesses you already patronize. Offer a free trial period.',
      toolLinks: JSON.stringify([{name: 'OpenClaw', url: 'https://openclaw.ai'}, {name: 'Cursor IDE', url: 'https://cursor.sh'}]),
      proTip: 'Restaurants and salons are the easiest first clients — they get 50+ repetitive calls daily.',
      category: 'AGENT_ECONOMY' as const, qualityScore: 0.92, isVerified: true, isFeatured: true, weekOf,
    },
    {
      id: 'task-2', trendId: trend1.id, title: 'Launch an AI Agent Marketplace Store',
      description: 'List pre-built AI agents on emerging marketplaces and earn per-deployment fees.',
      steps: JSON.stringify(['Research top 3 agent marketplaces', 'Build 3 niche agents (real estate, fitness, legal FAQ)', 'Write compelling marketplace listings', 'Set pricing ($29-99/month per deployment)', 'Promote on Twitter/X with demo videos']),
      difficulty: 'LOW' as const, startupCost: 20, timeToFirstDollar: '5-7 days',
      estimatedEarningsLow: 500, estimatedEarningsHigh: 3000, riskLevel: 'LOW' as const,
      riskExplanation: 'Minimal financial risk. Main risk is marketplace competition.',
      mitigationStrategy: 'Focus on underserved niches. Provide excellent documentation.',
      toolLinks: JSON.stringify([{name: 'OpenClaw', url: 'https://openclaw.ai'}]),
      proTip: 'Legal FAQ and real estate agents have the highest willingness-to-pay.',
      category: 'AGENT_ECONOMY' as const, qualityScore: 0.88, isVerified: true, isFeatured: true, weekOf,
    },
    {
      id: 'task-3', trendId: trend2.id, title: 'Start a Faceless AI Avatar YouTube Channel',
      description: 'Create a YouTube channel using AI avatars for educational/niche content without showing your face.',
      steps: JSON.stringify(['Pick a profitable niche (finance tips, tech reviews, cooking)', 'Sign up for HeyGen or Synthesia free trial', 'Script 5 videos using ChatGPT', 'Generate AI avatar videos (10 min each)', 'Upload with SEO-optimized titles and thumbnails']),
      difficulty: 'ZERO' as const, startupCost: 0, timeToFirstDollar: '14-21 days',
      estimatedEarningsLow: 100, estimatedEarningsHigh: 2000, riskLevel: 'MEDIUM' as const,
      riskExplanation: 'YouTube monetization takes time. Platform policies on AI content may change.',
      mitigationStrategy: 'Diversify income with affiliate links from day 1. Disclose AI usage.',
      toolLinks: JSON.stringify([{name: 'HeyGen', url: 'https://heygen.com'}, {name: 'Synthesia', url: 'https://synthesia.io'}]),
      proTip: 'Finance and "how to make money" niches get 3x more ad revenue per view.',
      category: 'AI_CONTENT' as const, qualityScore: 0.85, isVerified: true, isFeatured: false, weekOf,
    },
    {
      id: 'task-4', trendId: trend2.id, title: 'Sell AI-Generated Explainer Videos on Fiverr',
      description: 'Offer AI avatar explainer video creation services on freelance platforms.',
      steps: JSON.stringify(['Create Fiverr/Upwork profile focused on AI video', 'Build 3 portfolio samples using free tools', 'Price competitively ($50-150 per video)', 'Optimize gig listing with keywords', 'Deliver first 3 orders with fast turnaround']),
      difficulty: 'ZERO' as const, startupCost: 0, timeToFirstDollar: '3-7 days',
      estimatedEarningsLow: 200, estimatedEarningsHigh: 2500, riskLevel: 'LOW' as const,
      riskExplanation: 'Low risk — only time investment. Fiverr takes 20% commission.',
      mitigationStrategy: 'Build your own client list to bypass platform fees over time.',
      toolLinks: JSON.stringify([{name: 'Fiverr', url: 'https://fiverr.com'}, {name: 'HeyGen', url: 'https://heygen.com'}]),
      proTip: 'Offer "rush delivery" at 2x price — many clients pay for speed.',
      category: 'AI_CONTENT' as const, qualityScore: 0.87, isFeatured: false, weekOf,
    },
    {
      id: 'task-5', trendId: trend3.id, title: 'Build and Sell a Micro-SaaS with Cursor',
      description: 'Use Cursor IDE to rapidly build a focused SaaS tool and sell subscriptions.',
      steps: JSON.stringify(['Identify a pain point in a niche community (Reddit, forums)', 'Prototype MVP in Cursor IDE (aim for 1 weekend)', 'Deploy on Vercel/Railway for free', 'Launch on Product Hunt and relevant subreddits', 'Iterate based on feedback, add Stripe billing']),
      difficulty: 'MEDIUM' as const, startupCost: 20, timeToFirstDollar: '7-14 days',
      estimatedEarningsLow: 300, estimatedEarningsHigh: 5000, riskLevel: 'MEDIUM' as const,
      riskExplanation: 'Requires technical skills. Market validation risk — your idea may not find product-market fit.',
      mitigationStrategy: 'Validate demand with a landing page before building. Keep MVP scope tiny.',
      toolLinks: JSON.stringify([{name: 'Cursor IDE', url: 'https://cursor.sh'}, {name: 'Stripe', url: 'https://stripe.com'}]),
      proTip: 'The best micro-SaaS ideas solve YOUR OWN daily frustrations.',
      category: 'AI_TOOLS' as const, qualityScore: 0.91, isVerified: true, isFeatured: true, weekOf,
    },
    {
      id: 'task-6', trendId: trend3.id, title: 'Cursor IDE Tutorial Course on Udemy',
      description: 'Record and sell a comprehensive Cursor IDE course for non-technical entrepreneurs.',
      steps: JSON.stringify(['Outline 10-module course curriculum', 'Record screen captures with voiceover', 'Edit with free tools (DaVinci Resolve)', 'Upload to Udemy with promotional pricing', 'Cross-promote on YouTube and Twitter']),
      difficulty: 'LOW' as const, startupCost: 0, timeToFirstDollar: '10-14 days',
      estimatedEarningsLow: 200, estimatedEarningsHigh: 3000, riskLevel: 'LOW' as const,
      riskExplanation: 'Time-intensive content creation. Udemy market is competitive.',
      mitigationStrategy: 'Focus on a specific audience (e.g., "Cursor for Marketers"). Get early reviews.',
      toolLinks: JSON.stringify([{name: 'Udemy', url: 'https://udemy.com'}, {name: 'DaVinci Resolve', url: 'https://blackmagicdesign.com'}]),
      proTip: 'Courses priced at $12.99 during promotions outsell $199 courses 10:1.',
      category: 'EDUCATION' as const, qualityScore: 0.83, isFeatured: false, weekOf,
    },
    {
      id: 'task-7', trendId: trend1.id, title: 'AI Agent Consulting for Enterprises',
      description: 'Position yourself as an AI agent consultant and charge hourly for implementation guidance.',
      steps: JSON.stringify(['Build expertise portfolio with 3 case studies', 'Create a professional LinkedIn presence', 'Write 5 thought-leadership posts about AI agents', 'Offer free 30-min strategy calls', 'Close consulting deals at $150-300/hr']),
      difficulty: 'HIGH' as const, startupCost: 50, timeToFirstDollar: '14-21 days',
      estimatedEarningsLow: 1000, estimatedEarningsHigh: 10000, riskLevel: 'HIGH' as const,
      riskExplanation: 'Requires deep technical knowledge and sales skills. Long sales cycle with enterprise clients.',
      mitigationStrategy: 'Start with SMBs. Build credibility with free content before pitching.',
      toolLinks: JSON.stringify([{name: 'LinkedIn', url: 'https://linkedin.com'}, {name: 'Calendly', url: 'https://calendly.com'}]),
      proTip: 'One enterprise client paying $5K/month is worth more than 50 small gigs.',
      category: 'AGENT_ECONOMY' as const, qualityScore: 0.79, isFeatured: false, weekOf,
      requiresOptIn: true,
    },
    {
      id: 'task-8', trendId: trend1.id, title: 'Prompt Engineering Gig Service',
      description: 'Offer prompt engineering as a service — write optimized prompts for businesses using AI tools.',
      steps: JSON.stringify(['Master prompt engineering techniques (free courses)', 'Create a portfolio of 10 before/after prompt comparisons', 'List services on Upwork and direct outreach', 'Price at $50-200 per prompt set', 'Build recurring clients with monthly optimization packages']),
      difficulty: 'ZERO' as const, startupCost: 0, timeToFirstDollar: '2-5 days',
      estimatedEarningsLow: 150, estimatedEarningsHigh: 2000, riskLevel: 'LOW' as const,
      riskExplanation: 'Low barrier to entry means competition. Clients may not understand the value.',
      mitigationStrategy: 'Show quantifiable results (e.g., "This prompt improved output quality by 40%").',
      toolLinks: JSON.stringify([{name: 'Upwork', url: 'https://upwork.com'}]),
      proTip: 'Focus on industries with high AI adoption: marketing, legal, healthcare.',
      category: 'AI_TOOLS' as const, qualityScore: 0.86, isFeatured: false, weekOf,
    },
    {
      id: 'task-9', trendId: trend2.id, title: 'AI Voiceover Narration Service',
      description: 'Use AI voice cloning to offer professional narration for podcasts, audiobooks, and ads.',
      steps: JSON.stringify(['Sign up for ElevenLabs or Play.ht', 'Create voice samples in multiple styles', 'Set up portfolio website (Carrd.co, free)', 'List on Fiverr with competitive pricing ($25-75)', 'Upsell with script writing + voiceover packages']),
      difficulty: 'LOW' as const, startupCost: 10, timeToFirstDollar: '3-5 days',
      estimatedEarningsLow: 300, estimatedEarningsHigh: 2500, riskLevel: 'MEDIUM' as const,
      riskExplanation: 'AI voice regulations are evolving. Ethical concerns about voice cloning.',
      mitigationStrategy: 'Use only licensed AI voices. Be transparent about AI usage in deliverables.',
      toolLinks: JSON.stringify([{name: 'ElevenLabs', url: 'https://elevenlabs.io'}, {name: 'Play.ht', url: 'https://play.ht'}]),
      proTip: 'Podcast intros/outros are the fastest sale — $25 each, 5 minutes of work.',
      category: 'AI_CONTENT' as const, qualityScore: 0.84, isFeatured: false, weekOf,
    },
    {
      id: 'task-10', trendId: trend3.id, title: 'Chrome Extension with AI Features',
      description: 'Build a Chrome extension that adds AI capabilities to popular websites.',
      steps: JSON.stringify(['Identify a repetitive task on a popular site (LinkedIn, Gmail)', 'Build extension scaffold using Cursor IDE', 'Integrate free AI API for core feature', 'Publish to Chrome Web Store ($5 one-time fee)', 'Monetize with freemium model or one-time purchase']),
      difficulty: 'MEDIUM' as const, startupCost: 5, timeToFirstDollar: '7-14 days',
      estimatedEarningsLow: 200, estimatedEarningsHigh: 4000, riskLevel: 'MEDIUM' as const,
      riskExplanation: 'Chrome Web Store review can take time. Platform may reject or remove extensions.',
      mitigationStrategy: 'Follow Chrome Web Store guidelines strictly. Have a backup distribution channel.',
      toolLinks: JSON.stringify([{name: 'Chrome Web Store', url: 'https://chrome.google.com/webstore'}, {name: 'Cursor IDE', url: 'https://cursor.sh'}]),
      proTip: 'LinkedIn productivity extensions have the highest conversion rates.',
      category: 'AI_TOOLS' as const, qualityScore: 0.88, isVerified: true, isFeatured: true, weekOf,
    },
  ];

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    });
  }

  // Success Stories
  const stories = [
    {
      id: 'story-1', userId: demoUser1.id, taskId: 'task-1',
      earningsAmount: 1200, description: 'Built an AI chatbot for a local dental office. They loved it so much they referred me to 3 other businesses. Made $1,200 in the first month!',
      verificationStatus: 'VERIFIED' as const, isPublished: true, verifiedAt: new Date(),
    },
    {
      id: 'story-2', userId: demoUser2.id, taskId: 'task-5',
      earningsAmount: 3500, description: 'Created a micro-SaaS that generates meeting summaries from Zoom recordings. Hit $3,500 MRR in 6 weeks. Cursor IDE made development 10x faster.',
      verificationStatus: 'VERIFIED' as const, isPublished: true, verifiedAt: new Date(),
    },
    {
      id: 'story-3', userId: demoUser3.id, taskId: 'task-3',
      earningsAmount: 420, description: 'Started a faceless AI channel about personal finance tips. Got monetized in 3 weeks! $420 from ads and affiliate links combined.',
      verificationStatus: 'VERIFIED' as const, isPublished: true, verifiedAt: new Date(),
    },
  ];

  for (const story of stories) {
    await prisma.successStory.upsert({
      where: { id: story.id },
      update: {},
      create: story,
    });
  }

  // Templates
  const templates = [
    {
      id: 'tpl-1', userId: demoUser1.id, title: 'AI Agent Business Pitch Deck',
      description: 'Professional pitch deck template for selling AI agent services to local businesses. Includes slides for ROI calculation, demo screenshots, and pricing.',
      price: 19, category: 'business', downloads: 142, revenue: 2698, isApproved: true,
    },
    {
      id: 'tpl-2', userId: demoUser2.id, title: 'Micro-SaaS Launch Checklist',
      description: 'Complete launch checklist with 47 items covering MVP build, deployment, payment setup, marketing, and scaling. Used for 5 successful launches.',
      price: 9, category: 'development', downloads: 289, revenue: 2601, isApproved: true,
    },
    {
      id: 'tpl-3', userId: demoUser1.id, title: 'YouTube AI Channel Content Calendar',
      description: '90-day content calendar template with niche research framework, SEO title formulas, and thumbnail design guidelines for AI avatar channels.',
      price: 14, category: 'content', downloads: 198, revenue: 2772, isApproved: true,
    },
    {
      id: 'tpl-4', userId: demoUser2.id, title: 'Freelance AI Services Proposal Template',
      description: 'Client proposal template for AI consulting gigs. Includes scope of work, timeline, pricing tiers, and terms & conditions.',
      price: 12, category: 'business', downloads: 156, revenue: 1872, isApproved: true,
    },
    {
      id: 'tpl-5', userId: demoUser3.id, title: 'Prompt Engineering Portfolio Builder',
      description: 'Notion template to showcase your best prompts with before/after examples. Perfect for landing prompt engineering clients.',
      price: 7, category: 'tools', downloads: 324, revenue: 2268, isApproved: true,
    },
  ];

  for (const tpl of templates) {
    await prisma.template.upsert({
      where: { id: tpl.id },
      update: {},
      create: tpl,
    });
  }

  // Weekly Digest
  await prisma.weeklyDigest.upsert({
    where: { id: 'digest-current' },
    update: {},
    create: {
      id: 'digest-current',
      weekOf,
      tasks: JSON.stringify(tasks.map((t: any) => ({ id: t.id, title: t.title, difficulty: t.difficulty }))),
      trendSummary: 'This week\'s hottest trends: AI Agent Economy is exploding with OpenClaw leading the charge. AI Avatar channels are seeing 3x growth on YouTube. Micro-SaaS builders using Cursor IDE are shipping products in record time.',
    },
  });

  console.log('✅ Seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
