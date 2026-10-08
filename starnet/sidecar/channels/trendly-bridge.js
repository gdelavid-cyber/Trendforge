/**
 * trendly-bridge.js — Trendly Visual Agent OS Sidecar Bridge
 *
 * Bridges the local desktop harness (port 8787) with Trendly's Next.js backend,
 * PostgreSQL database, and Jev Decision Layer.
 *
 * Exposes:
 *  - GET /api/trendly/status
 *  - GET /api/trendly/approvals
 *  - POST /api/trendly/approvals/:id/approve
 *  - POST /api/trendly/approvals/:id/reject
 *  - GET /api/trendly/decisions
 *  - GET /api/trendly/calibration
 *  - GET /api/trendly/ledger
 *  - GET /api/trendly/deliverables
 *  - GET /api/trendly/deliverables/:id
 *  - POST /api/trendly/dispatch
 *  - GET /api/trendly/workflows
 *  - POST /api/trendly/workflows
 *  - GET /api/trendly/stream (Server-Sent Events)
 *  - GET /api/trendly/stream/ndjson (NDJSON stream)
 */

'use strict';

const http = require('node:http');
const https = require('node:https');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const TRENDFORGE_API_URL = (process.env.TRENDFORGE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const BRIDGE_SECRET = process.env.TRENDFORGE_BRIDGE_SECRET || process.env.STARNET_BRIDGE_SECRET || '';

// In-memory event ring buffer for reconnect replay
const EVENT_HISTORY_CAP = 500;
const eventRing = [];
const sseClients = new Set();
const ndjsonClients = new Set();

let pollTimer = null;
let upstreamSseReq = null;
let lastSeenDecisionTime = Date.now() - 60000;
let lastSeenRunId = null;

function broadcastEvent(eventType, payload) {
  const event = {
    id: crypto.randomUUID(),
    type: eventType,
    timestamp: Date.now(),
    payload,
  };

  eventRing.push(event);
  if (eventRing.length > EVENT_HISTORY_CAP) eventRing.shift();

  // 1. Broadcast to SSE clients
  const sseData = `id: ${event.id}\nevent: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(sseData);
    } catch (_) {
      sseClients.delete(client);
    }
  }

  // 2. Broadcast to NDJSON clients
  const ndjsonData = JSON.stringify(event) + '\n';
  for (const client of ndjsonClients) {
    try {
      client.write(ndjsonData);
    } catch (_) {
      ndjsonClients.delete(client);
    }
  }

  return event;
}

// Request helper to Trendly
async function callTrendly(apiPath, options = {}) {
  const url = `${TRENDFORGE_API_URL}${apiPath}`;
  const method = options.method || 'GET';
  const body = options.body ? JSON.stringify(options.body) : null;
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {}),
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
    if (BRIDGE_SECRET) {
      const hmac = crypto.createHmac('sha256', BRIDGE_SECRET).update(body).digest('hex');
      headers['X-Trendforge-Signature'] = `sha256=${hmac}`;
    }
  }

  const parsedUrl = new URL(url);
  const client = parsedUrl.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.request(
      url,
      {
        method,
        headers,
        timeout: 8000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const data = raw ? JSON.parse(raw) : null;
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data, raw });
          } catch (_) {
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, data: null, raw });
          }
        });
      }
    );

    req.on('error', (err) => resolve({ ok: false, status: 503, error: err.message }));
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, status: 504, error: 'Upstream timeout' });
    });

    if (body) req.write(body);
    req.end();
  });
}

// Connect to upstream Trendly Station SSE bus if available
function connectUpstreamSse() {
  if (upstreamSseReq) return;

  const streamUrl = `${TRENDFORGE_API_URL}/api/station/stream`;
  const parsed = new URL(streamUrl);
  const client = parsed.protocol === 'https:' ? https : http;

  try {
    upstreamSseReq = client.request(
      streamUrl,
      {
        headers: { Accept: 'text/event-stream' },
        timeout: 0,
      },
      (res) => {
        let buffer = '';
        res.on('data', (chunk) => {
          buffer += chunk.toString('utf8');
          const lines = buffer.split('\n\n');
          buffer = lines.pop(); // keep last chunk

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(':')) continue;
            const match = /^data:\s*(.+)$/m.exec(trimmed);
            if (match) {
              try {
                const parsedData = JSON.parse(match[1]);
                mapAndEmitUpstreamEvent(parsedData);
              } catch (_) {}
            }
          }
        });

        res.on('end', () => {
          upstreamSseReq = null;
          setTimeout(connectUpstreamSse, 5000);
        });
      }
    );

    upstreamSseReq.on('error', () => {
      upstreamSseReq = null;
      setTimeout(connectUpstreamSse, 10000);
    });

    upstreamSseReq.end();
  } catch (_) {
    upstreamSseReq = null;
    setTimeout(connectUpstreamSse, 10000);
  }
}

// Map Trendly runtime events to Visual Agent OS Actions
function mapAndEmitUpstreamEvent(evt) {
  if (!evt) return;

  // 1. Worker start
  if (evt.payload?.event === 'worker.start') {
    broadcastEvent('trendly.worker.start', {
      workerId: evt.payload.agentType,
      runId: evt.runId,
      status: 'active',
      timestamp: evt.timestamp,
    });
  }

  // 2. Worker complete
  else if (evt.type === 'complete' || evt.payload?.event === 'worker.complete') {
    broadcastEvent('trendly.task.complete', {
      workerId: evt.payload.agentType,
      runId: evt.runId,
      result: evt.payload.result,
      durationMs: evt.payload.durationMs,
      timestamp: evt.timestamp,
    });
  }

  // 3. Worker failure
  else if (evt.type === 'error' || evt.payload?.event === 'worker.error') {
    broadcastEvent('trendly.task.failed', {
      workerId: evt.payload.agentType,
      runId: evt.runId,
      error: evt.payload.error,
      timestamp: evt.timestamp,
    });
  }

  // 4. Jev Decision Gate executed
  else if (evt.payload?.event === 'jev.decision') {
    broadcastEvent('trendly.jev.gate', {
      gateType: evt.payload.gateType,
      workerId: evt.payload.agentId || 'reddit_scraper',
      primitive: evt.payload.primitive,
      question: evt.payload.question,
      answer: evt.payload.answer,
      actionTaken: evt.payload.actionTaken,
      confidence: evt.payload.answer?.confidence ?? evt.payload.answer?.probability ?? 0.9,
      probability: evt.payload.answer?.probability ?? 0.85,
      latencyMs: evt.payload.latencyMs,
      timestamp: evt.timestamp,
    });
  }

  // 5. Guard triggered
  else if (evt.payload?.event === 'guard.triggered') {
    broadcastEvent('trendly.guard.triggered', {
      gateType: evt.payload.gateType,
      workerId: evt.payload.agentId || 'micro_saas_builder',
      reason: evt.payload.question || 'System safety guard limit reached',
      actionTaken: evt.payload.actionTaken || 'blocked',
      timestamp: evt.timestamp,
    });
  }

  // 6. Approval required
  else if (evt.payload?.event === 'approval.required') {
    broadcastEvent('trendly.approval.required', {
      approvalId: evt.payload.approvalId,
      workerId: 'micro_saas_builder',
      title: evt.payload.title,
      action: evt.payload.action,
      stepIndex: evt.payload.stepIndex,
      timestamp: evt.timestamp,
    });
  }

  // 7. Ledger entry written
  else if (evt.payload?.event === 'ledger.entry') {
    broadcastEvent('trendly.ledger.entry', {
      agentId: evt.payload.agentId,
      amountUsdc: evt.payload.amountUsdc,
      type: evt.payload.type,
      ref: evt.payload.ref,
      note: evt.payload.note,
      timestamp: evt.timestamp,
    });
  }
}

// Background polling for state changes that might happen outside SSE
async function pollTrendlyState() {
  try {
    // 1. Check decisions
    const decRes = await callTrendly(`/api/observability/export?limit=5`);
    if (decRes.ok && decRes.data?.decisions) {
      for (const dec of decRes.data.decisions) {
        const decTime = new Date(dec.createdAt).getTime();
        if (decTime > lastSeenDecisionTime) {
          lastSeenDecisionTime = decTime;
          broadcastEvent('trendly.jev.gate', {
            gateType: dec.gateType,
            workerId: dec.agentId || 'reddit_scraper',
            primitive: dec.primitive,
            question: dec.question,
            answer: dec.answer,
            actionTaken: dec.actionTaken,
            confidence: dec.answer?.confidence ?? dec.answer?.probability ?? 0.9,
            probability: dec.answer?.probability ?? 0.85,
            latencyMs: dec.latencyMs,
            timestamp: decTime,
          });

          if (dec.actionTaken === 'blocked') {
            broadcastEvent('trendly.guard.triggered', {
              gateType: dec.gateType,
              workerId: dec.agentId || 'reddit_scraper',
              reason: dec.question,
              actionTaken: dec.actionTaken,
              timestamp: decTime,
            });
          }
        }
      }
    }

    // 2. Check pending approvals
    const appRes = await callTrendly('/api/approvals/list');
    if (appRes.ok && appRes.data?.pending && appRes.data.pending.length > 0) {
      for (const app of appRes.data.pending) {
        broadcastEvent('trendly.approval.required', {
          approvalId: app.id,
          workerId: 'micro_saas_builder',
          title: app.action?.title || 'Execution Step Approval',
          action: app.action,
          stepIndex: app.stepIndex,
          timestamp: new Date(app.createdAt).getTime(),
        });
      }
    }
  } catch (_) {}
}

function startBackgroundSync() {
  connectUpstreamSse();
  if (!pollTimer) {
    pollTimer = setInterval(pollTrendlyState, 8000);
  }
}

// Express/Node HTTP router mount
function mount(req, res, parsedUrl) {
  const p = parsedUrl.pathname;

  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Trendforge-Signature');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return true;
  }

  // 1. SSE Stream
  if (p === '/api/trendly/stream' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    });

    sseClients.add(res);

    // Send initial connected event + replay recent events
    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now(), clientCount: sseClients.size })}\n\n`);
    for (const evt of eventRing) {
      res.write(`id: ${evt.id}\nevent: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`);
    }

    req.on('close', () => sseClients.delete(res));
    return true;
  }

  // 2. NDJSON Stream
  if (p === '/api/trendly/stream/ndjson' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/x-ndjson',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    ndjsonClients.add(res);
    for (const evt of eventRing) {
      res.write(JSON.stringify(evt) + '\n');
    }

    req.on('close', () => ndjsonClients.delete(res));
    return true;
  }

  // 3. Worker Status
  if (p === '/api/trendly/status' && req.method === 'GET') {
    callTrendly('/api/status').then((r) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        ok: true,
        sidecar: 'online',
        stationId: process.env.STARNET_STATION_ID || 'local-station-01',
        upstream: r.ok ? 'connected' : 'disconnected',
        upstreamStatus: r.status,
        timestamp: Date.now(),
      }));
    });
    return true;
  }

  // 4. Approvals
  if (p === '/api/trendly/approvals' && req.method === 'GET') {
    callTrendly('/api/approvals/list').then((r) => {
      res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
      res.end(r.raw || JSON.stringify({ ok: false }));
    });
    return true;
  }

  // 5. Approve
  const approveMatch = /^\/api\/trendly\/approvals\/([^/]+)\/approve$/.exec(p);
  if (approveMatch && req.method === 'POST') {
    const approvalId = approveMatch[1];
    callTrendly('/api/approvals/approve', { method: 'POST', body: { approvalId } }).then((r) => {
      if (r.ok) {
        broadcastEvent('trendly.task.approved', { approvalId, status: 'approved' });
      }
      res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
      res.end(r.raw || JSON.stringify({ ok: false }));
    });
    return true;
  }

  // 6. Reject
  const rejectMatch = /^\/api\/trendly\/approvals\/([^/]+)\/reject$/.exec(p);
  if (rejectMatch && req.method === 'POST') {
    const approvalId = rejectMatch[1];
    readJsonBody(req).then((body) => {
      callTrendly('/api/approvals/reject', { method: 'POST', body: { approvalId, reason: body.reason } }).then((r) => {
        if (r.ok) {
          broadcastEvent('trendly.task.rejected', { approvalId, status: 'rejected' });
        }
        res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
        res.end(r.raw || JSON.stringify({ ok: false }));
      });
    });
    return true;
  }

  // 7. Decisions Log
  if (p === '/api/trendly/decisions' && req.method === 'GET') {
    const q = parsedUrl.search || '';
    callTrendly(`/api/observability/export${q}`).then((r) => {
      res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
      res.end(r.raw || JSON.stringify({ ok: false }));
    });
    return true;
  }

  // 8. Calibration Snapshots
  if (p === '/api/trendly/calibration' && req.method === 'GET') {
    const q = parsedUrl.search || '';
    callTrendly(`/api/observability/calibration${q}`).then((r) => {
      res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
      res.end(r.raw || JSON.stringify({ ok: false }));
    });
    return true;
  }

  // 9. Ledger
  if (p === '/api/trendly/ledger' && req.method === 'GET') {
    const q = parsedUrl.search || '';
    callTrendly(`/api/trendforge/ledger${q}`).then((r) => {
      res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
      res.end(r.raw || JSON.stringify({ ok: false }));
    });
    return true;
  }

  // 10. Help Me Help U (HMHU) Symbiotic Protocol Bridge
  if (p === '/api/trendly/hmhu' && req.method === 'GET') {
    const q = parsedUrl.search || '';
    callTrendly(`/api/station/hmhu${q}`).then((r) => {
      res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
      res.end(r.raw || JSON.stringify({ ok: false }));
    });
    return true;
  }

  if (p === '/api/trendly/hmhu/respond' && req.method === 'POST') {
    readJsonBody(req).then((body) => {
      callTrendly('/api/station/hmhu/respond', { method: 'POST', body }).then((r) => {
        res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
        res.end(r.raw || JSON.stringify({ ok: false }));
      });
    });
    return true;
  }


  // 10. Deliverables List & Downloads
  if (p === '/api/trendly/deliverables' && req.method === 'GET') {
    // Collect deliverables from completed jobs & task artifacts
    callTrendly('/api/trendforge/ledger').then((ledgerRes) => {
      const deliverables = [];
      if (ledgerRes.data?.records) {
        for (const rec of ledgerRes.data.records) {
          deliverables.push({
            id: rec.jobId,
            name: `Job Artifact: ${rec.jobId.slice(0, 8)}`,
            workerId: 'reddit_scraper',
            kind: 'FILE',
            costCents: rec.costCents,
            completedAt: rec.completedAt,
            downloadUrl: `/api/trendly/deliverables/${rec.jobId}/download`,
          });
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, deliverables }));
    });
    return true;
  }

  const downloadMatch = /^\/api\/trendly\/deliverables\/([^/]+)\/download$/.exec(p);
  if (downloadMatch && req.method === 'GET') {
    const deliverableId = downloadMatch[1];
    callTrendly(`/api/trendforge/runs/${deliverableId}`).then((r) => {
      if (r.ok && r.data?.artifact) {
        res.writeHead(200, {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="deliverable-${deliverableId}.json"`,
        });
        res.end(JSON.stringify(r.data.artifact, null, 2));
      } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Deliverable not found' }));
      }
    });
    return true;
  }

  // 11. Dispatch Worker Task
  if (p === '/api/trendly/dispatch' && req.method === 'POST') {
    readJsonBody(req).then((body) => {
      callTrendly('/api/trendforge/dispatch', { method: 'POST', body }).then((r) => {
        if (r.ok && r.data?.jobId) {
          broadcastEvent('trendly.worker.start', {
            workerId: (body.tools && body.tools[0]) || 'reddit_scraper',
            runId: r.data.jobId,
            goal: body.agentGoal,
            status: 'running',
          });
        }
        res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
        res.end(r.raw || JSON.stringify({ ok: false }));
      });
    });
    return true;
  }

  // 12. Workflows
  if (p === '/api/trendly/workflows' && req.method === 'GET') {
    callTrendly('/api/workflows').then((r) => {
      res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
      res.end(r.raw || JSON.stringify({ ok: false }));
    });
    return true;
  }

  if (p === '/api/trendly/workflows' && req.method === 'POST') {
    readJsonBody(req).then((body) => {
      callTrendly('/api/workflows', { method: 'POST', body }).then((r) => {
        if (r.ok) {
          broadcastEvent('trendly.workflow.created', { workflow: r.data });
        }
        res.writeHead(r.status || 200, { 'Content-Type': 'application/json' });
        res.end(r.raw || JSON.stringify({ ok: false }));
      });
    });
    return true;
  }

  return false;
}

function readJsonBody(req) {
  return new Promise((resolve) => {
    let chunks = '';
    req.on('data', (c) => (chunks += c));
    req.on('end', () => {
      try {
        resolve(chunks ? JSON.parse(chunks) : {});
      } catch (_) {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

// Auto-start sync on load
startBackgroundSync();

module.exports = {
  mount,
  broadcastEvent,
  startBackgroundSync,
};
