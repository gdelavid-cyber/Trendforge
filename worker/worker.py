#!/usr/bin/env python3
"""
Standalone Python Scrapling worker for Trendly pipeline ingestion.
Pushes measured signals directly into Trendly via /api/pipeline/ingest.
"""

import os
import sys
import time
import json
from datetime import datetime, timezone
import requests
from dotenv import load_dotenv

load_dotenv()

TRENDLY_URL = os.getenv("TRENDLY_URL", "http://localhost:3000").rstrip("/")
PIPELINE_API_KEY = os.getenv("PIPELINE_API_KEY")

# 4 Distinct rotating channel pools covering real commercial B2B demand
# Replicated exactly from lib/pipeline/index.ts
REDDIT_SCRAPING_CHANNELS = [
    {
        "category": "SMB & Contractor Demand",
        "subreddits": ["smallbusiness", "sweatystartup", "roofing", "HVAC"],
        "queries": ["software alternative", "hiring someone to", "missed calls", "expensive agency"],
    },
    {
        "category": "Agency & B2B Arbitrage",
        "subreddits": ["agency", "b2bmarketing", "freelance", "consulting", "sales"],
        "queries": ["willing to pay", "looking for a service", "lead generation tool", "manual reporting"],
    },
    {
        "category": "Automation & Workflow Bottlenecks",
        "subreddits": ["SaaS", "automation", "nocode", "SideProject", "artificial"],
        "queries": ["built a tool for", "workflow bottlenecks", "Stripe checkout", "API integration"],
    },
    {
        "category": "High-Growth Ventures",
        "subreddits": ["Entrepreneur", "startups", "growthhacking", "digitalmarketing"],
        "queries": ["hire developer", "outsource manual task", "customer churn", "paying for tool"],
    },
]


def fetch_reddit_posts(subreddits, category_name):
    """Fetch Reddit posts using Scrapling StealthyFetcher or fallback HTTP requests."""
    posts = []

    # 1. Primary: Scrapling StealthyFetcher with modern shreddit-post extraction
    try:
        from scrapling.fetchers import StealthyFetcher
        sf = StealthyFetcher()
        for sub in subreddits[:2]:
            url = f"https://www.reddit.com/r/{sub}/"
            try:
                res = sf.fetch(url, headless=True)
                if res and res.status == 200:
                    shreddit_posts = res.css("shreddit-post")
                    for p in shreddit_posts:
                        title = p.attrib.get("post-title")
                        if not title:
                            continue
                        post_id = p.attrib.get("id") or p.attrib.get("data-post-id") or ""
                        if post_id.startswith("t3_"):
                            post_id = post_id[3:]
                        try:
                            score = int(p.attrib.get("score", 0))
                        except (ValueError, TypeError):
                            score = 0
                        try:
                            num_comments = int(p.attrib.get("comment-count", 0))
                        except (ValueError, TypeError):
                            num_comments = 0
                        permalink = p.attrib.get("permalink", "")
                        created_timestamp = p.attrib.get("created-timestamp", "")
                        posts.append({
                            "id": post_id,
                            "title": title,
                            "score": score,
                            "num_comments": num_comments,
                            "subreddit": sub,
                            "permalink": permalink,
                            "created_timestamp": created_timestamp,
                        })
            except Exception as sub_err:
                print(f"[WORKER] StealthyFetcher on r/{sub} notice: {sub_err}", file=sys.stderr)
        if posts:
            return posts
    except Exception as e:
        print(f"[WORKER] Scrapling StealthyFetcher notice: {e}", file=sys.stderr)

    # 2. Secondary fallback: HTTP requests on old.reddit.com / www.reddit.com JSON
    sub_list = "+".join(subreddits)
    for base in ["https://old.reddit.com", "https://www.reddit.com"]:
        url = f"{base}/r/{sub_list}/hot.json?limit=25"
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "application/json",
        }
        try:
            res = requests.get(url, headers=headers, timeout=8)
            if res.status_code == 200:
                data = res.json()
                raw_children = data.get("data", {}).get("children", [])
                for child in raw_children:
                    cdata = child.get("data", {})
                    posts.append({
                        "id": cdata.get("id"),
                        "title": cdata.get("title"),
                        "score": cdata.get("score", 0),
                        "num_comments": cdata.get("num_comments", 0),
                        "subreddit": cdata.get("subreddit", sub_list.split("+")[0]),
                        "permalink": cdata.get("permalink", ""),
                        "created_utc": cdata.get("created_utc"),
                        "selftext": cdata.get("selftext", ""),
                    })
                return posts
        except Exception:
            continue

    return posts


