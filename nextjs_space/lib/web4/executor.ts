import { SKILLS_LIBRARY, type SkillDefinition } from './skills-library';
import { callLLM } from '@/lib/pipeline';

export interface ExecResult {
  skillId: string;
  skillName: string;
  category: string;
  status: 'SUCCESS' | 'FAILED';
  /** true when the result came from a real external call; false = local simulation */
  simulated: boolean;
  computeBurnUsdc: number;
  inputParams: Record<string, any>;
  outputSummary: string;
  result: any;
  error?: string;
}

function findSkill(skillId?: string): SkillDefinition | undefined {
  return SKILLS_LIBRARY.find((s) => s.id === skillId);
}

/**
 * Real Reddit pain-point mining: fetches live search JSON (no-auth, descriptive
 * User-Agent) then asks the system LLM to extract structured commercial
 * pain points. Throws on transport failure so the caller can surface a real
 * error instead of faking a payload.
 */
async function scrapeRedditPainpoints(params: Record<string, any>): Promise<any> {
  const sub = String(params.subreddit || 'SaaS').trim();
  const keywords = String(params.keywords || 'frustrated, alternative, broken')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const maxPosts = Math.min(Math.max(Number(params.maxPosts) || 20, 1), 100);

  const q = keywords.join(' OR ');
  const url =
    `https://www.reddit.com/r/${encodeURIComponent(sub)}/search.json` +
    `?q=${encodeURIComponent(q)}&restrict_sr=1&sort=top&t=year&limit=${maxPosts}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'TrendlyWeb4/1.0 (autonomous agent execution; contact ops@trendly.app)' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Reddit fetch failed (HTTP ${res.status} ${res.statusText})`);

  const json = await res.json();
  const posts = (json?.data?.children || []).map((c: any) => ({
    title: c.data?.title ?? '',
    selftext: (c.data?.selftext ?? '').slice(0, 600),
    score: c.data?.score ?? 0,
    num_comments: c.data?.num_comments ?? 0,
    permalink: c.data?.permalink ? `https://reddit.com${c.data.permalink}` : '',
  }));

  if (posts.length === 0) {
    return { rawCount: 0, painPoints: [], summary: `No posts found for "${q}" in r/${sub}.` };
  }

  const llmRaw = await callLLM(
    [
      {
        role: 'system',
        content:
          'You are a market analyst. Given Reddit posts, extract recurring commercial pain points. ' +
          'Return ONLY JSON: {rawCount:number, summary:string, painPoints:[{problem:string, evidence:string, ' +
          'frequencyScore:number(1-10), demandLevel:"low"|"medium"|"high", suggestedProduct:string}]}',
      },
      { role: 'user', content: JSON.stringify(posts.slice(0, 15)) },
    ],
    true
  );

  let parsed: any;
  try {
    parsed = JSON.parse(llmRaw);
  } catch {
    parsed = { rawCount: posts.length, painPoints: [], summary: 'LLM returned unparseable output.', samplePosts: posts.slice(0, 3) };
  }
  return { ...parsed, rawCount: posts.length, samplePosts: posts.slice(0, 3) };
}

/**
 * Real HackerNews "Show HN" launch radar: free, key-less Algolia API, then the
 * system LLM summarizes the high-velocity launches into structured profiles.
 */
async function scrapeHackerNewsLaunches(params: Record<string, any>): Promise<any> {
  const minScore = Number(params.minScore) || 50;
  const limit = Math.min(Math.max(Number(params.limit) || 15, 1), 30);

  const url = `https://hn.algolia.com/api/v1/search?tags=show_hn&hitsPerPage=${limit * 2}`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'TrendlyWeb4/1.0 (autonomous agent execution)' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`HackerNews fetch failed (HTTP ${res.status} ${res.statusText})`);

  const json = await res.json();
  const hits = (json?.hits || [])
    .map((h: any) => ({
      title: h.title ?? '',
      url: h.url || `https://news.ycombinator.com/item?id=${h.objectID}`,
      points: h.points ?? 0,
      author: h.author ?? '',
      num_comments: h.num_comments ?? 0,
    }))
    .filter((h: any) => h.points >= minScore)
    .slice(0, limit);

  if (hits.length === 0) {
    return { rawCount: 0, launches: [], summary: `No Show HN launches above ${minScore} points right now.` };
  }

  const llmRaw = await callLLM(
    [
      {
        role: 'system',
        content:
          'You are a startup analyst. Given HackerNews Show HN launches, return ONLY JSON: ' +
          '{rawCount:number, summary:string, launches:[{title:string, category:string, oneLinePitch:string, ' +
          'monetizationHint:string}]}',
      },
      { role: 'user', content: JSON.stringify(hits) },
    ],
    true
  );

  let parsed: any;
  try {
    parsed = JSON.parse(llmRaw);
  } catch {
    parsed = { rawCount: hits.length, launches: hits.map((h: any) => ({ title: h.title })), summary: 'LLM returned unparseable output.' };
  }
  return { ...parsed, rawCount: hits.length, sample: hits.slice(0, 3) };
}

