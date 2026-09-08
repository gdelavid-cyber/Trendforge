# Trendly Autonomous Scrapling Worker

Autonomous ingestion worker for Trendly. Runs as a single-shot cron process that scrapes live Reddit B2B channels and HackerNews top stories, measures signal velocity without fabrication, and POSTs structured signals directly to `/api/pipeline/ingest`.

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `TRENDLY_URL` | Base URL of your Trendly deployment | `https://trendly.example.com` or `http://localhost:3000` |
| `PIPELINE_API_KEY` | Secret UUID key matching `PIPELINE_API_KEY` configured in Trendly | `c0a80123-4567-89ab-cdef-0123456789ab` |

## Deployment Options

### 1. Render Cron Job
- **Environment:** Docker
- **Dockerfile Path:** `./worker/Dockerfile`
- **Schedule:** `*/15 * * * *` (every 15 minutes)
- **Command:** `python worker.py`
- Set `TRENDLY_URL` and `PIPELINE_API_KEY` in Render Environment Variables.

### 2. Railway Cron
- Deploy repository with Root Directory set to `worker`.
- Add a Cron schedule `*/15 * * * *`.
- Set `TRENDLY_URL` and `PIPELINE_API_KEY` in Railway Variables.

### 3. GitHub Actions Cron
Create `.github/workflows/scrapling-worker.yml`:
```yaml
name: Scrapling Ingestion Worker
on:
  schedule:
    - cron: '*/15 * * * *'
  workflow_dispatch:

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          sudo apt-get update && sudo apt-get install -y libgtk-3-0 libdbus-glib-1-2 libxt6 bzip2
          pip install -r worker/requirements.txt
          scrapling install
      - name: Run Worker
        env:
          TRENDLY_URL: ${{ secrets.TRENDLY_URL }}
          PIPELINE_API_KEY: ${{ secrets.PIPELINE_API_KEY }}
        run: python worker/worker.py
```

## Local Execution
```bash
cd worker
pip install -r requirements.txt
export TRENDLY_URL="http://localhost:3000"
export PIPELINE_API_KEY="your-pipeline-api-key"
python worker.py
```
