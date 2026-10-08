import { prisma } from '@/lib/prisma';
import { stationBus } from '../bus';

export type AskType = 'DECISION' | 'CREDENTIAL' | 'APPROVAL' | 'CREATIVE_INPUT' | 'STRATEGY';
export type PacketStatus = 'WAITING_COMMANDER' | 'RESOLVED' | 'SKIPPED';

export interface DeliverableSummary {
  summary: string;
  category?: 'CODE' | 'INTEL' | 'LEADS' | 'VENTURE' | 'DEPLOYMENT';
  artifacts?: Array<{ title: string; path?: string; preview?: string }>;
  metrics?: Record<string, any>;
}

export interface CommanderAsk {
  askType: AskType;
  question: string;
  context?: string;
  recommendedAction?: string;
  options: string[];
}

export interface HmhuPacket {
  id: string;
  runId: string;
  ventureId?: string;
  createdAt: number;
  status: PacketStatus;
  valueDelivered: DeliverableSummary;
  commanderAsk: CommanderAsk;
  nextAutonomousStep: string;
  commanderResponse?: {
    selectedOption?: string;
    customInput?: string;
    respondedAt: number;
  };
}

// In-memory registry for synchronous suspension and active resolution
const activeResolvers = new Map<string, (response: { selectedOption?: string; customInput?: string }) => void>();
const inMemoryPackets = new Map<string, HmhuPacket>();

/**
 * Register a new Help Me Help U symbiotic packet
 */
export async function registerHmhuPacket(packet: HmhuPacket): Promise<HmhuPacket> {
  inMemoryPackets.set(packet.id, packet);

  // Update underlying StarNetJob record if present
  try {
    const job = await prisma.starNetJob.findUnique({ where: { id: packet.runId } });
    if (job) {
      const existingArtifact = (job.resultArtifact as any) || {};
      const packets = Array.isArray(existingArtifact.hmhuPackets) ? existingArtifact.hmhuPackets : [];
      packets.push(packet);

      await prisma.starNetJob.update({
        where: { id: packet.runId },
        data: {
          status: 'WAITING_INPUT',
          resultArtifact: {
            ...existingArtifact,
            hmhuPackets: packets,
            latestPacket: packet,
          },
        },
      });
    }
  } catch (err) {
    console.warn('[HMHU] Failed to sync packet to StarNetJob:', err);
  }

  // Broadcast to live SSE stream
  stationBus.emitEvent({
    runId: packet.runId,
    type: 'hmhu_packet' as any,
    timestamp: Date.now(),
    payload: packet,
  });

  return packet;
}

/**
 * Wait for commander response with optional timeout
 */
export function waitForCommanderInput(packetId: string, timeoutMs: number = 30000): Promise<{ selectedOption?: string; customInput?: string }> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      activeResolvers.delete(packetId);
      const packet = inMemoryPackets.get(packetId);
      const fallback = packet?.commanderAsk.recommendedAction || packet?.commanderAsk.options?.[0] || 'Auto-proceed with default';
      resolve({ selectedOption: fallback });
    }, timeoutMs);

    activeResolvers.set(packetId, (resp) => {
      clearTimeout(timer);
      activeResolvers.delete(packetId);
      resolve(resp);
    });
  });
}

/**
 * Resolve a pending symbiotic ask from the commander
 */
export async function resolveHmhuPacket(
  packetId: string,
  response: { selectedOption?: string; customInput?: string }
): Promise<HmhuPacket | null> {
  const packet = inMemoryPackets.get(packetId);

  // Update in memory
  if (packet) {
    packet.status = 'RESOLVED';
    packet.commanderResponse = {
      selectedOption: response.selectedOption,
      customInput: response.customInput,
      respondedAt: Date.now(),
    };
  }

  // Trigger in-memory deferred resolver if loop is active
  const resolver = activeResolvers.get(packetId);
  if (resolver) {
    resolver(response);
  }

  // Update DB record
  if (packet) {
    try {
      const job = await prisma.starNetJob.findUnique({ where: { id: packet.runId } });
      if (job) {
        const existingArtifact = (job.resultArtifact as any) || {};
        const packets = Array.isArray(existingArtifact.hmhuPackets) ? existingArtifact.hmhuPackets : [];
        const idx = packets.findIndex((p: any) => p.id === packetId);
        if (idx >= 0) {
          packets[idx] = packet;
        } else {
          packets.push(packet);
        }

        await prisma.starNetJob.update({
          where: { id: packet.runId },
          data: {
            status: 'RUNNING',
            resultArtifact: {
              ...existingArtifact,
              hmhuPackets: packets,
              latestPacket: packet,
            },
          },
        });
      }
    } catch (err) {
      console.warn('[HMHU] Failed to persist resolution to DB:', err);
    }

    // Broadcast resolved event
    stationBus.emitEvent({
      runId: packet.runId,
      type: 'hmhu_resolved' as any,
      timestamp: Date.now(),
      payload: packet,
    });
  }

  return packet || null;
}

/**
 * Get active pending packet for a run or venture
 */
export function getPendingPacket(runId?: string): HmhuPacket | undefined {
  for (const p of inMemoryPackets.values()) {
    if (p.status === 'WAITING_COMMANDER') {
      if (!runId || p.runId === runId) return p;
    }
  }
  return undefined;
}

/**
 * Get all packets in memory
 */
export function getAllPackets(ventureId?: string): HmhuPacket[] {
  const all = Array.from(inMemoryPackets.values());
  if (!ventureId) return all;
  return all.filter((p) => p.ventureId === ventureId);
}
