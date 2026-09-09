"""Reddit scraper: JSON API primary, Scrapling stealth fallback."""
import time
from typing import Dict, List

import requests

from .base import BaseScraper


class RedditScraper(BaseScraper):
    source = "reddit"

    SUBREDDITS = {
        "smb_contractors": ["smallbusiness", "sweatystartup", "roofing", "HVAC", "electricians", "plumbing"],
        "agency_b2b": ["agency", "b2bmarketing", "freelance", "consulting", "sales", "marketing"],
        "saas_automation": ["SaaS", "automation", "nocode", "SideProject", "artificial", "MachineLearning"],
        "growth_startup": ["Entrepreneur", "startups", "growthhacking", "digitalmarketing", "indiehackers"],
    }

    def __init__(self, max_per_sub: int = 10, use_stealth: bool = False):
        self.max_per_sub = max_per_sub
        self.use_stealth = use_stealth
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json",
            }
        )

    def scrape(self) -> List[Dict]:
        all_signals: List[Dict] = []
        for _category, subs in self.SUBREDDITS.items():
            for sub in subs:
                try:
                    signals = self._scrape_subreddit(sub)
                    all_signals.extend(signals)
                    print(f"  [Reddit] r/{sub}: {len(signals)} signals harvested")
                    time.sleep(2)
                except Exception as e:
                    print(f"  [Reddit] r/{sub}: ERROR - {e}")
        return all_signals[:60]

    def _scrape_subreddit(self, subreddit: str) -> List[Dict]:
        signals: List[Dict] = []
        try:
            url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={self.max_per_sub}"
            response = self.session.get(url, timeout=15)
            if response.status_code == 429:
                time.sleep(10)
                response = self.session.get(url, timeout=15)
            if response.status_code != 200:
                if self.use_stealth:
                    return self._stealth_scrape(subreddit)
                return []
            posts = response.json().get("data", {}).get("children", [])
            for post in posts:
                d = post.get("data", {})
                if d.get("stickied"):
                    continue
                score = d.get("score", 0)
                if score < 2:
                    continue
                title = (d.get("title") or "").strip()
                if not title:
                    continue
                signals.append(
                    self.normalize_signal(
                        source="reddit",
                        external_id=d.get("id", ""),
                        title=title,
                        url=f"https://reddit.com{d.get('permalink', '')}",
                        body=(d.get("selftext") or "")[:2000] or None,
                        author=d.get("author"),
                        upvotes=score,
                        comments=d.get("num_comments", 0),
                        subreddit=f"r/{subreddit}",
                    )
                )
        except Exception as e:
            print(f"    Request error on r/{subreddit}: {e}")
        return signals

    def _stealth_scrape(self, subreddit: str) -> List[Dict]:
        try:
            from scrapling import StealthyFetcher

            fetcher = StealthyFetcher()
            page = fetcher.fetch(f"https://www.reddit.com/r/{subreddit}/")
            signals: List[Dict] = []
            for post in page.css("shreddit-post")[: self.max_per_sub]:
                title_el = post.css_first("a[slot='title']")
                if not title_el:
                    continue
                title = title_el.text().strip()
                href = title_el.attrib.get("href", "")
                post_id = post.attrib.get("id", "").replace("t3_", "")
                signals.append(
                    self.normalize_signal(
                        source="reddit",
                        external_id=post_id,
                        title=title,
                        url=f"https://reddit.com{href}" if href.startswith("/") else href,
                        subreddit=f"r/{subreddit}",
                    )
                )
            return signals
        except ImportError:
            print("    scrapling not available for stealth mode")
            return []
        except Exception as e:
            print(f"    Stealth scrape failed: {e}")
            return []
