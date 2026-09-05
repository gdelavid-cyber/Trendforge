import type { LlmFn } from '../skills';
import type { ParsedStep } from '@/lib/pipeline/steps';

// Real X/Twitter posting through the user's connected OAuth user-context
// token. Never posts without one.

const MAX_TWEET = 280;

/** Posts a tweet through the user's OAuth user-context token. */
export async function postTweet(
  accessToken: string,
  text: string
): Promise<{ postId: string; url: string }> {
  const res = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: text.slice(0, MAX_TWEET) }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`X API ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const id = data?.data?.id;
  if (!id) throw new Error('X API returned no tweet id');
  return { postId: id, url: `https://x.com/i/web/status/${id}` };
}

export async function draftTweetText(params: {
  step: ParsedStep;
  taskTitle: string;
  previousResults: string[];
  llm: LlmFn;
}): Promise<string> {
  const draft = await params.llm([
    {
      role: 'system',
      content: `You write tweets for the autonomous companion executing "${params.taskTitle}". Write ONE tweet for the step below: punchy, under ${MAX_TWEET} characters, no hashtags spam (max 1), no emoji spam. Output ONLY the tweet text.`,
    },
    {
      role: 'user',
      content: `Step: ${params.step.title}\n${params.step.description}\n\n${params.previousResults.length ? `Context:\n${params.previousResults.slice(-2).join('\n')}` : ''}`,
    },
  ]);
  return (draft || '').trim().slice(0, MAX_TWEET);
}