/** Pure-LLM long-form SEO article. Real generation — no external fetch. */
async function seoBlogPost(params: Record<string, any>): Promise<any> {
  const keyword = String(params.keyword || 'Best AI agents for business automation');
  const llmRaw = await callLLM(
    [
      {
        role: 'system',
        content:
          'You are an expert SEO content writer. Write a comprehensive, keyword-optimized long-form article in ' +
          'Markdown with H2/H3 headings, an FAQ section, and a conclusion. Respond with ONLY JSON: ' +
          '{articleMarkdown:string, metaTitle:string, metaDescription:string, targetKeywords:string[]}',
      },
      { role: 'user', content: `Primary keyword: ${keyword}` },
    ],
    true
  );
  try {
    return JSON.parse(llmRaw);
  } catch {
    return { articleMarkdown: llmRaw };
  }
}

/** Pure-LLM 3-step cold outreach sequence. Real generation — no external fetch. */
async function coldEmailSequence(params: Record<string, any>): Promise<any> {
  const vp = String(params.valueProposition || 'Automated AI Receptionist that saves 15 hours/week');
  const niche = String(params.targetNiche || 'Dental Clinics');
  const tone = String(params.tone || 'concise, provocative, casual');
  const llmRaw = await callLLM(
    [
      {
        role: 'system',
        content:
          'You are an elite cold-email copywriter. Write a 3-step cold outreach sequence. Return ONLY JSON: ' +
          '{sequence:[{step:number, subject:string, body:string, sendDelayDays:number}]}',
      },
      {
        role: 'user',
        content: `Value proposition: ${vp}\nTarget niche: ${niche}\nTone: ${tone}`,
      },
    ],
    true
  );
  try {
    return JSON.parse(llmRaw);
  } catch {
    return { sequence: [{ step: 1, subject: '', body: llmRaw, sendDelayDays: 0 }] };
  }
}

/**
 * Single skill execution. Real implementations live in the `real` map; anything
 * unimplemented falls back to an explicitly-labeled simulation so the DAG still
 * runs end-to-end while we port skills over. Failures of real skills are
 * surfaced honestly (status FAILED, error populated) — never faked as success.
 */
const real: Record<string, (params: Record<string, any>) => Promise<any>> = {
  scrape_reddit_painpoints: scrapeRedditPainpoints,
  scrape_hackernews_launches: scrapeHackerNewsLaunches,
  seo_blog_post_generator: seoBlogPost,
  cold_email_sequence_writer: coldEmailSequence,
};

export async function executeSkill(
  skillId: string | undefined,
  params: Record<string, any> = {}
): Promise<ExecResult> {
  const def = findSkill(skillId);
  const cost = def?.computeCostUsdc ?? 0.05;
  const name = def?.name ?? skillId ?? 'unknown';

  const impl = skillId ? real[skillId] : undefined;
  if (!impl) {
    return {
      skillId: skillId ?? 'unknown',
      skillName: name,
      category: def?.category ?? 'UTILITY',
      status: 'SUCCESS',
      simulated: true,
      computeBurnUsdc: cost,
      inputParams: params,
      outputSummary: `[SIMULATED] ${name} has no real executor yet`,
      result: { sampleYield: Math.floor(150 + Math.random() * 350) },
    };
  }

  try {
    const result = await impl(params);
    const count = Array.isArray(result?.painPoints) ? result.painPoints.length : result?.rawCount ?? 0;
    return {
      skillId: skillId as string,
      skillName: name,
      category: def?.category ?? 'SCRAPER',
      status: 'SUCCESS',
      simulated: false,
      computeBurnUsdc: cost,
      inputParams: params,
      outputSummary: `Real execution: ${count} signal${count === 1 ? '' : 's'} from r/${params.subreddit ?? 'SaaS'}`,
      result,
    };
  } catch (e: any) {
    return {
      skillId: skillId as string,
      skillName: name,
      category: def?.category ?? 'SCRAPER',
      status: 'FAILED',
      simulated: false,
      computeBurnUsdc: cost,
      inputParams: params,
      outputSummary: `Real execution failed: ${e.message}`,
      result: null,
      error: e.message,
    };
  }
}
