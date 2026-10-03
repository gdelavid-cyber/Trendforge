import { prisma } from '@/lib/core/db';
import { decryptSecret } from '@/lib/core/encryption';
import type { LlmFn } from '@/lib/execution/llm';
import { trendforgeStationLlm } from '@/lib/station/engine';

// Bring-your-own-key companion brain. A user's saved provider+key outranks
// platform defaults everywhere a brain runs (engine steps, Talk chat).

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export interface UserLlmConfig {
  provider: string;
  model: string;
  baseUrl: string | null;
  apiKey: string;
}

export async function getUserLlmConfig(userId: string): Promise<UserLlmConfig | null> {
  const row = await prisma.userLlmKey.findUnique({ where: { userId } });
  if (!row) return null;
  try {
    const apiKey = decryptSecret(row.encryptedKey);
    if (!apiKey) return null;
    return {
      provider: row.provider,
      model: row.model,
      baseUrl: row.baseUrl,
      apiKey,
    };
  } catch {
    return null;
  }
}

function endpointFor(cfg: UserLlmConfig): string {
  if (cfg.provider === 'openrouter') return OPENROUTER_URL;
  if (cfg.provider === 'starnet') {
    const starnetBase = (cfg.baseUrl || process.env.STARNET_SERVE_URL || 'http://127.0.0.1:8787').replace(/\/+$/, '');
    if (starnetBase.endsWith('/chat/completions')) return starnetBase;
    return starnetBase.endsWith('/v1')
      ? `${starnetBase}/chat/completions`
      : `${starnetBase}/v1/chat/completions`;
  }
  // Custom OpenAI-compatible endpoints (OpenCode Zen, local gateways, etc.)
  const base = cfg.baseUrl?.replace(/\/+$/, '') || '';
  if (!base) throw new Error('Custom provider requires a base URL');
  return base.endsWith('/chat/completions') ? base : `${base}/chat/completions`;
}

export function openAiCompatibleLlm(cfg: UserLlmConfig & { userId?: string }): LlmFn {
  if (cfg.provider === 'station') {
    return trendforgeStationLlm({
      userId: cfg.userId,
      agentId: cfg.model || 'overseer',
    });
  }
  return async (messages, jsonMode = false) => {
    const endpoint = endpointFor(cfg);
    const body: Record<string, unknown> = {
      model: cfg.model || (cfg.provider === 'starnet' ? 'starnet-agent' : ''),
      messages,
      max_tokens: 4000,
    };
    if (jsonMode) body.response_format = { type: 'json_object' };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
        ...(cfg.provider === 'openrouter'
          ? { 'HTTP-Referer': process.env.NEXTAUTH_URL ?? 'https://trendly.app', 'X-Title': 'Trendly' }
          : {}),
        ...(cfg.provider === 'starnet' && cfg.userId
          ? { 'X-StarNet-Session-Id': `trendly-user-${cfg.userId.replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 32)}` }
          : {}),
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Brain request failed (${res.status}): ${text.slice(0, 200)}`);
    }
    const data = await res.json();
    if (data?.starnet && data.starnet.completed === false && !data?.choices?.[0]?.message?.content) {
      throw new Error(
        `BLOCKED by StarNet station: ${data.starnet.error || data.starnet.reason || data.starnet.status}`
      );
    }
    return data?.choices?.[0]?.message?.content ?? '';
  };
}

/** The user's own brain, or null when they haven't connected one. */
export async function getUserLlm(userId: string): Promise<LlmFn | null> {
  const cfg = await getUserLlmConfig(userId);
  return cfg ? openAiCompatibleLlm({ ...cfg, userId }) : null;
}