def scrape_reddit():
    """Scrape Reddit based on 15-minute channel pool rotation."""
    channel_idx = int(time.time() / (60 * 15)) % len(REDDIT_SCRAPING_CHANNELS)
    channel = REDDIT_SCRAPING_CHANNELS[channel_idx]
    posts = fetch_reddit_posts(channel["subreddits"], channel["category"])

    signals = []
    now = time.time()
    for p in posts:
        title = p.get("title")
        if not title or p.get("over_18"):
            continue
        score = p.get("score", 0)
        num_comments = p.get("num_comments", 0)
        if score < 5 and num_comments < 3:
            continue

        created_ts = p.get("created_timestamp")
        if created_ts:
            try:
                dt = datetime.fromisoformat(created_ts.replace("Z", "+00:00"))
                created_utc = dt.timestamp()
            except Exception:
                created_utc = now
        else:
            created_utc = p.get("created_utc") or now

        hours_since = max(0.1, (now - created_utc) / 3600.0)
        mention_velocity = round((score + num_comments) / hours_since, 2)
        subreddit = p.get("subreddit", "all")
        permalink = p.get("permalink", "")
        url = f"https://reddit.com{permalink}" if permalink else "https://reddit.com"

        post_id = p.get("id")
        if not post_id:
            parts = [seg for seg in permalink.strip("/").split("/") if seg]
            if "comments" in parts:
                idx = parts.index("comments")
                if idx + 1 < len(parts):
                    post_id = parts[idx + 1]
            if not post_id:
                post_id = str(abs(hash(title)))

        signals.append({
            "source": "Reddit",
            "externalId": str(post_id),
            "title": title.strip(),
            "name": title.strip(),
            "sourcePlatforms": ["Reddit", f"r/{subreddit}"],
            "body": (p.get("selftext") or title).strip()[:2000],
            "description": (p.get("selftext") or title).strip()[:400],
            "url": url,
            "mentionVelocity": mention_velocity,
            "hoursSinceDetection": round(hours_since, 2),
            "score": score,
            "comments": num_comments,
        })

    return signals


def scrape_hacker_news():
    """Scrape HackerNews Firebase top stories with score > 20 using concurrent workers."""
    from concurrent.futures import ThreadPoolExecutor

    signals = []
    try:
        top_res = requests.get("https://hacker-news.firebaseio.com/v0/topstories.json", timeout=10)
        if top_res.status_code != 200:
            print(f"[WORKER] HN topstories returned {top_res.status_code}", file=sys.stderr)
            return []
        story_ids = top_res.json()[:20]
    except Exception as exc:
        print(f"[WORKER] HN topstories error: {exc}", file=sys.stderr)
        return []

    def fetch_item(sid):
        try:
            r = requests.get(f"https://hacker-news.firebaseio.com/v0/item/{sid}.json", timeout=6)
            return r.json() if r.status_code == 200 else None
        except Exception:
            return None

    with ThreadPoolExecutor(max_workers=10) as executor:
        items = list(filter(None, executor.map(fetch_item, story_ids)))

    now = time.time()
    for item in items:
        if not item or not item.get("title"):
            continue
        score = item.get("score", 0)
        if score <= 20:
            continue

        item_time = item.get("time", now)
        hours_since = max(0.1, (now - item_time) / 3600.0)
        descendants = item.get("descendants", 0)
        mention_velocity = round((score + descendants) / hours_since, 2)
        sid = item.get("id")
        url = item.get("url") or f"https://news.ycombinator.com/item?id={sid}"

        signals.append({
            "source": "HackerNews",
            "externalId": str(sid),
            "title": item["title"].strip(),
            "name": item["title"].strip(),
            "sourcePlatforms": ["HackerNews"],
            "body": f"HackerNews discussion ({score} points, {descendants} comments): {url}",
            "description": f"HackerNews discussion ({score} points, {descendants} comments): {url}",
            "url": url,
            "mentionVelocity": mention_velocity,
            "hoursSinceDetection": round(hours_since, 2),
            "score": score,
            "comments": descendants,
        })

    return signals


def main():
    if not PIPELINE_API_KEY:
        print("[WORKER] ERROR: PIPELINE_API_KEY environment variable is required.", file=sys.stderr)
        sys.exit(1)

    print(f"[WORKER] Starting scrape cycle at {datetime.now(timezone.utc).isoformat()}")
    reddit_signals = scrape_reddit()
    hn_signals = scrape_hacker_news()

    all_signals = reddit_signals + hn_signals
    # Cap at 60 measured signals per payload
    payload_signals = all_signals[:60]

    print(f"[WORKER] Gathered {len(reddit_signals)} Reddit signals, {len(hn_signals)} HN signals. Payload size: {len(payload_signals)} signals.")

    headers = {
        "Authorization": f"Bearer {PIPELINE_API_KEY}",
        "Content-Type": "application/json",
    }

    # Step 3 & 4: Ingest signals into RawSignals, then trigger cluster pass
    for path in ("/api/pipeline/ingest", "/api/pipeline/cluster"):
        payload = {"signals": payload_signals} if "ingest" in path else {}
        try:
            r = requests.post(f"{TRENDLY_URL}{path}", json=payload, headers=headers, timeout=120)
            print(f"[WORKER] {path} → {r.status_code}: {r.text[:300]}")
            if r.status_code not in (200, 201) and "ingest" in path:
                print(f"[WORKER] Ingest failed, aborting cycle.", file=sys.stderr)
                sys.exit(1)
        except Exception as exc:
            print(f"[WORKER] Request to {path} failed: {exc}", file=sys.stderr)
            if "ingest" in path:
                sys.exit(1)

    sys.exit(0)


if __name__ == "__main__":
    main()

