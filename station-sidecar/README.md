# TrendForge Station Sidecar (`@trendforge/station-sidecar`)

The standalone, cloud-ready **TrendForge Station Sidecar** daemon (`http://0.0.0.0:8787`).

## How It Upgrades Vanilla StarNet (`starnetos.com`)
1. **No Localhost-Only Lock:** Binds to `0.0.0.0` and accepts cloud/tunnel `Host` headers (secured via timing-safe Bearer `STARNET_API_KEY` >= 16 chars).
2. **Zero `capdenied` Deadlocks:** All 14 station capabilities (`compute`, `web_fetch`, `web_scrape`, `quant_intel`, `lead_intel`, `code_exec`, `memory_store`, `agent_spawn`, etc.) come pre-provisioned out of the box.
3. **Multi-Tenant Isolation:** Honors `X-StarNet-Session-Id` (`trendly-<userId>-<taskId>`) to isolate sessions across users.
4. **Automatic Trendly MCP 2024-11-05 Bridge:** Connects directly to Trendly's `/api/web4/mcp` JSON-RPC gateway so crew specialists can invoke all 17 real Web4 skills.

## Quick Start

```bash
cd station-sidecar
export STARNET_API_KEY="trendforge-station-secret-key-2026"
export OPENROUTER_API_KEY="sk-or-v1-..." # or OPENAI_API_KEY
export TRENDLY_MCP_URL="http://localhost:3000/api/web4/mcp"
npm start
```
