"""ProductHunt scraper: GraphQL API if token set, else unauthenticated RSS fallback."""
import re
import time
from typing import Dict, List, Optional

import requests

from .base import BaseScraper


class ProductHuntScraper(BaseScraper):
    """
    Scrapes ProductHunt for launched products and discussions.

    Strategy:
      1. If token set -> GraphQL API v2 (best).
      2. Otherwise -> RSS feed (no auth).
    """

    source = "producthunt"
    GRAPHQL_URL = "https://api.producthunt.com/v2/api/graphql"
    RSS_URL = "https://www.producthunt.com/feed"

    # Topics to pull discussions/products from
    TOPICS = [
        "artificial-intelligence",
        "developer-tools",
        "saas",
        "no-code",
        "marketing",
        "productivity",
        "automation",
        "analytics",
    ]

    def __init__(self, token: Optional[str] = None, max_per_topic: int = 10):
        self.token = token
        self.max_per_topic = max_per_topic
        self.session = requests.Session()
        self.session.headers.update(
            {
                "User-Agent": "Mozilla/5.0 (compatible; TrendlyBot/1.0; +https://trendly.app)",
                "Accept": "application/json, text/html",
            }
        )

    def scrape(self) -> List[Dict]:
        if self.token:
            return self._scrape_graphql()
        return self._scrape_rss_fallback()

    # ---------- GraphQL path ----------

    def _scrape_graphql(self) -> List[Dict]:
        all_signals: List[Dict] = []

        # Query 1: recent top posts (products launched)
        try:
            products = self._graphql_recent_posts(limit=30)
            all_signals.extend(products)
            print(f"  [PH GraphQL] Products: {len(products)} signals")
        except Exception as e:
            print(f"  [PH GraphQL] Recent posts error: {e}")

        # Query 2: per topic
        for topic in self.TOPICS[:4]:  # cap to stay under rate limit
            try:
                sigs = self._graphql_topic(topic, limit=self.max_per_topic)
                all_signals.extend(sigs)
                print(f"  [PH GraphQL] Topic {topic}: {len(sigs)} signals")
                time.sleep(1)
            except Exception as e:
                print(f"  [PH GraphQL] Topic {topic} error: {e}")

        return all_signals[:60]

    def _graphql_recent_posts(self, limit: int = 30) -> List[Dict]:
        query = """
        query RecentPosts($first: Int!) {
          posts(first: $first, order: RANKING) {
            edges {
              node {
                id
                slug
                name
                tagline
                description
                votesCount
                commentsCount
                createdAt
                url
                user { username }
                topics(first: 3) { edges { node { slug } } }
              }
            }
          }
        }
        """
        return self._exec_graphql_posts(query, {"first": limit})

    def _graphql_topic(self, topic: str, limit: int = 10) -> List[Dict]:
        query = """
        query TopicPosts($slug: String!, $first: Int!) {
          topic(slug: $slug) {
            posts(first: $first, order: NEWEST) {
              edges {
                node {
                  id
                  slug
                  name
                  tagline
                  description
                  votesCount
                  commentsCount
                  createdAt
                  url
                  user { username }
                }
              }
            }
          }
        }
        """
        try:
            resp = self._graphql_call(query, {"slug": topic, "first": limit})
            edges = (
                resp.get("data", {})
                .get("topic", {})
                .get("posts", {})
                .get("edges", [])
                or []
            )
            return [self._normalize_ph_node(e["node"], topic=topic) for e in edges]
        except Exception:
            return []

    def _exec_graphql_posts(self, query: str, variables: Dict) -> List[Dict]:
        resp = self._graphql_call(query, variables)
        edges = resp.get("data", {}).get("posts", {}).get("edges", []) or []
        signals = []
        for e in edges:
            node = e["node"]
            topics = [t["node"]["slug"] for t in node.get("topics", {}).get("edges", [])]
            primary_topic = topics[0] if topics else "general"
            signals.append(self._normalize_ph_node(node, topic=primary_topic))
        return signals

    def _graphql_call(self, query: str, variables: Dict) -> Dict:
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}",
        }
        resp = self.session.post(
            self.GRAPHQL_URL,
            json={"query": query, "variables": variables},
            headers=headers,
            timeout=15,
        )
        resp.raise_for_status()
        return resp.json()

    def _normalize_ph_node(self, node: Dict, topic: str = "general") -> Dict:
        title = node.get("name", "").strip()
        tagline = node.get("tagline", "").strip()
        combined_title = f"{title} — {tagline}" if tagline else title

        return self.normalize_signal(
            source="producthunt",
            subreddit=f"topic:{topic}",
            external_id=str(node.get("id", "")),
            title=combined_title[:500],
            url=node.get("url") or f"https://www.producthunt.com/posts/{node.get('slug', '')}",
            body=node.get("description", "")[:2000] or None,
            author=(node.get("user") or {}).get("username"),
            upvotes=node.get("votesCount", 0),
            comments=node.get("commentsCount", 0),
        )

    # ---------- RSS fallback path ----------

    def _scrape_rss_fallback(self) -> List[Dict]:
        """No-auth fallback: parse the public RSS feed."""
        signals: List[Dict] = []
        try:
            # Feed-reader disguise: Cloudflare's edge lets known aggregator
            # UAs through the browser-integrity check. Scoped to this
            # request only — the GraphQL path needs application/json.
            rss_headers = {
                "User-Agent": "Feedly/1.0 (http://feedly.com; 1 subscriber)",
                "Accept": "application/rss+xml, application/rdf+xml, application/xml;q=0.9, */*;q=0.8",
            }
            resp = self.session.get(self.RSS_URL, headers=rss_headers, timeout=15)
            if resp.status_code != 200:
                print(f"  [PH RSS] HTTP {resp.status_code}")
                return []

            xml = resp.text

            # RSS 2.0 uses <item>; Atom (what PH actually serves) uses <entry>.
            items = re.findall(r"<item>(.*?)</item>", xml, re.DOTALL)
            is_atom = False
            if not items:
                items = re.findall(r"<entry>(.*?)</entry>", xml, re.DOTALL)
                is_atom = True
            print(f"  [PH RSS] Found {len(items)} items ({'atom' if is_atom else 'rss'})")

            for item in items[:60]:
                try:
                    if is_atom:
                        title = self._xml_field(item, "title")
                        link_match = re.search(r'<link[^>]*href="([^"]+)"', item)
                        link = link_match.group(1) if link_match else ""
                        desc = self._xml_field(item, "summary") or self._xml_field(item, "content")
                        id_source = link or self._xml_field(item, "id")
                        slug_match = re.search(r"/posts/([a-z0-9-]+)", id_source)
                    else:
                        title = self._xml_field(item, "title")
                        link = self._xml_field(item, "link")
                        desc = self._xml_field(item, "description")
                        slug_match = re.search(r"/posts/([a-z0-9-]+)", link)

                    if not title or not link:
                        continue

                    # Extract slug as external id
                    external_id = slug_match.group(1) if slug_match else link

                    # Strip HTML from description
                    clean_desc = re.sub(r"<[^>]+>", "", desc)
                    clean_desc = re.sub(r"\s+", " ", clean_desc).strip()

                    signals.append(
                        self.normalize_signal(
                            source="producthunt",
                            subreddit="feed:daily",
                            external_id=external_id,
                            title=title[:500],
                            url=link,
                            body=clean_desc[:2000] if clean_desc else None,
                        )
                    )
                except Exception:
                    continue
        except Exception as e:
            print(f"  [PH RSS] Fetch error: {e}")

        return signals

    @staticmethod
    def _xml_field(block: str, field: str) -> str:
        """Pull inner text of an XML tag, stripping CDATA wrappers."""
        m = re.search(rf"<{field}[^>]*>(.*?)</{field}>", block, re.DOTALL)
        if not m:
            return ""
        raw = m.group(1).strip()
        cdata = re.match(r"<!\[CDATA\[(.*?)\]\]>", raw, re.DOTALL)
        if cdata:
            raw = cdata.group(1).strip()
        return raw
