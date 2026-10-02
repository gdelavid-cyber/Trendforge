/**
 * Trendly Venture OS — Customer Engine & CRM
 * 
 * Manages customer lifecycle, lead qualification scoring, channel attribution,
 * and pipeline transitions.
 */

import { prisma } from '@/lib/prisma';
import { LeadPipelineStage, Prisma } from '@prisma/client';
import { instrumentedJevCall } from '@/lib/observability/collector';

export interface CreateLeadInput {
  ventureId: string;
  sourceChannel: string; // 'reddit' | 'linkedin' | 'email' | 'organic' | 'twitter'
  contactHandle: string;
  contactProfileUrl?: string;
  problemExcerpt?: string;
  qualificationNotes?: string;
  intentScore?: number;
}

export interface TransitionLeadStageInput {
  leadId: string;
  toStage: LeadPipelineStage;
  notes?: string;
}

export interface CreateCustomerInput {
  ventureId: string;
  name: string;
  email?: string;
  company?: string;
  stripeCustomerId?: string;
  acquisitionCostCents?: number;
}

/**
 * Creates and scores a new inbound or outbound lead for a venture.
 */
export async function createVentureLead(input: CreateLeadInput) {
  let score = input.intentScore ?? 50;

  // If problem excerpt provided, run automated Jev lead qualification
  if (input.problemExcerpt) {
    try {
      const { askJev } = await import('@/lib/intelligence/decision/jev');
      const questions = {
        buyer_intent: { type: 'score', description: 'Buyer intent 0-100', min: 0, max: 100 },
      };
      const jevRes = await instrumentedJevCall(
        {
          gateType: 'lead_qualification',
          threshold: 0.75,
          state: { handle: input.contactHandle, excerpt: input.problemExcerpt, channel: input.sourceChannel },
          questions,
        },
        () => askJev({ handle: input.contactHandle, excerpt: input.problemExcerpt, channel: input.sourceChannel }, questions)
      );
      const scoreVal = (jevRes as any)?.decision?.buyer_intent;
      if (typeof scoreVal === 'number') score = scoreVal > 1 ? scoreVal : Math.round(scoreVal * 100);
    } catch (_) {
      let s = 50;
      const text = input.problemExcerpt.toLowerCase();
      if (text.includes('buy') || text.includes('pay') || text.includes('pricing')) s += 30;
      if (text.includes('urgent') || text.includes('asap')) s += 15;
      score = Math.min(100, s);
    }
  }

  const initialStage = score >= 75 ? LeadPipelineStage.QUALIFIED : LeadPipelineStage.NEW;

  const lead = await prisma.ventureLead.create({
    data: {
      ventureId: input.ventureId,
      sourceChannel: input.sourceChannel,
      contactHandle: input.contactHandle,
      contactProfileUrl: input.contactProfileUrl || null,
      intentScore: score,
      pipelineStage: initialStage,
      qualificationNotes: input.qualificationNotes || (input.problemExcerpt ? `Inquiry: "${input.problemExcerpt.substring(0, 200)}"` : null),
    },
  });

  return lead;
}

/**
 * Transitions a lead through the CRM pipeline.
 */
export async function transitionLeadStage(input: TransitionLeadStageInput) {
  const { leadId, toStage, notes } = input;

  const lead = await prisma.ventureLead.findUnique({
    where: { id: leadId },
  });

  if (!lead) {
    throw new Error(`Lead not found: ${leadId}`);
  }

  const updatedNotes = notes
    ? `${lead.qualificationNotes ? lead.qualificationNotes + '\n' : ''}[${new Date().toISOString()}] Stage -> ${toStage}: ${notes}`
    : lead.qualificationNotes;

  const updated = await prisma.ventureLead.update({
    where: { id: leadId },
    data: {
      pipelineStage: toStage,
      qualificationNotes: updatedNotes,
      lastContactedAt: new Date(),
    },
  });

  // If stage is WON, ensure a Customer record exists
  if (toStage === LeadPipelineStage.WON && !lead.customerId) {
    const customer = await prisma.ventureCustomer.create({
      data: {
        ventureId: lead.ventureId,
        name: lead.contactHandle,
        status: 'ACTIVE',
      },
    });

    await prisma.ventureLead.update({
      where: { id: leadId },
      data: { customerId: customer.id },
    });
  }

  return updated;
}

/**
 * Creates or retrieves a verified customer record.
 */
export async function createVentureCustomer(input: CreateCustomerInput) {
  return prisma.ventureCustomer.create({
    data: {
      ventureId: input.ventureId,
      name: input.name,
      email: input.email || null,
      company: input.company || null,
      stripeCustomerId: input.stripeCustomerId || null,
      acquisitionCostCents: input.acquisitionCostCents ?? 0,
      status: 'ACTIVE',
    },
  });
}

/**
 * Gets CRM metrics and conversion pipeline stats for a venture.
 */
export async function getVenturePipelineMetrics(ventureId: string) {
  const leads = await prisma.ventureLead.findMany({
    where: { ventureId },
  });

  const stageCounts: Record<string, number> = {
    NEW: 0,
    QUALIFIED: 0,
    PROPOSAL_SENT: 0,
    NEGOTIATING: 0,
    WON: 0,
    LOST: 0,
    CHURNED: 0,
  };

  for (const l of leads) {
    stageCounts[l.pipelineStage] = (stageCounts[l.pipelineStage] || 0) + 1;
  }

  const totalLeads = leads.length;
  const wonCount = stageCounts.WON || 0;
  const conversionRatePct = totalLeads > 0 ? Math.round((wonCount / totalLeads) * 1000) / 10 : 0;

  return {
    totalLeads,
    stageCounts,
    wonCount,
    conversionRatePct,
  };
}
