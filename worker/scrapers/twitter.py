"""Twitter/X scraper: official API v2 if bearer token set, else Nitter rotation, else stealth."""
import re
import time
from typing import Dict, List, Optional
from urllib.parse import quote

import requests

from .base import BaseScraper


class TwitterScraper(BaseScraper):
    """
    Scrapes Twitter/X for business signals.

    Strategy:
      1. If bearer_token set -> official v2 recent search API.
      2. Otherwise -> rotating Nitter instances (no auth).
      3. If Nitter fails and use_stealth -> Scrapling stealth fetch of x.com search.
    """

    source = "twitter"

    # Nitter instance rotation (public mirrors)
    NITTER_INSTANCES = [
        "https://nitter.privacyredirect.com",
        "https://nitter.poast.org",
        "https://nitter.tiekoetter.com",
        "https://nitter.space",
        "https://xcancel.com",
    ]

    # Search queries mapped to categories
    SEARCH_QUERIES = {
        "micro_saas": [
            '"looking for a tool" -filter:replies min_faves:5',
            '"is there a saas" -filter:replies min_faves:5',
            '"wish there was an app" -filter:replies min_faves:3',
            '"someone should build" -filter:replies min_faves:5',
        ],
        "agency_pain": [
            '"agency owner" struggling -filter:replies min_faves:5',
            '"cold email" not working -filter:replies min_faves:3',
            '"client acquisition" -filter:replies min_faves:5',
        ],
        "automation": [
            '"automate this" -filter:replies min_faves:3',
            '"n8n workflow" -filter:replies min_faves:2',
            '"zapier alternative" -filter:replies min_faves:3',
        ],
        "indie_hackers": [
            '"just launched" MRR -filter:replies min_faves:10',
            '"built in public" -filter:replies min_faves:10',
            '"first paying customer" -filter:replies min_faves:5',
        ],
        "developer_tools": [
            '"dev tool" needed -filter:replies min_faves:5',
            '"AI wrapper" -filter:replies min_faves:5',
        ],
    }

    def __init__(
        self,
        max_per_query: int = 8,
        bearer_token: Optional[str] = None,
        use_stealth: bool = False,
    ):
        self.max_per_query = max_per_query
        self.bearer_token = bearer_token
        self.use_stealth = use_stealth
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
            }
        )
        self._working_nitter: Optional[str] = None

    def scrape(self) -> List[Dict]:
        """Run all searches and return normalized signals."""
        all_signals: List[Dict] = []
        seen_ids = set()

        for category, queries in self.SEARCH_QUERIES.items():
            for query in queries:
                try:
                    signals = self._search(query, category)
                    for sig in signals:
                        if sig["externalId"] not in seen_ids:
                            seen_ids.add(sig["externalId"])
                            all_signals.append(sig)
                    print(f"  [Twitter/{category}] '{query[:40]}...': {len(signals)} signals")
                    time.sleep(1.5)
                except Exception as e:
                    print(f"  [Twitter/{category}] ERROR on '{query[:40]}...': {e}")
                    continue

        return all_signals[:60]

    def _search(self, query: str, category: str) -> List[Dict]:
        """Route to correct backend based on availability."""
        if self.bearer_token:
            return self._search_official(query, category)
        return self._search_nitter(query, category)

    # ---------- Official API path ----------

    def _search_official(self, query: str, category: str) -> List[Dict]:
        """Use Twitter API v2 recent search."""
        try:
            url = "https://api.twitter.com/2/tweets/search/recent"
            params = {
                "query": query,
                "max_results": self.max_per_query,
                "tweet.fields": "public_metrics,created_at,author_id",
                "expansions": "author_id",
                "user.fields": "username",
            }
            headers = {"Authorization": f"Bearer {self.bearer_token}"}
            resp = self.session.get(url, params=params, headers=headers, timeout=15)

            if resp.status_code == 429:
                print("    Twitter API rate limited")
                return []
            if resp.status_code != 200:
                print(f"    Twitter API HTTP {resp.status_code}")
                return []

            data = resp.json()
            tweets = data.get("data", [])
            users = {u["id"]: u["username"] for u in data.get("includes", {}).get("users", [])}

            signals = []
            for t in tweets:
                metrics = t.get("public_metrics", {})
                author = users.get(t.get("author_id"), "unknown")
                signals.append(
                    self.normalize_signal(
                        source="twitter",
                        subreddit=f"query:{category}",
                        external_id=t["id"],
                        title=t["text"][:280],
                        url=f"https://twitter.com/{author}/status/{t['id']}",
                        author=author,
                        upvotes=metrics.get("like_count", 0),
                        comments=metrics.get("reply_count", 0),
                    )
                )
            return signals
        except Exception as e:
            print(f"    Twitter official API failed: {e}")
            return []

    # ---------- Nitter path ----------

    def _pick_nitter(self) -> Optional[str]:
        """Return first live nitter instance."""
        if self._working_nitter:
            return self._working_nitter
        for instance in self.NITTER_INSTANCES:
            try:
                r = self.session.get(instance, timeout=5)
                if r.status_code == 200:
                    self._working_nitter = instance
                    return instance
            except Exception:
                continue
        return None

    def _search_nitter(self, query: str, category: str) -> List[Dict]:
        """Scrape via Nitter search page."""
        instance = self._pick_nitter()
        if not instance:
            if self.use_stealth:
                return self._stealth_scrape(query, category)
            return []

        try:
            url = f"{instance}/search?f=tweets&q={quote(query)}"
            resp = self.session.get(url, timeout=15)

            if resp.status_code != 200:
                # Invalidate and retry next call
                self._working_nitter = None
                return []

            return self._parse_nitter_html(resp.text, category)[: self.max_per_query]
        except Exception as e:
            print(f"    Nitter fetch failed: {e}")
            self._working_nitter = None
            return []

    def _parse_nitter_html(self, html: str, category: str) -> List[Dict]:
        """Parse tweet blocks from Nitter HTML with regex (no lxml dep)."""
        signals = []

        # Each tweet is inside a .timeline-item block containing a permalink like /user/status/12345
        tweet_blocks = re.split(r'<div class="timeline-item[^"]*"', html)[1:]

        for block in tweet_blocks:
            try:
                # Permalink -> tweet ID + author
                perma_match = re.search(
                    r'<a class="tweet-link" href="/([^/"]+)/status/(\d+)',
                    block,
                )
                if not perma_match:
                    continue
                author = perma_match.group(1)
                tweet_id = perma_match.group(2)

                # Tweet content
                content_match = re.search(
                    r'<div class="tweet-content[^"]*"[^>]*>(.*?)</div>',
                    block,
                    re.DOTALL,
                )
                if not content_match:
                    continue

                # Strip HTML tags from content
                raw_content = content_match.group(1)
                text = re.sub(r"<[^>]+>", "", raw_content)
                text = re.sub(r"\s+", " ", text).strip()
                if not text or len(text) < 10:
                    continue

                # Engagement stats (nitter uses .tweet-stat blocks)
                likes = self._extract_stat(block, "heart")
                replies = self._extract_stat(block, "comment")

                signals.append(
                    self.normalize_signal(
                        source="twitter",
                        subreddit=f"query:{category}",
                        external_id=tweet_id,
                        title=text[:280],
                        url=f"https://twitter.com/{author}/status/{tweet_id}",
                        author=author,
                        upvotes=likes,
                        comments=replies,
                    )
                )
            except Exception:
                continue

        return signals

    @staticmethod
    def _extract_stat(block: str, icon: str) -> int:
        """Pull an engagement number from a nitter tweet-stat block."""
        pattern = rf"icon-{icon}[^<]*</span>\s*([\d,\.KM]+)"
        m = re.search(pattern, block)
        if not m:
            return 0
        raw = m.group(1).replace(",", "").strip()
        try:
            if raw.endswith("K"):
                return int(float(raw[:-1]) * 1000)
            if raw.endswith("M"):
                return int(float(raw[:-1]) * 1_000_000)
            return int(float(raw)) if raw else 0
        except ValueError:
            return 0

    # ---------- Stealth fallback ----------

    def _stealth_scrape(self, query: str, category: str) -> List[Dict]:
        """Last-resort Scrapling stealth scrape of x.com."""
        try:
            from scrapling import StealthyFetcher

            fetcher = StealthyFetcher()
            url = f"https://x.com/search?q={quote(query)}&f=live"
            page = fetcher.fetch(url, timeout=30000)

            signals = []
            articles = page.css("article[data-testid='tweet']")

            for art in articles[: self.max_per_query]:
                try:
                    link = art.css_first("a[href*='/status/']")
                    if not link:
                        continue
                    href = link.attrib.get("href", "")
                    m = re.match(r"/([^/]+)/status/(\d+)", href)
                    if not m:
                        continue
                    author, tweet_id = m.group(1), m.group(2)

                    text_el = art.css_first("div[data-testid='tweetText']")
                    text = text_el.text().strip() if text_el else ""
                    if not text:
                        continue

                    signals.append(
                        self.normalize_signal(
                            source="twitter",
                            subreddit=f"query:{category}",
                            external_id=tweet_id,
                            title=text[:280],
                            url=f"https://twitter.com{href}",
                            author=author,
                        )
                    )
                except Exception:
                    continue
            return signals
        except ImportError:
            print("    scrapling not installed — skipping stealth path")
            return []
        except Exception as e:
            print(f"    Stealth Twitter scrape failed: {e}")
            return []
