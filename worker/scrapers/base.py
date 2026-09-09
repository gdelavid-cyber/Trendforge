"""Shared base for Trendly signal scrapers."""
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Optional


class BaseScraper:
    """Base class for all signal scrapers."""

    source: str = "unknown"

    def scrape(self) -> List[Dict]:
        """Override in subclass. Returns list of normalized signal dicts."""
        raise NotImplementedError

    @staticmethod
    def normalize_signal(
        source: str,
        external_id: str,
        title: str,
        url: str,
        body: Optional[str] = None,
        author: Optional[str] = None,
        upvotes: int = 0,
        comments: int = 0,
        subreddit: Optional[str] = None,
    ) -> Dict:
        return {
            "source": source,
            "subreddit": subreddit,
            "externalId": str(external_id),
            "title": title[:500],
            "body": (body[:2000] if body else None),
            "url": url,
            "author": author,
            "upvotes": max(0, upvotes),
            "comments": max(0, comments),
            "scrapedAt": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def compute_fingerprint(content: str) -> str:
        return hashlib.sha256(content.lower().strip().encode("utf-8")).hexdigest()
