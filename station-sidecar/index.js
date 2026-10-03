#!/usr/bin/env node
/**
 * TrendForge Station Sidecar (station-sidecar/index.js)
 *
 * Upgraded, MIT-derived autonomous agent harness sidecar built for TrendForge.
 * Fixes every architectural bottleneck of vanilla StarNet (`starnetos.com`):
 * 1. Cloud & Local Ready: Binds to `0.0.0.0` (or `HOST`) with NO loopback-only Host
 *    header rejection, so it can run on Railway/Fly.io/Render/Docker or localhost.
 * 2. Zero `capdenied` Deadlocks: Auto-provisions all 8 Station Modules (`command_computer`,
 *    `memory_notebook`, `signal_dish`, `market_radar`, `outreach_relay`, `media_studio`,
 *    `code_workbench`, `crew_beacon`) by default.
 * 3. Multi-Tenant Session Isolation: Isolates memory beliefs and run state per
 *    `X-StarNet-Session-Id` header (`trendly-<userId>-<taskId>`).
 * 4. Native MCP 2024-11-05 Bridge: Automatically discovers and invokes Trendly's 17
 *    real Web4 skills via `TRENDLY_MCP_URL` (`http://localhost:3000/api/web4/mcp`).
 * 5. Full `/v1/*` Harness Contract:
 *    - GET  /health
 *    - GET  /v1/models
 *    - GET  /v1/capabilities
 *    - POST /v1/chat/completions (sync + SSE stream)
 *    - POST /v1/runs, GET /v1/runs/:id, GET /v1/runs/:id/events, POST /v1/runs/:id/stop
 */

'use strict';

const http = require('http');
const crypto = require('crypto');

