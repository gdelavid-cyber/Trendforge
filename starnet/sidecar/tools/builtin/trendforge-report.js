/**
 * trendforge-report.js — StarNet tool: trendforge_update
 *
 * Lets an agent mid-run post status + artifacts directly to Trendforge's
 * venture/fulfillment API without waiting for run completion.
 */

'use strict';

const crypto = require('crypto');

const BRIDGE_SECRET  = process.env.TRENDFORGE_BRIDGE_SECRET || '';
const TRENDFORGE_URL = (process.env.TRENDFORGE_API_URL || '').replace(/\/$/, '');

function signPayload(body) {
  if (!BRIDGE_SECRET) return '';
  return 'sha256=' + crypto.createHmac('sha256', BRIDGE_SECRET).update(body).digest('hex');
}

/**
 * Tool definition — consumed by StarNet's tool registry.
 */
const TOOL_DEF = {
  name: 'trendforge_update',
  description: [
    'Report progress or a completed artifact back to the Trendforge Venture OS.',
    'Use this to update fulfillment status, attach file artifacts, or record findings',
    'during a venture execution job. Only works when the station was dispatched by Trendforge.',
  ].join(' '),
  input_schema: {
    type: 'object',
    properties: {
      ventureId: {
        type: 'string',
        description: 'The Trendforge venture ID this job belongs to.',
      },
      fulfillmentOrderId: {
        type: 'string',
        description: 'The FulfillmentOrder ID to update (optional).',
      },
      status: {
        type: 'string',
        enum: ['IN_PROGRESS', 'MILESTONE_REACHED', 'QA_PASSED', 'DELIVERED', 'FAILED'],
        description: 'Current execution status to report.',
      },
      summary: {
        type: 'string',
        description: 'Human-readable summary of what was accomplished.',
      },
      artifactUrl: {
        type: 'string',
        description: 'URL or path to a produced artifact (file, repo, deployment URL).',
      },
      evidence: {
        type: 'object',
        description: 'Structured evidence object (test results, QA scores, metrics).',
        additionalProperties: true,
      },
    },
    required: ['ventureId', 'status', 'summary'],
  },
};

/**
 * Execute the tool — called by StarNet's tool runner.
 *
 * @param {object} input   Tool input (validated against TOOL_DEF.input_schema)
 * @param {object} context StarNet run context { jobId, runId, ... }
 * @returns {Promise<{ content: Array }>}
 */
async function execute(input, context) {
  if (!TRENDFORGE_URL) {
    return { content: [{ type: 'text', text: '[trendforge_update] TRENDFORGE_API_URL not configured — update skipped.' }] };
  }

  const payload = JSON.stringify({
    ventureId:          input.ventureId,
    fulfillmentOrderId: input.fulfillmentOrderId || null,
    status:             input.status,
    summary:            input.summary,
    artifactUrl:        input.artifactUrl || null,
    evidence:           input.evidence   || {},
    starnetRunId:       context?.runId   || null,
    starnetJobId:       context?.jobId   || null,
    reportedAt:         new Date().toISOString(),
  });

  try {
    const res = await fetch(TRENDFORGE_URL + '/api/starnet/progress', {
      method: 'POST',
      headers: {
        'Content-Type':          'application/json',
        'X-Starnet-Signature':   signPayload(payload),
        'X-Starnet-Station-Id':  process.env.STARNET_STATION_ID || 'local',
      },
      body: payload,
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return { content: [{ type: 'text', text: '[trendforge_update] API error ' + res.status + ': ' + text }] };
    }

    const data = await res.json().catch(() => ({}));
    return {
      content: [{
        type: 'text',
        text: '[trendforge_update] ✓ Reported to Trendforge. ventureId=' + input.ventureId + ' status=' + input.status + '. Response: ' + JSON.stringify(data),
      }],
    };
  } catch (err) {
    return { content: [{ type: 'text', text: '[trendforge_update] Network error: ' + (err && err.message ? err.message : String(err)) }] };
  }
}

module.exports = { TOOL_DEF, execute };
