---
name: nova
description: Talk to Nova, the Trendly OS interface, from an opencode session. Read live user state and propose tool actions for human approval.
---

# Nova Skill (Direction B)

Nova is the interface to the entire Trendly system. From an opencode session you can **read** Nova state and **propose** Nova actions for a user. Approvals stay human, session-bound, in the widget/console inbox — this skill can never approve, reject, or execute gated tools.

## Auth

Every call needs the service key in a header (never query string):

- Header: `x-nova-key: $NOVA_SERVICE_KEY`
- Base: `$NOVA_BASE_URL` (e.g. `http://localhost:3100`, never commit keys)
- User scope: `?userId=<id>` (required — the key alone identifies nothing)

Fail-closed: no key configured server-side, wrong key, or missing userId all deny.

## Endpoints

```bash
# Live briefing: wallet, credits, quota, swarm, trends, insights. Free.
curl -H "x-nova-key: $NOVA_SERVICE_KEY" "$NOVA_BASE_URL/api/nova/briefing?userId=<id>"

# Action inbox + tool catalog (same auth + userId)
curl -H "x-nova-key: $NOVA_SERVICE_KEY" "$NOVA_BASE_URL/api/nova/actions?userId=<id>"

# Propose a gated tool (202 + actionId; human approves in Nova inbox)
curl -X POST -H "x-nova-key: $NOVA_SERVICE_KEY" -H "Content-Type: application/json" \
  -d '{"tool":"worker.run","params":{"agentType":"reddit_scraper"}}' \
  "$NOVA_BASE_URL/api/nova/actions?userId=<id>"

# Immediate tools run at once (side-effect-free only): swarm.status, outreach.draft
curl -X POST -H "x-nova-key: $NOVA_SERVICE_KEY" -H "Content-Type: application/json" \
  -d '{"tool":"outreach.draft","params":{"business":"Acme","offer":"videos"}}' \
  "$NOVA_BASE_URL/api/nova/actions?userId=<id>"
```

Tool catalog: `swarm.status`, `outreach.draft` (immediate) · `worker.run`, `grant.claim`, `monitor.create` (approval-gated).

## CLI shortcut

`npx tsx scripts/nova/nova.ts briefing --user <id>` · `propose --user <id> --tool worker.run --params '{"agentType":"reddit_scraper"}'` · `actions --user <id>`

## Rules for sessions

1. Read before proposing — attach the briefing numbers to every proposal.
2. Never claim an action ran. PROPOSED means waiting, not done. Poll `actions` for EXECUTED + receipt.
3. Never ask for, log, or transmit `x-nova-key`. It lives in env, not chat.
4. Estimates stay labeled estimates, even in session notes.
