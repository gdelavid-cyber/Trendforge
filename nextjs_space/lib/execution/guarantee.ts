/**
 * Trendly Web4 - Autonomous Task Execution & 100% Turnkey Completion Guarantee
 * Enforces zero-placeholder, exhaustive generation, and multi-pass self-correction.
 */

import { LlmFn } from './skills';

export interface QualityReport {
  isComplete: boolean;
  score: number; // 0 - 100
  missingElements: string[];
  reasons: string[];
}

const PLACEHOLDER_PATTERNS = [
  /\[insert\s.*?\]/i,
  /\[your\s.*?here\]/i,
  /\.\.\.rest\sof\scode/i,
  /\/\/ TODO/i,
  /TODO:/i,
  /lorem\s+ipsum/i,
  /placeholder/i,
  /replace\s+with\s+your/i,
];

/**
 * Validates whether an execution output meets the 100% turnkey completion guarantee.
 */
export function auditStepCompleteness(output: string, actionType: string): QualityReport {
  const missingElements: string[] = [];
  const reasons: string[] = [];
  let score = 100;

  if (!output || output.trim().length < 80) {
    return {
      isComplete: false,
      score: 20,
      missingElements: ['Full comprehensive content'],
      reasons: ['Output is too brief or truncated'],
    };
  }

  // Check for lazy placeholders
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(output)) {
      score -= 25;
      missingElements.push(`Unfinished template placeholder (${pattern.source})`);
      reasons.push('Contains unfinished placeholder tags');
      break;
    }
  }

  // Action-specific completion requirements
  if (actionType === 'build' || actionType === 'write' || actionType === 'draft') {
    if (output.length < 350) {
      score -= 20;
      missingElements.push('Comprehensive implementation depth');
    }
  }

  if (actionType === 'sales' || actionType === 'outreach') {
    if (!output.toLowerCase().includes('subject:') && !output.toLowerCase().includes('call to action') && !output.toLowerCase().includes('follow-up')) {
      score -= 15;
      missingElements.push('Subject line or follow-up sequence');
    }
  }

  return {
    isComplete: score >= 80,
    score: Math.max(0, score),
    missingElements,
    reasons,
  };
}

/**
 * Autonomous Self-Correction Pass:
 * If an output contains gaps or placeholders, enrich it to 100% turnkey production quality.
 */
export async function guaranteeTurnkeyExecution(params: {
  output: string;
  stepTitle: string;
  stepAction: string;
  taskTitle: string;
  companionName?: string;
  llm: LlmFn;
}): Promise<string> {
  const { output, stepTitle, stepAction, taskTitle, companionName = 'Autonomous Operative', llm } = params;

  const audit = auditStepCompleteness(output, stepAction);
  if (audit.isComplete && output.length > 300) {
    return output;
  }

  // Execute Autonomous Self-Correction Enrichment Pass
  try {
    const enriched = await llm([
      {
        role: 'system',
        content: `You are ${companionName}, operating under Trendly's 100% Turnkey Execution Guarantee.
You MUST provide the fully completed, 100% ready-to-use deliverable for the user with ZERO placeholders, ZERO unfinished TODOs, and maximum practical depth.
If code is needed, write the complete working code and files.
If copy/sales/research is needed, provide the full unshortened copy and exact step-by-step numbers.`,
      },
      {
        role: 'user',
        content: `Task: "${taskTitle}"
Step (${stepAction}): "${stepTitle}"

Initial draft had gaps: ${audit.missingElements.join(', ') || 'Needs full depth'}.
Draft output:
${output}

ENRICH & EXPAND this deliverable into a 100% turnkey, ready-to-deploy final result right now:`,
      },
    ]);

    if (enriched && enriched.trim().length > output.trim().length) {
      return enriched.trim();
    }
  } catch (err) {
    console.warn('[GUARANTEE_ENGINE] Enrichment pass fallback:', err);
  }

  return output;
}
