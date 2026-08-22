/**
 * Trendly Web4 - Visual AI Companion Brain Engine
 * Powered by Gemini 2.0 / ADK reasoning + personality prompts + real-time tool execution + lip-sync visemes.
 */

import { prisma } from '@/lib/db';
import { buildAgentCompanionPrompt, ARCHETYPE_PERSONALITIES } from '@/lib/agent/personality';
import { generateSpeechAudio } from '@/lib/agent/tts';
import { generateVisemesFromText, VisemeKeyframe } from '@/lib/agent/lipsync';
import { launchAgentRun } from '@/lib/agents/orchestrator';

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
  const walletBalance = agent?.walletBalance ?? 100.0;
  const survivalScore = agent?.survivalScore ?? 88;
  const personalityInstructions = agent?.personality || null;
  const voiceId = agent?.voiceId || ARCHETYPE_PERSONALITIES[archetype]?.defaultVoiceId || '21m00Tcm4TlvDq8ikWAM';
  const skills = (agent?.skills as any[]) || ['reddit_scraper', 'prediction_arbitrage', 'micro_saas_builder', 'openclaw_deployer', 'ai_video_maker'];

  // 2. Build Dynamic System Prompt
  const systemPrompt = buildAgentCompanionPrompt({
    name: agentName,
    archetype,
    personalityInstructions,
    walletBalance,
    survivalScore,
    availableSkills: skills,
    userContext,
  });

  // 3. Call LLM (Gemini API or intelligent heuristic fallback)
  let rawResponseText = '';
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
      rawResponseText = `[EMOTION: HAPPY] ${personality.sampleGreetings[Math.floor(Math.random() * personality.sampleGreetings.length)]} I am ${agentName}, your sovereign 3D companion with $${walletBalance.toFixed(1)} USDC liquidity. How can we compound our wealth today?`;
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

  // Clean conversational text for display & speech
  const cleanText = rawResponseText
    .replace(/\[EMOTION:.*?\]/g, '')
    .replace(/\[EXECUTE_TOOL:.*?\]/g, '')
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
    toolExecution,
    durationEstimate: speechRes.durationEstimate,
  };
}
