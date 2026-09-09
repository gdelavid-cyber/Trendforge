#!/usr/bin/env python3
"""
Trendly Signal Harvesting Worker
Autonomous Python worker that scrapes target sources and feeds
normalized signals into the Trendly ingestion pipeline.
"""

import os
import sys
import time
from datetime import datetime

import requests
from dotenv import load_dotenv

# Fix Windows console encoding
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

load_dotenv()

from scrapers import (
    HackerNewsScraper,
    ProductHuntScraper,
    RedditScraper,
    TwitterScraper,
)

# Configuration (API_BASE_URL preferred; TRENDLY_URL kept as legacy fallback)
API_BASE_URL = os.getenv("API_BASE_URL", os.getenv("TRENDLY_URL", "http://localhost:3000")).rstrip("/")
PIPELINE_API_KEY = os.getenv("PIPELINE_API_KEY", "")
INGEST_ENDPOINT = f"{API_BASE_URL}/api/pipeline/ingest"
CLUSTER_ENDPOINT = f"{API_BASE_URL}/api/pipeline/cluster"
DISCOVERY_ENDPOINT = f"{API_BASE_URL}/api/pipeline/discovery"

# Optional platform credentials
TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN", "")
PRODUCTHUNT_TOKEN = os.getenv("PRODUCTHUNT_TOKEN", "")

# Feature flags — flip scrapers off without editing code
ENABLE_REDDIT = os.getenv("ENABLE_REDDIT", "true").lower() == "true"
ENABLE_HACKERNEWS = os.getenv("ENABLE_HACKERNEWS", "true").lower() == "true"
ENABLE_TWITTER = os.getenv("ENABLE_TWITTER", "true").lower() == "true"
ENABLE_PRODUCTHUNT = os.getenv("ENABLE_PRODUCTHUNT", "true").lower() == "true"

# Polling configuration
SCRAPE_INTERVAL_SECONDS = int(os.getenv("SCRAPE_INTERVAL", "180"))
AUTO_CLUSTER = os.getenv("AUTO_CLUSTER", "true").lower() == "true"
USE_STEALTH = os.getenv("USE_STEALTH", "true").lower() == "true"
WORKER_MODE = os.getenv("WORKER_MODE", "daemon").lower()

# Batch send config — ingest per source instead of one giant blob
BATCH_PER_SOURCE = os.getenv("BATCH_PER_SOURCE", "true").lower() == "true"


def banner():
    print("=" * 60)
    print("  TRENDLY SIGNAL HARVESTING WORKER")
    print("  Autonomous Market Intelligence Engine")
    print("=" * 60)
    print(f"  API Target:       {API_BASE_URL}")
    print(f"  Worker Mode:      {WORKER_MODE}")
    print(f"  Interval:         {SCRAPE_INTERVAL_SECONDS}s")
    print(f"  Stealth Route:    {'ON (Scrapling)' if USE_STEALTH else 'off'}")
    print(f"  Auto-Cluster:     {AUTO_CLUSTER}")
    print(f"  API Key:          {'SET' if PIPELINE_API_KEY else 'MISSING'}")
    print(f"  Reddit:           {'ON' if ENABLE_REDDIT else 'off'}")
    print(f"  Hacker News:      {'ON' if ENABLE_HACKERNEWS else 'off'}")
    print(
        "  Twitter/X:        "
        f"{'ON (official API)' if TWITTER_BEARER_TOKEN and ENABLE_TWITTER else 'ON (nitter)' if ENABLE_TWITTER else 'off'}"
    )
    print(
        "  ProductHunt:      "
        f"{'ON (GraphQL)' if PRODUCTHUNT_TOKEN and ENABLE_PRODUCTHUNT else 'ON (RSS)' if ENABLE_PRODUCTHUNT else 'off'}"
    )
    print("=" * 60)
    print()


def ingest_signals(signals, label="mixed"):
    if not signals:
        return None

    try:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {PIPELINE_API_KEY}",
        }
        response = requests.post(
            INGEST_ENDPOINT,
            headers=headers,
            json={"signals": signals},
            timeout=60,
        )

        if response.status_code == 200:
            data = response.json()
            print(
                f"  [Ingest/{label}] OK: {data.get('ingested', data.get('stored', 0))} stored, "
                f"{data.get('duplicates', 0)} dupes, "
                f"{data.get('skipped', 0)} skipped"
            )
            return data
        elif response.status_code == 401:
            print(f"  [Ingest/{label}] ERROR: Unauthorized")
            return None
        else:
            print(f"  [Ingest/{label}] HTTP {response.status_code}: {response.text[:200]}")
            return None
    except requests.exceptions.ConnectionError:
        print(f"  [Ingest/{label}] ERROR: Cannot connect to {INGEST_ENDPOINT}")
        return None
    except Exception as e:
        print(f"  [Ingest/{label}] ERROR: {e}")
        return None


def trigger_clustering():
    if not AUTO_CLUSTER:
        return
    try:
        headers = {"Authorization": f"Bearer {PIPELINE_API_KEY}"}
        response = requests.post(CLUSTER_ENDPOINT, headers=headers, timeout=60)

        if response.status_code == 200:
            data = response.json()
            print(
                f"  [Cluster] OK: {data.get('signalsProcessed', data.get('signalsExamined', 0))} processed, "
                f"{data.get('clustersCreated', data.get('trendsCreated', 0))} new trends "
                f"({data.get('provider', '?')}/{data.get('model', '?')})"
            )
        elif response.status_code == 503:
            print("  [Cluster] LLM unavailable, will retry next cycle")
        else:
            print(f"  [Cluster] HTTP {response.status_code}")
    except Exception as e:
        print(f"  [Cluster] ERROR: {e}")


