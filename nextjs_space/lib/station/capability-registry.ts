import { SKILLS_LIBRARY } from '@/lib/intelligence/tools/skills-library';

/**
 * TrendForge Station — Capability Registry & Monotonic Attenuation Engine
 *
 * Evolved from StarNet's `sidecar/capability/registry.js` and `capGate.js`,
 * redesigned for multi-tenant cloud + local execution inside Trendly:
 * - Maps Station Modules ("furniture" / hardware racks) to policy triples (`StationGrant`).
 * - Auto-provisions the full default station loadout so runs never silently fail with `capdenied`
 *   just because a pixel prop wasn't dragged onto a canvas, while preserving explicit per-user
 *   and per-subagent capability attenuation (`attenuateCapabilities`).
 */

export type StationModuleId =
  | 'command_computer'
  | 'memory_notebook'
  | 'signal_dish'
  | 'market_radar'
  | 'outreach_relay'
  | 'media_studio'
  | 'code_workbench'
  | 'crew_beacon';

export type GrantScope = 'read' | 'write' | 'execute';

export interface StationGrant {
  capId: string;
  tool: string;
  module: StationModuleId;
  scope: GrantScope;
  requiresConsent: boolean;
  network: boolean;
  computeCostUsdc: number;
  description: string;
}

export interface StationModuleDefinition {
  id: StationModuleId;
  name: string;
  zone: 'COMMAND' | 'INTEL' | 'FINANCE' | 'GROWTH' | 'ENGINEERING';
  description: string;
  defaultEnabled: boolean;
  grants: StationGrant[];
}

