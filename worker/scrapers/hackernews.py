"""Hacker News scraper via the official Firebase API."""
import time
from typing import Dict, List, Optional

import requests

from .base import BaseScraper


class HackerNewsScraper(BaseScraper):
    source = "hackernews"
    BASE_URL = "https://hacker-news.firebaseio.com/v0"

    def __init__(self, max_stories: int = 30):
        self.max_stories = max_stories
        self.session = requests.Session()

    def scrape(self) -> List[Dict]:
        all_signals: List[Dict] = []
        try:
            top_ids = self._get_story_ids("topstories")
            for sid in top_ids[: self.max_stories // 2]:
                s = self._get_story(sid)
                if s:
                    all_signals.append(s)
                time.sleep(0.2)
            print(f"  [HN] Top stories: {len(all_signals)} signals")
        except Exception as e:
            print(f"  [HN] Top stories error: {e}")
        try:
            before = len(all_signals)
            new_ids = self._get_story_ids("newstories")
            for sid in new_ids[: self.max_stories // 2]:
                s = self._get_story(sid)
                if s:
                    all_signals.append(s)
                time.sleep(0.2)
            print(f"  [HN] New stories: {len(all_signals) - before} signals")
        except Exception as e:
            print(f"  [HN] New stories error: {e}")
        return all_signals

    def _get_story_ids(self, endpoint: str) -> List[int]:
        resp = self.session.get(f"{self.BASE_URL}/{endpoint}.json", timeout=10)
        resp.raise_for_status()
        return resp.json() or []

    def _get_story(self, story_id: int) -> Optional[Dict]:
        try:
            resp = self.session.get(f"{self.BASE_URL}/item/{story_id}.json", timeout=10)
            resp.raise_for_status()
            item = resp.json()
            if not item or item.get("type") != "story":
                return None
            title = (item.get("title") or "").strip()
            if not title:
                return None
            score = item.get("score", 0)
            if score < 3:
                return None
            url = item.get("url") or f"https://news.ycombinator.com/item?id={story_id}"
            return self.normalize_signal(
                source="hackernews",
                external_id=str(story_id),
                title=title,
                url=url,
                body=item.get("text"),
                author=item.get("by"),
                upvotes=score,
                comments=item.get("descendants", 0),
            )
        except Exception:
            return None
