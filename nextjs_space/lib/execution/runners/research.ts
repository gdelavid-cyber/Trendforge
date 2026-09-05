import type { LlmFn } from '../skills';
import type { ParsedStep } from '@/lib/pipeline/steps';
import { getIntegration } from '@/lib/core/vault';

// Real web research: search the live web (user-connected serper/tavily/brave
// key, DuckDuckGo fallback), fetch actual pages, and synthesize ONLY from the
// fetched text. When nothing can be fetched the output says so — it never
// invents sources.

const FETCH_TIMEOUT_MS = 10_000;
const MAX_PAGES = 3;
const MAX_CHARS_PER_PAGE = 4_000;

interface SearchHit {
  title: string;
  url: string;
  snippet?: string;
}

async function searchSerper(apiKey: string, query: string): Promise<SearchHit[]> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num: MAX_PAGES }),
  });
  if (!res.ok) throw new Error(`serper ${res.status}`);
  const data = await res.json();
  return (data.organic ?? []).slice(0, MAX_PAGES).map((r: any) => ({
    title: r.title,
    url: r.link,
    snippet: r.snippet,
  }));
}

async function searchTavily(apiKey: string, query: string): Promise<SearchHit[]> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query, max_results: MAX_PAGES }),
  });
  if (!res.ok) throw new Error(`tavily ${res.status}`);
  const data = await res.json();
  return (data.results ?? []).slice(0, MAX_PAGES).map((r: any) => ({
    title: r.title,
    url: r.url,
    snippet: r.content,
  }));
}

async function searchBrave(apiKey: string, query: string): Promise<SearchHit[]> {
  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${MAX_PAGES}`,
    { headers: { 'X-Subscription-Token': apiKey, Accept: 'application/json' } }
  );
  if (!res.ok) throw new Error(`brave ${res.status}`);
  const data = await res.json();
  return (data.web?.results ?? []).slice(0, MAX_PAGES).map((r: any) => ({
    title: r.title,
    url: r.url,
    snippet: r.description,
  }));
}

async function searchDuckDuckGo(query: string): Promise<SearchHit[]> {
  const res = await fetch('https://html.duckduckgo.com/html/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0 (compatible; TrendlyBot/1.0)' },
    body: new URLSearchParams({ q: query }).toString(),
  });
  if (!res.ok) throw new Error(`duckduckgo ${res.status}`);
  const html = await res.text();
  const hits: SearchHit[] = [];
  const re = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) && hits.length < MAX_PAGES) {
    let url = m[1];
    const uddg = url.match(/uddg=([^&]+)/);
    if (uddg) url = decodeURIComponent(uddg[1]);
    if (url.startsWith('//')) url = `https:${url}`;
    hits.push({ title: m[2].replace(/<[^>]+>/g, '').trim(), url });
  }
  return hits;
}

async function searchWeb(userId: string, query: string): Promise<{ hits: SearchHit[]; provider: string }> {
  try {
    const creds = (await getIntegration(userId, 'websearch')) as { apiKey?: string; vendor?: string } | null;
    if (creds?.apiKey) {
      if (creds.vendor === 'tavily') return { hits: await searchTavily(creds.apiKey, query), provider: 'tavily' };
      if (creds.vendor === 'brave') return { hits: await searchBrave(creds.apiKey, query), provider: 'brave' };
      return { hits: await searchSerper(creds.apiKey, query), provider: 'serper' };
    }
  } catch {
    // fall through to keyless search
  }
  return { hits: await searchDuckDuckGo(query), provider: 'duckduckgo' };
}

export async function fetchReadableText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TrendlyBot/1.0)' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('text/') && !contentType.includes('json')) throw new Error(`non-text ${contentType}`);
  const html = await res.text();
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_CHARS_PER_PAGE);
}

export async function runResearchStep(
  step: ParsedStep,
  ctx: { userId: string; taskTitle: string; llm: LlmFn }
): Promise<{ output: string; sources: string[] }> {
  const query = `${step.title}${step.description ? ` ${step.description}` : ''}`.trim().slice(0, 300);

  let hits: SearchHit[] = [];
  let provider = 'none';
  try {
    const found = await searchWeb(ctx.userId, query);
    hits = found.hits;
    provider = found.provider;
  } catch {
    // treated as no sources below
  }

  if (hits.length === 0) {
    const fallback = await ctx.llm([
      { role: 'system', content: `You are a research assistant working on "${ctx.taskTitle}". No live web sources could be fetched right now. Answer from your own knowledge, explicitly labeled as UNVERIFIED — do not fabricate sources, statistics, or URLs.` },
      { role: 'user', content: `Research topic: ${query}\n\nProvide your best analysis, clearly marked UNVERIFIED (no live sources were reachable).` },
    ]);
    return { output: `[UNVERIFIED — live web unreachable]\n\n${fallback}`, sources: [] };
  }

  const extracts: string[] = [];
  const sources: string[] = [];
  for (const hit of hits) {
    try {
      const text = await fetchReadableText(hit.url);
      extracts.push(`[${sources.length + 1}] ${hit.title}\nURL: ${hit.url}\n${text}`);
      sources.push(hit.url);
    } catch {
      // page unreachable — skip, but keep the search snippet as a weak source
      if (hit.snippet) {
        extracts.push(`[${sources.length + 1}] ${hit.title}\nURL: ${hit.url}\n(search snippet only) ${hit.snippet}`);
        sources.push(hit.url);
      }
    }
  }

  if (extracts.length === 0) {
    return { output: `[UNVERIFIED — search returned results (${provider}) but every page fetch failed]`, sources: [] };
  }

  const synthesis = await ctx.llm([
    {
      role: 'system',
      content: `You are a research assistant working on "${ctx.taskTitle}". Use ONLY the provided web extracts as factual sources — never add outside facts, statistics, or URLs. Cite extracts inline as [1], [2]. If the extracts do not answer the question, say what is missing.`,
    },
    {
      role: 'user',
      content: `Research step: ${step.title}\n${step.description}\n\nWeb extracts (live-fetched via ${provider}):\n\n${extracts.join('\n\n')}\n\nSynthesize the findings for this step. End with a "Key takeaways" list.`,
    },
  ]);

  return {
    output: `${synthesis}\n\nSources (${provider}):\n${sources.map((s, i) => `[${i + 1}] ${s}`).join('\n')}`,
    sources,
  };
}