export const STATION_MODULES: Record<StationModuleId, StationModuleDefinition> = {
  command_computer: {
    id: 'command_computer',
    name: 'Command Core Computer',
    zone: 'COMMAND',
    description: 'Core model reasoning gate, task planning, station diagnostics, and verification.',
    defaultEnabled: true,
    grants: [
      {
        capId: 'compute',
        tool: 'model.chat',
        module: 'command_computer',
        scope: 'execute',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0,
        description: 'Precondition compute gate to spend an LLM reasoning turn.',
      },
      {
        capId: 'stationinfo',
        tool: 'station.inspect',
        module: 'command_computer',
        scope: 'read',
        requiresConsent: false,
        network: false,
        computeCostUsdc: 0,
        description: 'Inspect active station modules, capabilities, and crew status.',
      },
      {
        capId: 'taskplan',
        tool: 'quest.update',
        module: 'command_computer',
        scope: 'write',
        requiresConsent: false,
        network: false,
        computeCostUsdc: 0,
        description: 'Update the active mission plan and step checklist.',
      },
      {
        capId: 'deliverable',
        tool: 'deliverable.note',
        module: 'command_computer',
        scope: 'write',
        requiresConsent: false,
        network: false,
        computeCostUsdc: 0,
        description: 'Register a structured deliverable artifact with provenance.',
      },
      {
        capId: 'verify',
        tool: 'verify.run',
        module: 'command_computer',
        scope: 'read',
        requiresConsent: false,
        network: false,
        computeCostUsdc: 0,
        description: 'Run deterministic postcondition verification on tool outputs.',
      },
    ],
  },
  memory_notebook: {
    id: 'memory_notebook',
    name: 'Cortex Memory Core',
    zone: 'COMMAND',
    description: 'Durable episodic beliefs, preferences, and cross-run recall.',
    defaultEnabled: true,
    grants: [
      {
        capId: 'memory',
        tool: 'notebook.read',
        module: 'memory_notebook',
        scope: 'read',
        requiresConsent: false,
        network: false,
        computeCostUsdc: 0,
        description: 'Recall stored durable facts and operator preferences.',
      },
      {
        capId: 'memory',
        tool: 'notebook.write',
        module: 'memory_notebook',
        scope: 'write',
        requiresConsent: false,
        network: false,
        computeCostUsdc: 0,
        description: 'Store a durable verified fact or operator preference.',
      },
    ],
  },
  signal_dish: {
    id: 'signal_dish',
    name: 'Deep-Space Signal Dish',
    zone: 'INTEL',
    description: 'Live web scraping across Reddit, HackerNews, ProductHunt, X, and Google Maps.',
    defaultEnabled: true,
    grants: [
      {
        capId: 'web_scrape',
        tool: 'scrape_reddit_painpoints',
        module: 'signal_dish',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.02,
        description: 'Extract high-intent B2B/SaaS pain points from live Reddit & HN discussions.',
      },
      {
        capId: 'web_scrape',
        tool: 'scrape_hackernews_launches',
        module: 'signal_dish',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.01,
        description: 'Monitor Show HN launches and technical traction.',
      },
      {
        capId: 'web_scrape',
        tool: 'scrape_google_maps_local',
        module: 'signal_dish',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.05,
        description: 'Scan local businesses for digital presence gaps.',
      },
      {
        capId: 'web_scrape',
        tool: 'scrape_twitter_sentiment',
        module: 'signal_dish',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.04,
        description: 'Analyze real-time community velocity and sentiment.',
      },
      {
        capId: 'web_scrape',
        tool: 'scrape_producthunt_trending',
        module: 'signal_dish',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.02,
        description: 'Extract trending software launches and feature requests.',
      },
    ],
  },
  market_radar: {
    id: 'market_radar',
    name: 'Quant Arbitrage Terminal',
    zone: 'FINANCE',
    description: 'Live Polymarket spread scanning, Solana DEX liquidity, and perp funding arbitrage.',
    defaultEnabled: true,
    grants: [
      {
        capId: 'quant_intel',
        tool: 'polymarket_spread_scanner',
        module: 'market_radar',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.03,
        description: 'Scan live Polymarket prediction markets for pricing spreads.',
      },
      {
        capId: 'quant_intel',
        tool: 'solana_dex_liquidity_tracker',
        module: 'market_radar',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.05,
        description: 'Monitor Raydium/Orca/DexScreener Solana pools.',
      },
      {
        capId: 'quant_intel',
        tool: 'crypto_funding_rate_arbitrage',
        module: 'market_radar',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.04,
        description: 'Calculate delta-neutral perpetual funding rate spreads.',
      },
    ],
  },
  outreach_relay: {
    id: 'outreach_relay',
    name: 'Outreach & Comms Relay',
    zone: 'GROWTH',
    description: 'B2B lead extraction, cold email sequences, social distribution, and webhooks.',
    defaultEnabled: true,
    grants: [
      {
        capId: 'lead_intel',
        tool: 'b2b_lead_extractor',
        module: 'outreach_relay',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.08,
        description: 'Discover B2B decision-maker leads by industry and role.',
      },
      {
        capId: 'copywriting',
        tool: 'cold_email_sequence_writer',
        module: 'outreach_relay',
        scope: 'write',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.03,
        description: 'Generate 4-step hyper-personalized B2B outreach sequences.',
      },
      {
        capId: 'external_comms',
        tool: 'sendgrid_bulk_dispatcher',
        module: 'outreach_relay',
        scope: 'execute',
        requiresConsent: true,
        network: true,
        computeCostUsdc: 0.05,
        description: 'Dispatch real outbound emails via SendGrid/Resend.',
      },
      {
        capId: 'social_copy',
        tool: 'twitter_thread_storm_creator',
        module: 'outreach_relay',
        scope: 'write',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.02,
        description: 'Compose high-engagement X/Twitter threads.',
      },
      {
        capId: 'social_copy',
        tool: 'linkedin_thought_leader_post',
        module: 'outreach_relay',
        scope: 'write',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.02,
        description: 'Write B2B LinkedIn authority posts.',
      },
      {
        capId: 'external_comms',
        tool: 'discord_alert_webhook',
        module: 'outreach_relay',
        scope: 'execute',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.01,
        description: 'Push structured JSON embeds to a Discord webhook.',
      },
    ],
  },
  media_studio: {
    id: 'media_studio',
    name: 'Autonomous Media Studio',
    zone: 'GROWTH',
    description: 'Viral video scriptwriting, ElevenLabs neural voiceovers, and SEO long-form articles.',
    defaultEnabled: true,
    grants: [
      {
        capId: 'media_gen',
        tool: 'viral_video_scriptwriter',
        module: 'media_studio',
        scope: 'write',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.03,
        description: 'Write high-retention TikTok/Reels/Shorts scripts.',
      },
      {
        capId: 'media_gen',
        tool: 'elevenlabs_audio_synthesizer',
        module: 'media_studio',
        scope: 'execute',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.1,
        description: 'Synthesize neural voiceover audio via ElevenLabs.',
      },
      {
        capId: 'media_gen',
        tool: 'seo_blog_post_generator',
        module: 'media_studio',
        scope: 'write',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.04,
        description: 'Produce 2,000-word SEO pillar articles.',
      },
    ],
  },
  code_workbench: {
    id: 'code_workbench',
    name: 'Engineering Workbench',
    zone: 'ENGINEERING',
    description: 'Next.js Micro-SaaS code synthesis, Solidity security auditing, and node health probing.',
    defaultEnabled: true,
    grants: [
      {
        capId: 'code_build',
        tool: 'nextjs_microsaas_builder',
        module: 'code_workbench',
        scope: 'write',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.25,
        description: 'Architect full-stack Next.js + Prisma + Tailwind Micro-SaaS bundles.',
      },
      {
        capId: 'infra_probe',
        tool: 'openclaw_vps_provisioner',
        module: 'code_workbench',
        scope: 'execute',
        requiresConsent: true,
        network: true,
        computeCostUsdc: 0.5,
        description: 'Verify and probe remote OpenClaw/Station container nodes.',
      },
      {
        capId: 'security_audit',
        tool: 'smart_contract_solidity_auditor',
        module: 'code_workbench',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0.15,
        description: 'Audit Solidity/Rust contracts for reentrancy and overflow vulnerabilities.',
      },
    ],
  },
  crew_beacon: {
    id: 'crew_beacon',
    name: 'Crew Delegation Beacon',
    zone: 'COMMAND',
    description: 'Allows the Overseer agent to spawn specialist sub-agents with attenuated permissions.',
    defaultEnabled: true,
    grants: [
      {
        capId: 'subagents',
        tool: 'crew.delegate',
        module: 'crew_beacon',
        scope: 'execute',
        requiresConsent: false,
        network: true,
        computeCostUsdc: 0,
        description: 'Delegate a focused sub-task to a specialist crew agent with attenuated capabilities.',
      },
    ],
  },
};

