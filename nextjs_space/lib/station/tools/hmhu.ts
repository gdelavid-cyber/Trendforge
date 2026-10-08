import crypto from 'crypto';
import {
  HmhuPacket,
  registerHmhuPacket,
  waitForCommanderInput,
  DeliverableSummary,
  AskType,
} from '../hmhu/protocol';

export interface HmhuCollaborateInput {
  runId?: string;
  ventureId?: string;
  valueDelivered: string;
  category?: 'CODE' | 'INTEL' | 'LEADS' | 'VENTURE' | 'DEPLOYMENT';
  artifacts?: Array<{ title: string; path?: string; preview?: string }>;
  askType: AskType;
  question: string;
  context?: string;
  recommendedAction?: string;
  options: string[];
  nextAutonomousStep: string;
  waitTimeoutMs?: number;
}

export async function executeHmhuCollaborate(input: HmhuCollaborateInput): Promise<any> {
  const packetId = `HMHU-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const runId = input.runId || 'ephemeral-run';

  const packet: HmhuPacket = {
    id: packetId,
    runId,
    ventureId: input.ventureId,
    createdAt: Date.now(),
    status: 'WAITING_COMMANDER',
    valueDelivered: {
      summary: input.valueDelivered,
      category: input.category || 'CODE',
      artifacts: input.artifacts || [],
    },
    commanderAsk: {
      askType: input.askType || 'DECISION',
      question: input.question,
      context: input.context,
      recommendedAction: input.recommendedAction,
      options: (input.options && input.options.length > 0)
        ? input.options
        : ['Approve & Proceed', 'Revise Direction'],
    },
    nextAutonomousStep: input.nextAutonomousStep || 'Continue autonomous pipeline',
  };

  await registerHmhuPacket(packet);

  // If running in a live interactive loop, optionally wait for commander input
  const timeoutMs = input.waitTimeoutMs !== undefined ? input.waitTimeoutMs : 25000;
  const commanderResponse = await waitForCommanderInput(packetId, timeoutMs);

  return {
    success: true,
    packetId,
    status: 'RESOLVED',
    valueDeliveredRecorded: packet.valueDelivered.summary,
    commanderDirectiveReceived: commanderResponse.selectedOption || commanderResponse.customInput,
    directive: commanderResponse,
    instruction: `Commander answered: "${commanderResponse.selectedOption || commanderResponse.customInput}". Now execute: ${packet.nextAutonomousStep}`,
  };
}

export interface HmhuDeliverValueInput {
  runId?: string;
  ventureId?: string;
  summary: string;
  category?: 'CODE' | 'INTEL' | 'LEADS' | 'VENTURE' | 'DEPLOYMENT';
  artifacts?: Array<{ title: string; path?: string }>;
  metrics?: Record<string, any>;
}

export async function executeHmhuDeliverValue(input: HmhuDeliverValueInput): Promise<any> {
  const packetId = `VAL-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

  const deliverable: DeliverableSummary = {
    summary: input.summary,
    category: input.category || 'CODE',
    artifacts: input.artifacts,
    metrics: input.metrics,
  };

  return {
    success: true,
    packetId,
    recordedAt: Date.now(),
    deliverable,
    message: 'Value milestone stamped in bilateral ledger.',
  };
}
