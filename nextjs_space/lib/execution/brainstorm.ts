import type { LlmFn } from './skills';
import type { ParsedStep } from '@/lib/tasks/steps';

export interface BrainstormMessage {
  speaker: string;
  archetype: 'KAIROS' | 'MIDAS' | 'UNIT_O' | 'VEIL' | 'STRATEGIST';
  roleTitle: string;
  thought: string;
  proposal: string;
}

export interface BrainstormSession {
  taskTitle: string;
  consensusStrategy: string;
  keyTactics: string[];
  roleAssignments: { stepIndex: number; assignedTo: string; specialty: string }[];
  dialogue: BrainstormMessage[];
}

export interface BrainstormParams {
  taskTitle: string;
  taskCategory: string;
  steps: ParsedStep[];
  companionName?: string;
  llm: LlmFn;
}

export async function runSquadBrainstorm({
  taskTitle,
  taskCategory,
  steps,
  companionName = 'Kairos',
  llm,
}: BrainstormParams): Promise<BrainstormSession> {
  const stepsList = steps.map((s, i) => `${i + 1}. [${s.action.toUpperCase()}] ${s.title}: ${s.description}`).join('\n');

  const prompt = `You are orchestrating a live autonomous squad brainstorming session between 3 AI specialists preparing to execute: "${taskTitle}" (Category: ${taskCategory}).

Action Steps to execute:
${stepsList}

The squad members are:
1. ${companionName} (Lead Strategist & Architect): Focuses on workflow efficiency, proof-of-work, and structural integrity.
2. UNIT-O / Cypher (Systems & Data Specialist): Focuses on research depth, accurate tooling, scraping precision, and executable artifacts.
3. MIDAS / Maya (Growth & Monetization Closer): Focuses on client outreach, viral reach, high-converting copy, audio/video impact, and revenue capture.

Simulate their high-energy, concise, collaborative brainstorm where they align on the gameplan, spot potential roadblocks, and assign roles.

Output strictly valid JSON matching this exact structure (no markdown fences, no extra text):
{
  "consensusStrategy": "1-2 sentence core execution thesis",
  "keyTactics": [
    "Tactic 1",
    "Tactic 2",
    "Tactic 3"
  ],
  "roleAssignments": [
    { "stepIndex": 0, "assignedTo": "${companionName}", "specialty": "Architectural Scaffolding" }
  ],
  "dialogue": [
    {
      "speaker": "${companionName}",
      "archetype": "KAIROS",
      "roleTitle": "Lead Strategist",
      "thought": "Internal operational priority",
      "proposal": "Spoken collaborative message to the squad"
    },
    {
      "speaker": "UNIT-O",
      "archetype": "UNIT_O",
      "roleTitle": "Data Specialist",
      "thought": "Technical insight",
      "proposal": "Spoken response and data plan"
    },
    {
      "speaker": "MIDAS",
      "archetype": "MIDAS",
      "roleTitle": "Growth & Closer",
      "thought": "Monetization angle",
      "proposal": "Spoken response and distribution angle"
    }
  ]
}`;

  let raw = '';
  try {
    raw = await llm([
      {
        role: 'system',
        content: 'You are an autonomous AI swarm coordinator. Output strictly valid JSON without markdown fences.',
      },
      { role: 'user', content: prompt },
    ]);
  } catch (err: any) {
    console.warn('[BRAINSTORM] LLM invocation failed, using autonomous procedural brainstorm generator:', err.message);
  }

  let parsed: any;
  try {
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    parsed = {
      consensusStrategy: `Execute "${taskTitle}" with precision data extraction and direct high-converting distribution.`,
      keyTactics: [
        'Automate research and verify sources with proof receipts.',
        'Synthesize multi-modal deliverables (scripts, voice notes, code assets).',
        'Package immediate sales outreach for rapid monetization.',
      ],
      roleAssignments: steps.map((s, i) => ({
        stepIndex: i,
        assignedTo: i % 2 === 0 ? companionName : 'UNIT-O',
        specialty: s.action.toUpperCase(),
      })),
      dialogue: [
        {
          speaker: companionName,
          archetype: 'KAIROS',
          roleTitle: 'Lead Strategist',
          thought: 'We need clean, verifiable execution from step 1.',
          proposal: `Squad assembled for "${taskTitle}". I will coordinate step execution while UNIT-O handles data verification and MIDAS packages the monetization layer.`,
        },
        {
          speaker: 'UNIT-O',
          archetype: 'UNIT_O',
          roleTitle: 'Systems & Data',
          thought: 'Ensuring zero hallucination and real proof artifacts.',
          proposal: 'Telemetry sensors calibrated. Ready to run research, generate structured schemas, and compile deliverables.',
        },
        {
          speaker: 'MIDAS',
          archetype: 'MIDAS',
          roleTitle: 'Growth & Closer',
          thought: 'Focus on immediate client acquisition and high conversion.',
          proposal: 'I will take the finished assets and construct the viral scripts, voice notes, and cold outreach sequence.',
        },
      ],
    };
  }

  return {
    taskTitle,
    consensusStrategy: parsed.consensusStrategy || `Full autonomous execution of ${taskTitle}`,
    keyTactics: Array.isArray(parsed.keyTactics) ? parsed.keyTactics : [],
    roleAssignments: Array.isArray(parsed.roleAssignments) ? parsed.roleAssignments : [],
    dialogue: Array.isArray(parsed.dialogue) ? parsed.dialogue : [],
  };
}
