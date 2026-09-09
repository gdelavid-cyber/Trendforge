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

    def __init__(self, max_per_sub: int = 10, use_stealth: bool = True):
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
        """Scrape a single subreddit. Tries Scrapling stealth route first to bypass datacenter 403s."""
        if self.use_stealth:
            stealth_results = self._try_stealth_route(subreddit)
            if stealth_results:
                return stealth_results

        return self._json_scrape(subreddit)

    def _try_stealth_route(self, subreddit: str) -> List[Dict]:
        try:
            from scrapling import StealthyFetcher

            fetcher = StealthyFetcher()
            page = fetcher.fetch(
                f"https://www.reddit.com/r/{subreddit}/hot/",
                headless=True,
                network_idle=True,
                timeout=45000,
            )
            signals: List[Dict] = []
            for post in page.css("shreddit-post")[: self.max_per_sub]:
                title_el = post.css_first("a[slot='title']") or post.css_first("[slot=title]")
                if not title_el:
                    continue
                title = title_el.text().strip()
                if not title:
                    continue
                href = title_el.attrib.get("href") or post.attrib.get("permalink") or ""
                pid = (post.attrib.get("id") or "").replace("t3_", "")
                score = int(post.attrib.get("score") or 0)
                signals.append(
                    self.normalize_signal(
                        source="reddit",
                        subreddit=f"r/{subreddit}",
                        external_id=pid or href,
                        title=title,
                        url=href if href.startswith("http") else f"https://reddit.com{href}",
                        upvotes=score,
                    )
                )
            return signals
        except ImportError:
            print("    [Reddit] scrapling not installed, falling back to JSON API")
            return []
        except Exception as e:
            print(f"    [Reddit] Stealth route failed on r/{subreddit}: {e}")
            return []

    def _json_scrape(self, subreddit: str) -> List[Dict]:
        signals: List[Dict] = []
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            }
            url = f"https://www.reddit.com/r/{subreddit}/hot.json?limit={self.max_per_sub}&raw_json=1"
            response = self.session.get(url, headers=headers, timeout=12)
            if response.status_code != 200:
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
            print(f"    [Reddit] JSON scrape error on r/{subreddit}: {e}")
        return signals
