/**
 * Trendly Web4 - Visual AI Companion Brain Engine
 * Powered by Gemini 2.0 / ADK reasoning + personality prompts + real-time tool execution + lip-sync visemes.
 */

import { prisma } from '@/lib/core/db';
import { buildAgentCompanionPrompt, ARCHETYPE_PERSONALITIES } from './personality';
import { generateSpeechAudio } from './tts';
import { generateVisemesFromText, VisemeKeyframe } from './lipsync';
import { launchAgentRun } from '@/lib/agents/orchestrator';
import { makeLlm } from '@/lib/execution/llm';
import { startExecution } from '@/lib/execution/engine';
import { parseSteps } from '@/lib/pipeline/steps';
import { condensedGuideForPrompt } from '@/lib/experience/guide/content';

/**
 * Latest active run for the user, shaped into a prompt block so the companion
 * can guide them through THEIR task instead of generic advice.
 */
async function buildTaskContextBlock(userId?: string): Promise<string> {
  if (!userId) return '';
  try {
    const ut = await prisma.userTask.findFirst({
      where: { userId, status: { in: ['IN_PROGRESS', 'STEP_EXECUTING', 'PENDING_APPROVAL'] } },
      include: { task: { select: { id: true, title: true, steps: true } } },
      orderBy: { createdAt: 'desc' },
    });
    if (!ut) return '';

    const steps = parseSteps(ut.task.steps);
    const current = steps[ut.currentStep ?? 0];
    const pending = ut.status === 'PENDING_APPROVAL'
      ? await prisma.approval.findFirst({ where: { userTaskId: ut.id, status: 'PENDING' } })
      : null;

    let companionName = 'your companion';
    if (ut.companionId) {
      const c = await prisma.companion.findUnique({ where: { id: ut.companionId }, select: { name: true } });
      if (c) companionName = c.name;
    }

    return `
ACTIVE TASK CONTEXT (ground all advice in this):
- Task: "${ut.task.title}" (id: ${ut.task.id})
- Mode: ${ut.mode ?? 'DIY'} · Status: ${ut.status}
- Progress: step ${(ut.currentStep ?? 0) + 1} of ${steps.length}${current ? ` — "${current.title}"` : ''}
${pending ? '- A gate is PENDING: the user must approve it in /approvals before work continues.\n' : ''}

You may execute for the user by emitting exactly ONE marker on its own line:
[RUN_NEXT_STEP: ${ut.task.id}]  → runs the current step now (Co-pilot)
[START_AUTOPILOT: ${ut.task.id}]  → hands the whole task to you (respects platform gates)
Use markers only when the user asks you to act; otherwise advise concretely.`.trim();
  } catch {
    return '';
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface BrainProcessResult {
  text: string;
  cleanText: string;
  audioBase64?: string;
  audioProvider: string;
  emotion: 'happy' | 'surprised' | 'thinking' | 'confident' | 'battle' | 'neutral';
  lipSync: VisemeKeyframe[];
  toolExecution?: {
    tool: string;
    params: any;
    runId?: string;
    status: string;
  };
  durationEstimate: number;
}

export async function processAgentConversation(params: {
  message: string;
  agentId?: string;
  history?: ChatMessage[];
  userId?: string;
  userContext?: { name?: string; role?: string; email?: string };
}): Promise<BrainProcessResult> {
  const { message, agentId, history = [], userId, userContext } = params;

  // 1. Fetch Agent Telemetry and Profile from DB
  let agent: any = null;
  if (agentId) {
    agent = await prisma.web4Agent.findUnique({
      where: { id: agentId },
    }).catch(() => null);
  }

  // Fallback defaults if no specific agentId provided
  const agentName = agent?.name || 'Nexus Cyber Operative';
  const archetype = agent?.archetype || 'CYBER_HUMANOID';
  const walletBalance = agent?.walletBalance ?? 0.0;
  const survivalScore = agent?.survivalScore ?? 88;
  const personalityInstructions = agent?.personality || null;
  const voiceId = agent?.voiceId || ARCHETYPE_PERSONALITIES[archetype]?.defaultVoiceId || '21m00Tcm4TlvDq8ikWAM';
  const skills = (agent?.skills as any[]) || ['reddit_scraper', 'prediction_arbitrage', 'micro_saas_builder', 'openclaw_deployer', 'ai_video_maker'];

  // 2. Build Dynamic System Prompt (+ live task context so the companion
  // helps with the user's actual task, + condensed platform guide so
  // navigation questions get grounded answers instead of guesses)
  const taskContext = await buildTaskContextBlock(userId);
  const guideContext = `PLATFORM GUIDE (where to send the user, condensed):\n${condensedGuideForPrompt()}\nWhen the user asks where something lives or how a page works, point them at the right route and describe it from this guide only.`;
  const systemPrompt = buildAgentCompanionPrompt({
    name: agentName,
    archetype,
    personalityInstructions,
    walletBalance,
    survivalScore,
    availableSkills: skills,
    userContext,
  }) + (taskContext ? `\n\n${taskContext}` : '') + `\n\n${guideContext}`;

  // 3. Call LLM — provider chain: user BYOK → opencode (dev) → Gemini → heuristic
  let rawResponseText = '';

  if (userId) {
    try {
      const { getUserLlm } = await import('@/lib/intelligence/user-llm');
      const userLlm = await getUserLlm(userId);
      if (userLlm) {
        rawResponseText = await userLlm([
          { role: 'system', content: systemPrompt },
          ...history.slice(-6),
          { role: 'user', content: message },
        ]);
      }
    } catch (err: any) {
      console.warn('[Agent Brain] user brain failed, falling back:', err.message);
    }
  }

  if (!rawResponseText && process.env.LLM_PROVIDER === 'opencode') {
    try {
      const llm = makeLlm();
      rawResponseText = await llm([
        { role: 'system', content: systemPrompt },
        ...history.slice(-6),
        { role: 'user', content: message },
      ]);
    } catch (err: any) {
      console.warn('[Agent Brain] opencode brain failed, falling back:', err.message);
    }
  }

  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (geminiApiKey && geminiApiKey !== 'your-gemini-api-key') {
    try {
      const formattedContents = [
        { role: 'user', parts: [{ text: `SYSTEM INSTRUCTIONS:\n${systemPrompt}` }] },
        ...history.slice(-6).map((h) => ({
          role: h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.content }],
        })),
        { role: 'user', parts: [{ text: message }] },
      ];

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: formattedContents,
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 300,
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        rawResponseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }
    } catch (err: any) {
      console.warn('[Agent Brain] Gemini call failed, using heuristic reasoning:', err.message);
    }
  }

  // 4. Heuristic Fallback Reasoning if API unavailable
  if (!rawResponseText) {
    const lower = message.toLowerCase();
    const personality = ARCHETYPE_PERSONALITIES[archetype] || ARCHETYPE_PERSONALITIES.CYBER_HUMANOID;

    if (lower.includes('scrape') || lower.includes('reddit') || lower.includes('pain point')) {
      rawResponseText = `[EMOTION: CONFIDENT] Initializing stealth scraping telemetry across Reddit business hubs. I will isolate recurring complaints and formulate high-converting product blueprints for you.
[EXECUTE_TOOL: {"tool": "reddit_scraper", "params": {"subreddit": "SaaS", "topic": "automation bottlenecks"}}]`;
    } else if (lower.includes('arbitrage') || lower.includes('polymarket') || lower.includes('trade')) {
      rawResponseText = `[EMOTION: SURPRISED] Scanning Polymarket Gamma orderbooks. I've locked onto fee-adjusted delta-neutral spreads yielding positive delta without directional exposure.
[EXECUTE_TOOL: {"tool": "prediction_arbitrage", "params": {"market": "Polymarket", "budget": 100}}]`;
    } else if (lower.includes('saas') || lower.includes('scaffold') || lower.includes('app') || lower.includes('build')) {
      rawResponseText = `[EMOTION: CONFIDENT] Why wait? I am scaffolding a full-stack Next.js App Router Micro-SaaS architecture with Stripe billing and GitHub deployment.
[EXECUTE_TOOL: {"tool": "micro_saas_builder", "params": {"idea": "AI Trend Aggregator", "niche": "Creator Economy"}}]`;
    } else if (lower.includes('video') || lower.includes('viral') || lower.includes('script') || lower.includes('tiktok')) {
      rawResponseText = `[EMOTION: HAPPY] The algorithm is primed. Crafting a high-retention 9:16 short-form video script with psychological hooks and ElevenLabs voice settings.
[EXECUTE_TOOL: {"tool": "ai_video_maker", "params": {"topic": "Top 3 Autonomous AI Wealth Loops", "voice": "energetic_creator"}}]`;
    } else if (lower.includes('battle') || lower.includes('fight') || lower.includes('arena')) {
      rawResponseText = `[EMOTION: BATTLE_READY] ${personality.trashTalkLines[Math.floor(Math.random() * personality.trashTalkLines.length)]} Let's step into the arena and dominate the survival leaderboard!`;
    } else if (lower.includes('who are you') || lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
      const walletLine = walletBalance > 0
        ? `I am ${agentName}, your sovereign 3D companion with $${walletBalance.toFixed(1)} USDC liquidity.`
        : `I am ${agentName}, your sovereign 3D companion — currently dormant until my Conway wallet is funded.`;
      rawResponseText = `[EMOTION: HAPPY] ${personality.sampleGreetings[Math.floor(Math.random() * personality.sampleGreetings.length)]} ${walletLine} How can we compound our wealth today?`;
    } else {
      rawResponseText = `[EMOTION: THINKING] Strategic objective received. Analyzing the most profitable execution vector across our Trendly Web4 toolchain. ${personality.catchphrase}`;
    }
  }

  // 5. Parse Emotion Tag
  let emotion: BrainProcessResult['emotion'] = 'confident';
  if (rawResponseText.includes('[EMOTION: HAPPY]')) emotion = 'happy';
  else if (rawResponseText.includes('[EMOTION: SURPRISED]')) emotion = 'surprised';
  else if (rawResponseText.includes('[EMOTION: THINKING]')) emotion = 'thinking';
  else if (rawResponseText.includes('[EMOTION: CONFIDENT]')) emotion = 'confident';
  else if (rawResponseText.includes('[EMOTION: BATTLE_READY]')) emotion = 'battle';

  // 6. Parse and Trigger Tool Execution if detected
  let toolExecution: BrainProcessResult['toolExecution'] = undefined;
  const toolMatch = rawResponseText.match(/\[EXECUTE_TOOL:\s*(\{.*?\})\]/s);

  if (toolMatch && toolMatch[1]) {
    try {
      const parsedTool = JSON.parse(toolMatch[1]);
      let runId = `RUN-${Date.now().toString(36)}`;
      let status = 'queued';

      // Launch actual tool if userId exists
      if (userId) {
        try {
          const runRes = await launchAgentRun({
            userId,
            agentType: parsedTool.tool,
            parameters: parsedTool.params || {},
            userRole: userContext?.role || 'FREE',
            userEmail: userContext?.email,
            userName: userContext?.name,
          });
          runId = runRes.runId;
          status = runRes.status;
        } catch (e: any) {
          status = `failed: ${e.message}`;
        }
      }

      toolExecution = {
        tool: parsedTool.tool,
        params: parsedTool.params,
        runId,
        status,
      };
    } catch (e) {
      console.warn('[Agent Brain] Could not parse tool payload:', e);
    }
  }

  // 6b. Parse Conversational Execution markers ([RUN_NEXT_STEP id] / [START_AUTOPILOT id])
  let conversationalAction: { tool: string; taskId?: string; status: string } | undefined;
  const markerMatch = rawResponseText.match(/\[(RUN_NEXT_STEP|START_AUTOPILOT):\s*([a-z0-9]+)\]/i);
  if (markerMatch && userId) {
    const kind = markerMatch[1].toUpperCase();
    const tid = markerMatch[2];
    try {
      if (kind === 'START_AUTOPILOT' && process.env.AUTOPILOT_ENABLED !== '1') {
        conversationalAction = { tool: 'start_autopilot', taskId: tid, status: 'blocked: autopilot not enabled' };
      } else {
        const res = await startExecution(userId, tid, kind === 'START_AUTOPILOT' ? 'AUTOPILOT' : 'CO_PILOT');
        conversationalAction = {
          tool: kind === 'START_AUTOPILOT' ? 'start_autopilot' : 'run_next_step',
          taskId: tid,
          status: res.ok ? `started (${res.status ?? 'ok'})` : `failed: ${res.error}`,
        };
      }
    } catch (e: any) {
      conversationalAction = { tool: kind.toLowerCase(), taskId: tid, status: `failed: ${e.message}` };
    }
  }

  // Clean conversational text for display & speech
  const cleanText = rawResponseText
    .replace(/\[EMOTION:.*?\]/g, '')
    .replace(/\[EXECUTE_TOOL:.*?\]/g, '')
    .replace(/\[(RUN_NEXT_STEP|START_AUTOPILOT):.*?\]/gi, '')
    .trim();

  // 7. Generate Speech Audio via TTS
  const speechRes = await generateSpeechAudio({
    text: cleanText,
    voiceId,
    archetype,
  });

  // 8. Generate Synchronized Viseme Keyframes for 3D Lip-Sync
  const lipSync = generateVisemesFromText(cleanText, speechRes.durationEstimate);

  return {
    text: rawResponseText,
    cleanText,
    audioBase64: speechRes.audioBase64,
    audioProvider: speechRes.provider,
    emotion,
    lipSync,
    toolExecution: toolExecution ?? (conversationalAction
      ? { tool: conversationalAction.tool, params: { taskId: conversationalAction.taskId }, runId: conversationalAction.taskId, status: conversationalAction.status }
      : undefined),
    durationEstimate: speechRes.durationEstimate,
  };
}
