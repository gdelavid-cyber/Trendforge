// Structured task-step model and tolerant parsing.
//
// Tasks carry `steps` as JSON in the database. Historical tasks store plain
// strings ("Sign up for X"); new pipeline-generated tasks store structured
// objects. parseSteps() normalizes both so the engine and UI never crash on
// legacy data.

export const STEP_ACTIONS = [
  'research',
  'draft',
  'generate',
  'send',
  'deploy',
  'trade',
  'scrape',
  'analyze',
] as const;

export type StepAction = (typeof STEP_ACTIONS)[number];

// Actions that reach outside the platform require an approval gate before
// they can be considered executed.
const EXTERNAL_BY_DEFAULT: ReadonlySet<string> = new Set(['send', 'deploy', 'trade']);

export interface ParsedStep {
  id: string;
  index: number;
  title: string;
  description: string;
  action: StepAction;
  external: boolean;
  tools: string[];
  estimatedTime: string;
  outputType: 'text' | 'file' | 'link' | 'none';
  source: 'structured' | 'legacy';
}

function isStepAction(value: unknown): value is StepAction {
  return typeof value === 'string' && (STEP_ACTIONS as readonly string[]).includes(value);
}

function coerceStep(input: unknown, index: number): ParsedStep | null {
  if (!input || typeof input !== 'object') return null;
  const obj = input as Record<string, unknown>;

  const title = typeof obj.title === 'string' ? obj.title : '';
  if (!title) return null;

  const action: StepAction = isStepAction(obj.action) ? obj.action : 'analyze';

  let external: boolean;
  if (typeof obj.external === 'boolean') {
    external = obj.external;
  } else {
    external = EXTERNAL_BY_DEFAULT.has(action);
  }

  const tools = Array.isArray(obj.tools) ? obj.tools.filter((t): t is string => typeof t === 'string') : [];

  const outputType =
    obj.outputType === 'text' || obj.outputType === 'file' || obj.outputType === 'link' || obj.outputType === 'none'
      ? obj.outputType
      : 'text';

  return {
    id: typeof obj.id === 'string' ? obj.id : `step-${index}`,
    index,
    title,
    description: typeof obj.description === 'string' ? obj.description : '',
    action,
    external,
    tools,
    estimatedTime: typeof obj.estimatedTime === 'string' ? obj.estimatedTime : '',
    outputType,
    source: 'structured',
  };
}

function legacyAdvisory(text: string, index: number): ParsedStep {
  return {
    id: `step-${index}`,
    index,
    title: text,
    description: '',
    action: 'analyze',
    // Legacy steps are human instructions; the engine may advise but must
    // never treat them as outbound actions.
    external: false,
    tools: [],
    estimatedTime: '',
    outputType: 'none',
    source: 'legacy',
  };
}

/**
 * Normalizes any historical or current shape of Task.steps into ParsedStep[].
 * Accepts: undefined/null, JSON string, string[] (legacy), object arrays
 * (structured). Never throws — unparseable input yields an empty list.
 */
export function parseSteps(raw: unknown): ParsedStep[] {
  if (raw == null) return [];

  let items: unknown = raw;
  if (typeof raw === 'string') {
    try {
      items = JSON.parse(raw);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(items)) return [];

  return items
    .map((item, index): ParsedStep | null => {
      if (typeof item === 'string') {
        const text = item.trim();
        return text ? legacyAdvisory(text, index) : null;
      }
      return coerceStep(item, index);
    })
    .filter((s): s is ParsedStep => s !== null)
    .sort((a, b) => a.index - b.index);
}

/**
 * Keyword classifier for legacy free-text step strings. Ordered by
 * specificity: outbound verbs win over drafting verbs ("Send personalized
 * recordings" is a send even though it contains production language).
 */
export function classifyAction(text: string): StepAction {
  const t = text.toLowerCase();
  if (/\b(scrape|harvest|apollo|clay|lead list|google maps)\b/.test(t)) return 'scrape';
  if (/\b(send|outreach|cold email|sequence|dm |pitch them|follow.?up)\b/.test(t)) return 'send';
  if (/\b(deploy|launch|publish|ship)\b/.test(t)) return 'deploy';
  if (/\b(draft|write)\b/.test(t)) return 'draft';
  if (/\b(generate|create|design|record|produce|splice|synthesize|build|set up)\b/.test(t)) return 'generate';
  if (/\b(research|identify|analyze|study|scout)\b/.test(t)) return 'research';
  return 'analyze';
}

/**
 * Converts whatever shape of steps arrived from generation (legacy string[],
 * structured objects, or an already-parsed array) into a JSON string of
 * structured steps suitable for storage in the Task.steps Json column.
 * New writes to the DB should go through this so every new task is
 * engine-executable.
 */
export function toStructuredStepsJson(rawSteps: unknown): string {
  const structured = parseSteps(rawSteps).map((step) => {
    if (step.source !== 'legacy') return step;
    // Upgrade legacy advisory text into an executable step: classify the
    // action from its wording and gate it exactly like native steps.
    const action = classifyAction(step.title);
    return {
      ...step,
      action,
      external: EXTERNAL_BY_DEFAULT.has(action),
      outputType: 'text' as const,
      source: 'structured' as const,
    };
  });
  return JSON.stringify(structured);
}