export interface ResolvedStationCapabilities {
  userId: string;
  agentId: string;
  enabledModules: StationModuleId[];
  hasCompute: boolean;
  tools: string[];
  grantsByTool: Record<string, StationGrant>;
  maxBudgetUsdc: number;
  spentBudgetUsdc: number;
}

export const DEFAULT_STATION_MODULES: StationModuleId[] = Object.values(STATION_MODULES)
  .filter((m) => m.defaultEnabled)
  .map((m) => m.id);

/**
 * Resolves the active capability set for a given station module loadout.
 * Guarantees that `command_computer` is always present unless explicitly stripped.
 */
export function resolveStationCapabilities(opts: {
  userId?: string;
  agentId?: string;
  enabledModules?: StationModuleId[];
  maxBudgetUsdc?: number;
} = {}): ResolvedStationCapabilities {
  const modules = opts.enabledModules?.length ? opts.enabledModules : DEFAULT_STATION_MODULES;
  const uniqueModules = Array.from(new Set<StationModuleId>(['command_computer', ...modules]));

  let hasCompute = false;
  const tools: string[] = [];
  const grantsByTool: Record<string, StationGrant> = {};

  for (const modId of uniqueModules) {
    const mod = STATION_MODULES[modId];
    if (!mod) continue;
    for (const grant of mod.grants) {
      if (grant.capId === 'compute') {
        hasCompute = true;
        continue; // Compute is the precondition gate, not a callable tool
      }
      if (!grantsByTool[grant.tool]) {
        tools.push(grant.tool);
        grantsByTool[grant.tool] = grant;
      }
    }
  }

  // Ensure any newly added SKILLS_LIBRARY entry is also discoverable if signal_dish / code_workbench is active
  for (const skill of SKILLS_LIBRARY) {
    if (!grantsByTool[skill.id] && uniqueModules.includes('signal_dish')) {
      tools.push(skill.id);
      grantsByTool[skill.id] = {
        capId: skill.category.toLowerCase(),
        tool: skill.id,
        module: 'signal_dish',
        scope: 'read',
        requiresConsent: false,
        network: true,
        computeCostUsdc: skill.computeCostUsdc,
        description: skill.description,
      };
    }
  }

  return {
    userId: opts.userId || 'anon',
    agentId: opts.agentId || 'overseer',
    enabledModules: uniqueModules,
    hasCompute,
    tools,
    grantsByTool,
    maxBudgetUsdc: opts.maxBudgetUsdc ?? 5.0,
    spentBudgetUsdc: 0,
  };
}