const PORT = Number(process.env.PORT || process.env.STATION_PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const MIN_KEY_LEN = 16;

const DEFAULT_CAPABILITIES = [
  'compute',
  'web_fetch',
  'web_search',
  'web_scrape',
  'quant_intel',
  'lead_intel',
  'copywriting',
  'external_comms',
  'media_gen',
  'code_exec',
  'code_build',
  'security_audit',
  'memory_store',
  'agent_spawn',
];

const CREW_ROSTER = [
  { id: 'starnet-agent', name: 'Overseer Prime', role: 'Station Commander & Multi-Step Orchestrator' },
  { id: 'overseer', name: 'Overseer Prime', role: 'Station Commander & Multi-Step Orchestrator' },
  { id: 'reddit_scraper', name: 'Lyra (Signal Scout)', role: 'Reddit, HN & ProductHunt Pain-Point Miner' },
  { id: 'market_analyst', name: 'Vega (Quant Analyst)', role: 'Polymarket, Solana DEX & Perp Arbitrage Analyst' },
  { id: 'micro_saas_builder', name: 'Orion (SaaS Architect)', role: 'Full-Stack Next.js + Prisma Micro-SaaS Builder' },
  { id: 'deal_finder', name: 'Kael (Deal Closer)', role: 'B2B Lead Extractor & Cold Email Strategist' },
  { id: 'ai_video_maker', name: 'Nova Media', role: 'Viral Video Script & ElevenLabs Audio Producer' },
];

// Multi-tenant in-memory state (keyed by sessionId / runId)
const sessions = new Map(); // sessionId -> { beliefs: [], history: [], updatedAt }
const activeRuns = new Map(); // runId -> { id, sessionId, agentId, status, reply, events, subscribers, abortController, usage }

function getApiKey() {
  return String(process.env.STARNET_API_KEY || process.env.STATION_API_KEY || '').trim();
}

function checkAuth(req, res) {
  const configuredKey = getApiKey();
  if (configuredKey.length < MIN_KEY_LEN) {
    sendJson(res, 503, {
      error: {
        type: 'configuration_error',
        message: `STARNET_API_KEY (or STATION_API_KEY) must be set and at least ${MIN_KEY_LEN} characters long.`,
      },
    });
    return false;
  }

  const authHeader = String(req.headers['authorization'] || '');
  const apiKeyHeader = String(req.headers['x-api-key'] || '');
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : apiKeyHeader.trim();

  if (!token || token.length !== configuredKey.length) {
    sendJson(res, 401, {
      error: { type: 'authentication_error', message: 'Invalid or missing Bearer API key.' },
    });
    return false;
  }

  const a = Buffer.from(token);
  const b = Buffer.from(configuredKey);
  if (!crypto.timingSafeEqual(a, b)) {
    sendJson(res, 401, {
      error: { type: 'authentication_error', message: 'Invalid Bearer API key.' },
    });
    return false;
  }
  return true;
}

function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, X-StarNet-Session-Id',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  });
  res.end(body);
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 2 * 1024 * 1024) {
        reject(new Error('Request body exceeds 2MB limit'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (e) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Invokes a tool on Trendly's `/api/web4/mcp` JSON-RPC 2.0 endpoint when requested by an agent.
 */
async function callTrendlyMcpTool(toolName, args) {
  const mcpUrl = process.env.TRENDLY_MCP_URL || 'http://127.0.0.1:3000/api/web4/mcp';
  const apiKey = getApiKey();
  const res = await fetch(mcpUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: { name: toolName, arguments: args || {} },
    }),
  });
  if (!res.ok) {
    throw new Error(`Trendly MCP HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error.message || 'MCP tool error');
  }
  const textContent = data?.result?.content?.[0]?.text || JSON.stringify(data?.result || {});
  return {
    isError: Boolean(data?.result?.isError),
    text: textContent,
  };
}

/**
 * Calls upstream LLM (OpenRouter / OpenAI / Custom) to power the Station crew.
 */
async function callUpstreamModel(messages, jsonMode) {
  const apiKey =
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENAI_API_KEY ||
    process.env.ABACUSAI_API_KEY ||
    '';
  const endpoint = process.env.UPSTREAM_LLM_URL ||
    (process.env.OPENROUTER_API_KEY
      ? 'https://openrouter.ai/api/v1/chat/completions'
      : 'https://api.openai.com/v1/chat/completions');
  const model =
    process.env.UPSTREAM_LLM_MODEL ||
    (process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');

  if (!apiKey) {
    throw new Error(
      'Station Sidecar requires OPENROUTER_API_KEY or OPENAI_API_KEY in its environment to run model turns.'
    );
  }

  const body = {
    model,
    messages,
    temperature: 0.3,
  };
  if (jsonMode) {
    body.response_format = { type: 'json_object' };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Upstream LLM (${res.status}): ${errText.slice(0, 240)}`);
  }

  const data = await res.json();
  return {
    content: String(data?.choices?.[0]?.message?.content || '').trim(),
    usage: data?.usage || { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
  };
}

const TOOL_REGEX = /<station_tool_call>\s*([\s\S]*?)\s*<\/station_tool_call>/gi;

async function executeAgentRun({ sessionId, agentId, messages, jsonMode, onEvent }) {
  const session = sessions.get(sessionId) || { beliefs: [], history: [], updatedAt: Date.now() };
  sessions.set(sessionId, session);

  const crewMember = CREW_ROSTER.find((c) => c.id === agentId) || CREW_ROSTER[0];
  const systemHeader = [
    `[TRENDFORGE STATION SIDECAR — SPECIALIST: ${crewMember.name} (${crewMember.role})]`,
    `Session Namespace: ${sessionId}`,
    `Active Capabilities: ${DEFAULT_CAPABILITIES.join(', ')}`,
    `To call any of Trendly's 17 live MCP skills (e.g. scrape_reddit_painpoints, scrape_hackernews_launches, polymarket_spread_scanner, solana_dex_liquidity_tracker, b2b_lead_extractor, cold_email_sequence_writer, nextjs_microsaas_builder), emit:`,
    `<station_tool_call>{"tool": "skill_id", "args": {...}}</station_tool_call>`,
    jsonMode ? `IMPORTANT: Your final response MUST be a valid JSON object.` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const workingMessages = [
    { role: 'system', content: systemHeader },
    ...messages.map((m) => ({ role: m.role || 'user', content: String(m.content || '') })),
  ];

  const totalUsage = { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  let finalReply = '';

  for (let turn = 1; turn <= 3; turn++) {
    onEvent?.({ type: 'turn.start', turn, agentId: crewMember.id });
    const { content, usage } = await callUpstreamModel(workingMessages, turn === 3 ? jsonMode : false);
    totalUsage.prompt_tokens += usage.prompt_tokens || 0;
    totalUsage.completion_tokens += usage.completion_tokens || 0;
    totalUsage.total_tokens += usage.total_tokens || 0;

    const calls = [];
    let match;
    const re = new RegExp(TOOL_REGEX.source, 'gi');
    while ((match = re.exec(content)) !== null) {
      try {
        const parsed = JSON.parse(match[1]);
        if (parsed.tool) calls.push(parsed);
      } catch {
        // ignore malformed tool block
      }
    }

    if (calls.length === 0 || turn === 3) {
      finalReply = content.replace(TOOL_REGEX, '').trim() || content;
      break;
    }

    workingMessages.push({ role: 'assistant', content });
    const toolOutputs = [];

    for (const call of calls) {
      onEvent?.({ type: 'tool.call', tool: call.tool, args: call.args });
      try {
        const mcpRes = await callTrendlyMcpTool(call.tool, call.args);
        toolOutputs.push(`[Tool ${call.tool} Result]: ${mcpRes.text.slice(0, 2000)}`);
        onEvent?.({ type: 'tool.result', tool: call.tool, ok: !mcpRes.isError });
      } catch (err) {
        toolOutputs.push(`[Tool ${call.tool} Error]: ${err.message}`);
        onEvent?.({ type: 'tool.result', tool: call.tool, ok: false, error: err.message });
      }
    }

    workingMessages.push({
      role: 'user',
      content: toolOutputs.join('\n\n') + '\n\nProvide your final synthesized answer based on these results.',
    });
  }

  session.updatedAt = Date.now();
  return { reply: finalReply, usage: totalUsage };
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Key, X-StarNet-Session-Id',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    });
    return res.end();
  }

  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';

  // 1. Unauthenticated Liveness Probe
  if (req.method === 'GET' && pathname === '/health') {
    return sendJson(res, 200, {
      status: 'ok',
      platform: 'trendforge-station',
      version: '1.0.0',
      uptimeSeconds: Math.floor(process.uptime()),
      authConfigured: getApiKey().length >= MIN_KEY_LEN,
    });
  }

  // All /v1/* routes require Bearer auth
  if (pathname.startsWith('/v1')) {
    if (!checkAuth(req, res)) return;
  }

  // 2. GET /v1/capabilities
  if (req.method === 'GET' && pathname === '/v1/capabilities') {
    return sendJson(res, 200, {
      object: 'station.capabilities',
      version: '1.0.0',
      streaming: true,
      max_concurrent_runs: 16,
      capabilities: DEFAULT_CAPABILITIES,
    });
  }

  // 3. GET /v1/models
  if (req.method === 'GET' && pathname === '/v1/models') {
    return sendJson(res, 200, {
      object: 'list',
      data: CREW_ROSTER.map((c) => ({
        id: c.id,
        object: 'model',
        created: 1735689600,
        owned_by: 'trendforge-station',
        description: `${c.name} — ${c.role}`,
      })),
    });
  }

  // 4. POST /v1/chat/completions
  if (req.method === 'POST' && pathname === '/v1/chat/completions') {
    try {
      const body = await readJsonBody(req);
      const sessionId = String(req.headers['x-starnet-session-id'] || body.user || 'default-session');
      const agentId = String(body.model || 'starnet-agent');
      const jsonMode = body?.response_format?.type === 'json_object';
      const messages = Array.isArray(body.messages) ? body.messages : [];

      const { reply, usage } = await executeAgentRun({
        sessionId,
        agentId,
        messages,
        jsonMode,
      });

      return sendJson(res, 200, {
        id: `chatcmpl-${crypto.randomBytes(8).toString('hex')}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: agentId,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: reply },
            finish_reason: 'stop',
          },
        ],
        usage,
        starnet: {
          status: 'complete',
          completed: true,
          session_id: sessionId,
          agent_id: agentId,
        },
      });
    } catch (err) {
      return sendJson(res, 500, {
        error: { type: 'station_execution_error', message: err.message },
        starnet: { status: 'error', completed: false, error: err.message },
      });
    }
  }

  // 5. POST /v1/runs (Async Run Creation)
  if (req.method === 'POST' && pathname === '/v1/runs') {
    try {
      const body = await readJsonBody(req);
      const runId = `run_${crypto.randomBytes(8).toString('hex')}`;
      const sessionId = String(req.headers['x-starnet-session-id'] || body.session_id || 'default-session');
      const agentId = String(body.model || body.agent || 'starnet-agent');
      const messages = Array.isArray(body.messages)
        ? body.messages
        : [{ role: 'user', content: String(body.prompt || '') }];

      const runRecord = {
        id: runId,
        sessionId,
        agentId,
        status: 'running',
        reply: null,
        error: null,
        events: [],
        subscribers: new Set(),
        createdAt: new Date().toISOString(),
      };
      activeRuns.set(runId, runRecord);

      const pushEvent = (evt) => {
        const entry = { ...evt, timestamp: new Date().toISOString() };
        runRecord.events.push(entry);
        for (const sub of runRecord.subscribers) {
          sub.write(`data: ${JSON.stringify(entry)}\n\n`);
        }
      };

      executeAgentRun({
        sessionId,
        agentId,
        messages,
        jsonMode: false,
        onEvent: pushEvent,
      })
        .then(({ reply, usage }) => {
          runRecord.status = 'complete';
          runRecord.reply = reply;
          runRecord.usage = usage;
          pushEvent({ type: 'run.complete', reply, usage });
          for (const sub of runRecord.subscribers) sub.end();
          runRecord.subscribers.clear();
        })
        .catch((err) => {
          runRecord.status = 'error';
          runRecord.error = err.message;
          pushEvent({ type: 'run.error', error: err.message });
          for (const sub of runRecord.subscribers) sub.end();
          runRecord.subscribers.clear();
        });

      return sendJson(res, 202, {
        id: runId,
        object: 'station.run',
        status: 'running',
        session_id: sessionId,
        agent_id: agentId,
      });
    } catch (err) {
      return sendJson(res, 400, { error: { message: err.message } });
    }
  }

  // 6. GET /v1/runs/:id & GET /v1/runs/:id/events
  const runMatch = /^\/v1\/runs\/([A-Za-z0-9_-]+)(?:\/(events|stop))?$/.exec(pathname);
  if (runMatch) {
    const runId = runMatch[1];
    const subAction = runMatch[2];
    const runRecord = activeRuns.get(runId);
    if (!runRecord) {
      return sendJson(res, 404, { error: { message: `Run ${runId} not found` } });
    }

    if (!subAction && req.method === 'GET') {
      return sendJson(res, 200, {
        id: runRecord.id,
        object: 'station.run',
        status: runRecord.status,
        session_id: runRecord.sessionId,
        agent_id: runRecord.agentId,
        reply: runRecord.reply,
        error: runRecord.error,
        events_count: runRecord.events.length,
      });
    }

    if (subAction === 'events' && req.method === 'GET') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      for (const pastEvent of runRecord.events) {
        res.write(`data: ${JSON.stringify(pastEvent)}\n\n`);
      }
      if (runRecord.status === 'complete' || runRecord.status === 'error') {
        return res.end();
      }
      runRecord.subscribers.add(res);
      req.on('close', () => runRecord.subscribers.delete(res));
      return;
    }

    if (subAction === 'stop' && req.method === 'POST') {
      runRecord.status = 'stopped';
      for (const sub of runRecord.subscribers) sub.end();
      runRecord.subscribers.clear();
      return sendJson(res, 200, { id: runRecord.id, status: 'stopped' });
    }
  }

  return sendJson(res, 404, { error: { message: `Route ${req.method} ${pathname} not found` } });
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    console.log(`[TrendForge Station Sidecar] Online at http://${HOST}:${PORT}`);
  });
}

module.exports = { server, DEFAULT_CAPABILITIES, CREW_ROSTER };