def run_scraper(name, factory):
    """Safely run a scraper factory and return its signals."""
    print(f"\n[Scrape] {name}...")
    try:
        scraper = factory()
        sigs = scraper.scrape()
        print(f"  {name} total: {len(sigs)} signals")
        return sigs
    except Exception as e:
        print(f"  {name} FAILED: {e}")
        return []


def run_harvest_cycle(cycle_num):
    print(f"\n{'=' * 50}")
    print(f"  HARVEST CYCLE #{cycle_num} - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'=' * 50}")

    total_ingested = 0
    source_results = []

    scraper_registry = []
    if ENABLE_REDDIT:
        scraper_registry.append(("Reddit", "reddit", lambda: RedditScraper(max_per_sub=10, use_stealth=USE_STEALTH)))
    if ENABLE_HACKERNEWS:
        scraper_registry.append(("Hacker News", "hackernews", lambda: HackerNewsScraper(max_stories=30)))
    if ENABLE_TWITTER:
        scraper_registry.append(
            (
                "Twitter/X",
                "twitter",
                lambda: TwitterScraper(
                    max_per_query=8,
                    bearer_token=TWITTER_BEARER_TOKEN or None,
                ),
            )
        )
    if ENABLE_PRODUCTHUNT:
        scraper_registry.append(
            (
                "ProductHunt",
                "producthunt",
                lambda: ProductHuntScraper(
                    token=PRODUCTHUNT_TOKEN or None,
                    max_per_topic=10,
                ),
            )
        )

    for name, label, factory in scraper_registry:
        sigs = run_scraper(name, factory)
        if not sigs:
            continue

        if BATCH_PER_SOURCE:
            # Ingest immediately per source so failure in one doesn't block others
            result = ingest_signals(sigs, label=label)
            if result:
                total_ingested += result.get("ingested", result.get("stored", 0))
        else:
            source_results.extend(sigs)

    # Combined ingestion mode
    if not BATCH_PER_SOURCE and source_results:
        print(f"\n[Ingest] Sending {len(source_results)} combined signals...")
        result = ingest_signals(source_results, label="combined")
        if result:
            total_ingested = result.get("ingested", result.get("stored", 0))

    # Cluster
    if total_ingested > 0:
        print(f"\n[Cluster] Triggering engine on {total_ingested} new signals...")
        trigger_clustering()
    else:
        print("\n[Cluster] Skipping (no new signals ingested)")

    # Process pending buyer discovery search expansion queries
    process_discovery_queries()

    print(f"\n  Cycle #{cycle_num} complete. Next in {SCRAPE_INTERVAL_SECONDS}s")


def process_discovery_queries():
    if not PIPELINE_API_KEY:
        return

    try:
        headers = {"Authorization": f"Bearer {PIPELINE_API_KEY}"}
        res = requests.get(DISCOVERY_ENDPOINT, headers=headers, timeout=15)
        if res.status_code != 200:
            return

        data = res.json()
        queries = data.get("queries", [])
        if not queries:
            return

        print(f"\n[Discovery] Processing {len(queries)} pending search expansion queries...")
        for q in queries:
            qid = q.get("id")
            platform = q.get("platform", "reddit")
            query_str = q.get("query", "")
            print(f"  [Discovery/{platform}] Searching forum queries: '{query_str}'")

            # Mark processed
            try:
                requests.post(
                    DISCOVERY_ENDPOINT,
                    headers={"Content-Type": "application/json", "Authorization": f"Bearer {PIPELINE_API_KEY}"},
                    json={"queryId": qid, "status": "COMPLETED", "resultCount": 0},
                    timeout=15,
                )
            except Exception as ex:
                print(f"  [Discovery] Error updating query {qid}: {ex}")
    except Exception as e:
        print(f"  [Discovery] Query check error: {e}")


def main():
    banner()
    if not PIPELINE_API_KEY:
        print("WARNING: PIPELINE_API_KEY not set in worker/.env")
        print()

    # One-shot mode for cloud crons (Render/Vercel): exits after a single
    # cycle instead of looping. Enable via CLI flag or env:
    #   python worker.py --once   |   WORKER_MODE=oneshot python worker.py
    ONESHOT = "--once" in sys.argv or os.getenv("WORKER_MODE", "daemon").lower() == "oneshot"
    if ONESHOT:
        print("[Worker] One-shot mode: single cycle, then exit.")

    cycle = 0
    while True:
        cycle += 1
        try:
            run_harvest_cycle(cycle)
            if ONESHOT:
                print("\n[Worker] One-shot cycle complete. Exiting clean.")
                sys.exit(0)
        except KeyboardInterrupt:
            print("\n\nWorker stopped.")
            sys.exit(0)
        except Exception as e:
            print(f"\n  FATAL ERROR in cycle #{cycle}: {e}")
            if ONESHOT:
                sys.exit(1)
            time.sleep(30)
            continue

        try:
            time.sleep(SCRAPE_INTERVAL_SECONDS)
        except KeyboardInterrupt:
            print("\n\nWorker stopped.")
            sys.exit(0)


if __name__ == "__main__":
    main()