/**
 * Checks whether a resolved capability set permits invoking `toolName`.
 * If denied, returns the exact Station Module that needs to be enabled.
 */
export function canAgentUseTool(
  resolved: ResolvedStationCapabilities,
  toolName: string
): { ok: boolean; reason?: string; requiredModule?: StationModuleId; grant?: StationGrant } {
  if (!resolved.hasCompute) {
    return {
      ok: false,
      reason: 'Station compute gate is offline (enable command_computer module).',
      requiredModule: 'command_computer',
    };
  }

  const grant = resolved.grantsByTool[toolName];
  if (grant && resolved.tools.includes(toolName)) {
    if (resolved.spentBudgetUsdc + grant.computeCostUsdc > resolved.maxBudgetUsdc) {
      return {
        ok: false,
        reason: `Station run budget ceiling reached ($${resolved.spentBudgetUsdc.toFixed(2)} / $${resolved.maxBudgetUsdc.toFixed(2)} USDC).`,
      };
    }
    return { ok: true, grant };
  }

  // Find which module owns this tool so we give an actionable remediation message
  for (const mod of Object.values(STATION_MODULES)) {
    const found = mod.grants.find((g) => g.tool === toolName);
    if (found) {
      return {
        ok: false,
        reason: `Capability denied for '${toolName}': Station module '${mod.name}' (${mod.id}) is not enabled for agent '${resolved.agentId}'.`,
        requiredModule: mod.id,
      };
    }
  }

  return {
    ok: false,
    reason: `Unknown tool '${toolName}'. Available tools: ${resolved.tools.slice(0, 12).join(', ')}`,
  };
}

/**
 * Monotonic capability attenuation for delegated crew workers:
 * Worker tools = parentResolved.tools ∩ allowedSubset.
 * A sub-agent can NEVER escalate privileges beyond the Overseer's station loadout.
 */
export function attenuateCapabilities(
  parent: ResolvedStationCapabilities,
  workerAgentId: string,
  allowedSubset: string[],
  maxWorkerBudgetUsdc?: number
): ResolvedStationCapabilities {
  const allowSet = new Set(allowedSubset);
  const attenuatedTools = parent.tools.filter((t) => allowSet.has(t));
  const attenuatedGrants: Record<string, StationGrant> = {};
  for (const t of attenuatedTools) {
    if (parent.grantsByTool[t]) {
      attenuatedGrants[t] = parent.grantsByTool[t];
    }
  }

  const remainingParentBudget = Math.max(0, parent.maxBudgetUsdc - parent.spentBudgetUsdc);
  return {
    userId: parent.userId,
    agentId: workerAgentId,
    enabledModules: [...parent.enabledModules],
    hasCompute: parent.hasCompute,
    tools: attenuatedTools,
    grantsByTool: attenuatedGrants,
    maxBudgetUsdc:
      maxWorkerBudgetUsdc !== undefined
        ? Math.min(maxWorkerBudgetUsdc, remainingParentBudget)
        : remainingParentBudget,
    spentBudgetUsdc: 0,
  };
}
