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
