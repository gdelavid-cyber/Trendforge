/**
 * trendforge.js — Trendforge Bridge Channel
 *
 * Allows a remote Trendforge instance to dispatch jobs to this StarNet station
 * and receive verified run artifacts + cost evidence back via webhook.
 */

'use strict';

const crypto = require('crypto');

const BRIDGE_SECRET  = process.env.TRENDFORGE_BRIDGE_SECRET || '';
const TRENDFORGE_URL = (process.env.TRENDFORGE_API_URL || '').replace(/\/$/, '');
const MAX_PAYLOAD_BYTES = 64 * 1024;

function verifySignature(rawBody, signatureHeader) {
  if (!BRIDGE_SECRET) return true; // open if no secret configured
  if (!signatureHeader) return false;
  const [scheme, digest] = signatureHeader.split('=');
  if (scheme !== 'sha256' || !digest) return false;
  try {
    const expected = crypto.createHmac('sha256', BRIDGE_SECRET).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(digest, 'hex'), Buffer.from(expected, 'hex'));
  } catch { return false; }
}

function signPayload(body) {
  if (!BRIDGE_SECRET) return '';
  return 'sha256=' + crypto.createHmac('sha256', BRIDGE_SECRET).update(body).digest('hex');
}

/** @type {Map<string, object>} */
const _jobs = new Map();

function createJob(payload) {
  const id = crypto.randomUUID();
  const job = {
    id,
    ventureId:          payload.ventureId          || '',
    fulfillmentOrderId: payload.fulfillmentOrderId || null,
    taskId:             payload.taskId             || null,
    agentGoal:          payload.agentGoal          || '',
    tools:              payload.tools              || [],
    model:              payload.model              || process.env.STARNET_DEFAULT_MODEL || 'nvidia/nemotron-3.5-lightning:free',
    callbackUrl:        payload.callbackUrl        || null,
    status:             'PENDING',
    starnetRunId:       null,
    costCents:          null,
    artifact:           null,
    createdAt:          new Date().toISOString(),
    completedAt:        null,
  };
  _jobs.set(id, job);
  return job;
}

async function fireCallback(job) {
  const url = job.callbackUrl || (TRENDFORGE_URL ? (TRENDFORGE_URL + '/api/starnet/complete') : null);
  if (!url) return;
  const body = JSON.stringify({
    jobId: job.id, ventureId: job.ventureId,
    fulfillmentOrderId: job.fulfillmentOrderId, taskId: job.taskId,
    starnetRunId: job.starnetRunId, status: job.status,
    costCents: job.costCents, artifact: job.artifact, completedAt: job.completedAt,
  });
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Starnet-Signature': signPayload(body),
        'X-Starnet-Station-Id': process.env.STARNET_STATION_ID || 'local',
      },
      body,
    });
    if (!res.ok) console.error('[trendforge] callback ' + res.status + ' to ' + url);
  } catch (err) {
    console.error('[trendforge] callback error: ' + err.message);
  }
}

async function handleDispatch(req, res, { runAgent }) {
  let rawBody = '';
  try { rawBody = await readBody(req, MAX_PAYLOAD_BYTES); }
  catch { return res.writeHead(413).end('Payload too large'); }
  if (!verifySignature(rawBody, req.headers['x-trendforge-signature'] || '')) {
    return res.writeHead(401).end('Invalid signature');
  }
  let payload;
  try { payload = JSON.parse(rawBody); }
  catch { return res.writeHead(400).end('Invalid JSON'); }
  if (!payload.agentGoal) return res.writeHead(422).end('agentGoal required');

  const job = createJob(payload);
  job.status = 'RUNNING';

  setImmediate(async () => {
    try {
      const result = await runAgent({
        goal: job.agentGoal, tools: job.tools, model: job.model,
        context: { ventureId: job.ventureId, fulfillmentOrderId: job.fulfillmentOrderId, taskId: job.taskId, jobId: job.id },
      });
      job.starnetRunId = result.runId    || null;
      job.costCents    = result.costCents || 0;
      job.artifact     = result.artifact  || null;
      job.status       = result.success ? 'COMPLETE' : 'FAILED';
    } catch (err) {
      console.error('[trendforge] run error job=' + job.id + ': ' + err.message);
      job.status = 'FAILED';
    }
    job.completedAt = new Date().toISOString();
    await fireCallback(job);
  });

  res.writeHead(202, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ jobId: job.id, status: 'RUNNING' }));
}

function handleGetRun(req, res, jobId) {
  const job = _jobs.get(jobId);
  if (!job) return res.writeHead(404).end('Job not found');
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(job));
}

function handleGetLedger(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const sinceTs = url.searchParams.get('since') ? new Date(url.searchParams.get('since')).getTime() : 0;
  const records = [];
  for (const job of _jobs.values()) {
    if (job.status !== 'COMPLETE') continue;
    const completedTs = job.completedAt ? new Date(job.completedAt).getTime() : 0;
    if (completedTs >= sinceTs) records.push({
      jobId: job.id, ventureId: job.ventureId,
      fulfillmentOrderId: job.fulfillmentOrderId, starnetRunId: job.starnetRunId,
      costCents: job.costCents, completedAt: job.completedAt,
    });
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ records }));
}

function handleHealth(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'ok', stationId: process.env.STARNET_STATION_ID || 'local',
    version: require('../../package.json').version, ts: new Date().toISOString(),
  }));
}

function mount(req, res, url, deps) {
  const path = url.pathname;
  if (path === '/api/trendforge/health' && req.method === 'GET') { handleHealth(req, res); return true; }
  if (path === '/api/trendforge/dispatch' && req.method === 'POST') {
    handleDispatch(req, res, deps).catch(err => { console.error('[trendforge]', err); if (!res.headersSent) res.writeHead(500).end(); });
    return true;
  }
  if (path === '/api/trendforge/ledger' && req.method === 'GET') { handleGetLedger(req, res); return true; }
  const runMatch = path.match(/^\/api\/trendforge\/runs\/([^/]+)$/);
  if (runMatch && req.method === 'GET') { handleGetRun(req, res, runMatch[1]); return true; }
  return false;
}

function readBody(req, maxBytes) {
  return new Promise((resolve, reject) => {
    const chunks = []; let total = 0;
    req.on('data', chunk => { total += chunk.length; if (total > maxBytes) return reject(new Error('too large')); chunks.push(chunk); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

module.exports = { mount, createJob, fireCallback };
