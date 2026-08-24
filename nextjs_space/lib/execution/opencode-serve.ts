import { flattenMessages, stripAnsi, type LlmFn } from './llm';

// opencode serve transport. Talks to a persistent headless `opencode serve`
// HTTP instance instead of spawning a CLI process per call — same brain, no
// 20-35s spawn tax per step. Contract (probed against the /doc OpenAPI spec):
//   POST /session                    { title?, model: { id, providerID } } -> { id }
//   POST /session/{id}/message       { parts: [{ type:'text', text }], model: { providerID, modelID } }
//                                    -> { info, parts: [{ type:'text', text }, ...] }

const SERVE_TIMEOUT_MS = 120_000;

/** Splits "opencode/x-preview-f-free" into provider/model ids for the API. */
export function parseModelId(model: string): { providerID: string; modelID: string } {
  const slash = model.indexOf('/');
  if (slash <= 0 || slash === model.length - 1) {
    throw new Error(`Invalid OPENCODE_MODEL "${model}" — expected "provider/model-id"`);
  }
  return { providerID: model.slice(0, slash), modelID: model.slice(slash + 1) };
}

interface SessionCreated {
  id: string;
}

interface ServeMessagePart {
  type: string;
  text?: string;
}

export function opencodeServeLlm(
  baseUrl: string,
  model: string = process.env.OPENCODE_MODEL || 'opencode/x-preview-f-free'
): LlmFn {
  const base = baseUrl.replace(/\/+$/, '');

  return async (messages) => {
    const { providerID, modelID } = parseModelId(model);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SERVE_TIMEOUT_MS);

    try {
      const sessionRes = await fetch(`${base}/session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'trendly-brain', model: { id: modelID, providerID } }),
        signal: controller.signal,
      });
      if (!sessionRes.ok) {
        throw new Error(`opencode serve /session ${sessionRes.status}: ${(await sessionRes.text()).slice(0, 200)}`);
      }
      const session = (await sessionRes.json()) as SessionCreated;
      if (!session?.id) throw new Error('opencode serve returned no session id');

      const msgRes = await fetch(`${base}/session/${session.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parts: [{ type: 'text', text: flattenMessages(messages) }],
          model: { providerID, modelID },
        }),
        signal: controller.signal,
      });
      if (!msgRes.ok) {
        throw new Error(`opencode serve message ${msgRes.status}: ${(await msgRes.text()).slice(0, 200)}`);
      }

      const body = await msgRes.json();
      const parts: ServeMessagePart[] = Array.isArray(body?.parts) ? body.parts : [];
      const text = parts
        .filter((p) => p.type === 'text' && typeof p.text === 'string')
        .map((p) => p.text!)
        .join('\n')
        .trim();

      if (!text) throw new Error('opencode serve returned an empty reply');
      return stripAnsi(text);
    } finally {
      clearTimeout(timer);
    }
  };
}
