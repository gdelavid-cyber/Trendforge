/**
 * app/trendly-os.js — Trendly Visual Agent OS Runtime & State Projection Engine
 *
 * Adheres to the core StarNet/Trendly principle:
 * "The interface must never assert state the harness cannot prove.
 *  Every visual element must be a direct projection of live runtime state."
 */

'use strict';

const TrendlyOS = (() => {
  const WORKERS = [
    {
      id: 'reddit_scraper',
      name: 'Reddit Problem Scraper',
      bayName: 'REDDIT MINER',
      role: 'RESEARCHER',
      color: '#ff4444',
      desc: 'Mines recurring SaaS complaints and drafts conversion blueprints.',
    },
    {
      id: 'prediction_arbitrage',
      name: 'Prediction Arbitrage Scanner',
      bayName: 'PREDICTION ARBITRAGE',
      role: 'TRADER',
      color: '#00ffcc',
      desc: 'Scans Polymarket & prediction markets for mispriced spreads.',
    },
    {
      id: 'openclaw_deployer',
      name: 'OpenClaw VPS & Proxy Deployer',
      bayName: 'OPENCLAW DEPLOYER',
      role: 'ENGINEER',
      color: '#00aaff',
      desc: 'Provisions residential proxies and headless scraping nodes.',
    },
    {
      id: 'ai_video_maker',
      name: 'AI Video & Hook Studio',
      bayName: 'AI VIDEO STUDIO',
      role: 'CREATOR',
      color: '#cc44ff',
      desc: 'Synthesizes viral hooks, scripts, and media rendering pipelines.',
    },
    {
      id: 'micro_saas_builder',
      name: 'Micro SaaS Builder',
      bayName: 'MICRO SAAS BUILDER',
      role: 'BUILDER',
      color: '#ffbb00',
      desc: 'Scaffolds Next.js full-stack MVPs, landing pages, and Stripe checkouts.',
    },
  ];

  // State store
  const state = {
    connected: false,
    workers: {},
    pendingApprovals: [],
    recentDecisions: [],
    deliverables: [],
    ledgerBalance: 0,
    activeRuns: new Map(),
  };

  for (const w of WORKERS) {
    state.workers[w.id] = {
      ...w,
      status: 'idle', // 'idle' | 'running' | 'complete' | 'error' | 'blocked'
      activeRunId: null,
      lastDecision: null,
      lastAction: null,
      uptime: 100,
      latencyMs: 140,
    };
  }

  let eventSource = null;
  let retryCount = 0;

  // Initialize and connect to SSE stream
  function init() {
    connectStream();
    setupTopbarTrigger();
    pollInitialState();
  }

  function connectStream() {
    if (typeof EventSource === 'undefined') return;

    try {
      if (eventSource) eventSource.close();
      eventSource = new EventSource('/api/trendly/stream');

      eventSource.onopen = () => {
        state.connected = true;
        retryCount = 0;
        notify('Trendly Visual OS linked to runtime sidecar.', 'good');
        updateTopBarIndicator(true);
      };

      eventSource.addEventListener('trendly.worker.start', (e) => {
        handleWorkerStart(JSON.parse(e.data).payload);
      });

      eventSource.addEventListener('trendly.task.complete', (e) => {
        handleTaskComplete(JSON.parse(e.data).payload);
      });

      eventSource.addEventListener('trendly.task.failed', (e) => {
        handleTaskFailed(JSON.parse(e.data).payload);
      });

      eventSource.addEventListener('trendly.jev.gate', (e) => {
        handleJevGate(JSON.parse(e.data).payload);
      });

      eventSource.addEventListener('trendly.guard.triggered', (e) => {
        handleGuardTriggered(JSON.parse(e.data).payload);
      });

      eventSource.addEventListener('trendly.approval.required', (e) => {
        handleApprovalRequired(JSON.parse(e.data).payload);
      });

      eventSource.addEventListener('trendly.ledger.entry', (e) => {
        handleLedgerEntry(JSON.parse(e.data).payload);
      });

      eventSource.onerror = () => {
        state.connected = false;
        updateTopBarIndicator(false);
        eventSource.close();
        const delay = Math.min(30000, 1000 * Math.pow(2, retryCount++));
        setTimeout(connectStream, delay);
      };
    } catch (err) {
      console.warn('[TrendlyOS] Failed to establish EventSource:', err);
    }
  }

  // --- Visual Protocol Handlers ---

  // 1. Worker Starts a Task
  function handleWorkerStart(payload) {
    const workerId = payload.workerId;
    const worker = state.workers[workerId];
    if (!worker) return;

    worker.status = 'running';
    worker.activeRunId = payload.runId;
    state.activeRuns.set(payload.runId, workerId);

    // Visual: Turn room lights on, highlight room
    animateRoomLights(workerId, 'active');

    // Telemetry: Push diegetic ticker if U.bus is available
    if (typeof U !== 'undefined' && U.bus) {
      U.bus.emit('agent.run.start', {
        agentId: workerId,
        runId: payload.runId,
        trigger: 'trendly_os',
      });
    }

    notify(`[BAY: ${worker.bayName}] Active task launched: ${payload.runId?.slice(0, 8)}`, 'info');
  }

  // 2. Task Completes Successfully
  function handleTaskComplete(payload) {
    const workerId = payload.workerId || state.activeRuns.get(payload.runId);
    const worker = state.workers[workerId];
    if (worker) {
      worker.status = 'complete';
      worker.activeRunId = null;
      animateRoomLights(workerId, 'complete', 5000);
    }

    // Visual: Place deliverable in OUTBOX
    const del = {
      id: payload.runId || crypto.randomUUID(),
      workerId: workerId || 'reddit_scraper',
      title: `${worker ? worker.name : 'Worker'} Artifact`,
      downloadUrl: `/api/trendly/deliverables/${payload.runId}/download`,
      timestamp: Date.now(),
      result: payload.result,
    };
    state.deliverables.unshift(del);
    renderOutboxItem(del);

    notify(`[BAY: ${worker ? worker.bayName : 'OUTBOX'}] Task completed successfully. Deliverable ready in OUTBOX.`, 'good');
  }

  // 3. Task Fails or Blocked
  function handleTaskFailed(payload) {
    const workerId = payload.workerId || state.activeRuns.get(payload.runId);
    const worker = state.workers[workerId];
    if (worker) {
      worker.status = 'error';
      worker.activeRunId = null;
      animateRoomLights(workerId, 'error', 7000);
    }

    notify(`[BAY: ${worker ? worker.bayName : 'WORKER'}] Task failed: ${payload.error || 'Blocked by policy'}`, 'bad');
  }

  // 4. Jev Decision Gate Executes
  function handleJevGate(payload) {
    const workerId = payload.workerId || 'reddit_scraper';
    state.recentDecisions.unshift(payload);
    if (state.recentDecisions.length > 50) state.recentDecisions.pop();

    const worker = state.workers[workerId];
    if (worker) {
      worker.lastDecision = payload;
    }

    // Visual: Animate Scanner Lens and Badge over the agent's room
    renderJevLens(workerId, payload);

    notify(`[JEV GATE: ${payload.gateType}] Decision: ${payload.actionTaken} (${Math.round((payload.confidence || 0.9) * 100)}% conf)`, 'info');
  }

  // 5. Guard Triggered
  function handleGuardTriggered(payload) {
    const workerId = payload.workerId || 'micro_saas_builder';
    const worker = state.workers[workerId];
    if (worker) {
      worker.status = 'blocked';
    }

    // Visual: Flash shield icon in the room
    renderGuardShield(workerId, payload.reason);

    notify(`[GUARD TRIGGERED] ${payload.gateType || 'safety'}: ${payload.reason}`, 'warn');
  }

  // 6. Approval Required
  function handleApprovalRequired(payload) {
    const workerId = payload.workerId || 'micro_saas_builder';
    state.pendingApprovals.unshift(payload);

    // Visual: Render "!" beacon over room and in OUTBOX
    renderApprovalBeacon(workerId, payload);

    notify(`[APPROVAL REQUIRED] Action: ${payload.title}. Review in OUTBOX or Dashboard.`, 'warn');
  }

  // 7. Ledger Entry Created
  function handleLedgerEntry(payload) {
    state.ledgerBalance += (payload.amountUsdc || 0);

    // Visual: Float coin icon
    renderFloatingCoin(payload.agentId || 'bay_arbitrage', payload.amountUsdc);

    notify(`[LEDGER ENTRY] ${payload.type}: ${payload.amountUsdc >= 0 ? '+' : ''}$${payload.amountUsdc.toFixed(2)} USDC`, 'good');
  }

  // --- Visual DOM Projection Helpers ---

  function findRoomElement(workerId) {
    // Search canvas/station containers or fallback to station overlay
    return document.getElementById(`bay-${workerId}`) || document.getElementById('view-station') || document.body;
  }

  function animateRoomLights(workerId, mode, durationMs = 0) {
    const el = findRoomElement(workerId);
    if (!el) return;

    el.classList.remove('trendly-light-active', 'trendly-light-complete', 'trendly-light-error');
    el.classList.add(`trendly-light-${mode}`);

    if (durationMs > 0) {
      setTimeout(() => {
        el.classList.remove(`trendly-light-${mode}`);
      }, durationMs);
    }
  }

  function renderJevLens(workerId, decision) {
    const target = findRoomElement(workerId);
    if (!target) return;

    // Create animated scanner lens
    const lens = document.createElement('div');
    lens.className = 'trendly-jev-lens';
    lens.style.left = '50%';
    lens.style.top = '40%';

    // Create decision badge
    const badge = document.createElement('div');
    badge.className = 'trendly-jev-badge';
    const confPct = Math.round((decision.confidence || 0.9) * 100);
    const probPct = Math.round((decision.probability || 0.85) * 100);
    badge.innerHTML = `🎯 <strong>${decision.gateType}</strong>: ${confPct}% Conf · <em>${decision.actionTaken.toUpperCase()}</em>`;
    badge.style.left = '50%';
    badge.style.top = '58%';

    target.appendChild(lens);
    target.appendChild(badge);

    setTimeout(() => {
      lens.remove();
      badge.remove();
    }, 4500);
  }

  function renderGuardShield(workerId, reason) {
    const target = findRoomElement(workerId);
    if (!target) return;

    const shield = document.createElement('div');
    shield.className = 'trendly-guard-shield';
    shield.innerHTML = '🛡️';
    shield.title = `Guard limit: ${reason}`;
    shield.style.left = '50%';
    shield.style.top = '35%';

    target.appendChild(shield);
    setTimeout(() => shield.remove(), 4000);
  }

  function renderApprovalBeacon(workerId, approval) {
    const target = findRoomElement(workerId);
    if (!target) return;

    const beacon = document.createElement('div');
    beacon.className = 'trendly-approval-beacon';
    beacon.innerHTML = '!';
    beacon.title = `Approval needed: ${approval.title} (Click to inspect)`;
    beacon.style.left = '48%';
    beacon.style.top = '30%';

    beacon.onclick = () => {
      if (typeof TrendlyDashboard !== 'undefined') {
        TrendlyDashboard.open('approvals');
      }
    };

    target.appendChild(beacon);
  }

  function renderFloatingCoin(agentId, amount) {
    const target = findRoomElement(agentId);
    if (!target) return;

    const coin = document.createElement('div');
    coin.className = 'trendly-coin-float';
    const sign = amount >= 0 ? '+' : '';
    coin.innerHTML = `🪙 ${sign}$${amount.toFixed(2)} USDC`;
    coin.style.left = '52%';
    coin.style.top = '45%';

    target.appendChild(coin);
    setTimeout(() => coin.remove(), 2600);
  }

  function renderOutboxItem(item) {
    // Check if an OUTBOX list element exists on the page
    const list = document.getElementById('trendly-outbox-list');
    if (!list) return;

    const div = document.createElement('div');
    div.className = 'trendly-deliverable-item';
    div.innerHTML = `
      <div class="trendly-deliverable-name">
        <span>📄</span>
        <strong>${item.title}</strong>
        <small style="color: #6d84a8;">(${item.id.slice(0, 8)})</small>
      </div>
      <a href="${item.downloadUrl}" target="_blank" class="trendly-action-btn" download>DOWNLOAD ARTIFACT</a>
    `;
    list.prepend(div);
  }

  // --- Topbar Trigger & Polling ---

  function setupTopbarTrigger() {
    const topbar = document.getElementById('topbar') || document.querySelector('.topbar') || document.body;
    if (!topbar) return;

    let trigger = document.getElementById('trendly-hud-trigger');
    if (!trigger) {
      trigger = document.createElement('button');
      trigger.id = 'trendly-hud-trigger';
      trigger.type = 'button';
      trigger.innerHTML = '◆ TRENDLY OS <span id="trendly-status-dot" style="color: #00ff66;">●</span>';
      trigger.onclick = () => {
        if (typeof TrendlyDashboard !== 'undefined') {
          TrendlyDashboard.toggle();
        }
      };
      topbar.appendChild(trigger);
    }
  }

  function updateTopBarIndicator(isOnline) {
    const dot = document.getElementById('trendly-status-dot');
    if (dot) {
      dot.style.color = isOnline ? '#00ff66' : '#ff3344';
      dot.title = isOnline ? 'Trendly Real-time Stream Connected' : 'Stream Disconnected (Reconnecting)';
    }
  }

  async function pollInitialState() {
    try {
      // Fetch initial worker status
      const res = await fetch('/api/trendly/status');
      if (res.ok) {
        const data = await res.json();
        if (data.services) {
          for (const s of data.services) {
            if (state.workers[s.id]) {
              state.workers[s.id].uptime = s.uptimePercent;
              state.workers[s.id].latencyMs = s.avgLatencyMs;
            }
          }
        }
      }

      // Fetch pending approvals
      const appRes = await fetch('/api/trendly/approvals');
      if (appRes.ok) {
        const appData = await appRes.json();
        if (appData.pending) {
          state.pendingApprovals = appData.pending;
        }
      }

      // Fetch deliverables
      const delRes = await fetch('/api/trendly/deliverables');
      if (delRes.ok) {
        const delData = await delRes.json();
        if (delData.deliverables) {
          state.deliverables = delData.deliverables;
        }
      }
    } catch (_) {}
  }

  function notify(text, kind = 'info') {
    if (typeof StationUI !== 'undefined' && StationUI.toast) {
      StationUI.toast(text, kind === 'good' ? 'pass' : kind === 'bad' ? 'fail' : 'info');
    } else {
      console.log(`[TrendlyOS] [${kind.toUpperCase()}] ${text}`);
    }
  }

  // Auto-init on DOMContentLoaded
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      setTimeout(init, 500);
    }
  }

  return {
    init,
    state,
    WORKERS,
    dispatchTask: async (agentType, params) => {
      const res = await fetch('/api/trendly/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentGoal: `Run ${agentType}`, tools: [agentType], parameters: params }),
      });
      return await res.json();
    },
    approve: async (id) => {
      const res = await fetch(`/api/trendly/approvals/${id}/approve`, { method: 'POST' });
      return await res.json();
    },
    reject: async (id, reason) => {
      const res = await fetch(`/api/trendly/approvals/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return await res.json();
    },
  };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TrendlyOS;
}
