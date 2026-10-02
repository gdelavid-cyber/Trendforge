/**
 * Trendly Venture OS — Fulfillment Engine & QA Inspection
 * 
 * Governs the execution, verification, QA inspection, and customer delivery of orders.
 * Enforces that generating an artifact alone does NOT constitute verified delivery.
 */

import { prisma } from '@/lib/prisma';
import { FulfillmentStatus } from '@prisma/client';
import { instrumentedJevCall } from '@/lib/observability/collector';

export interface UpdateOrderProgressInput {
  orderId: string;
  status: FulfillmentStatus;
  artifacts?: Array<{ name: string; url: string; hash?: string; type: string }>;
  notes?: string;
  qaScore?: number;
}

export interface VerifyDeliveryInput {
  orderId: string;
  inspectionCriteria: Array<{ item: string; passed: boolean; note?: string }>;
}

/**
 * Updates order progress and appends delivery artifacts.
 */
export async function updateFulfillmentOrder(input: UpdateOrderProgressInput) {
  const { orderId, status, artifacts, notes, qaScore } = input;

  const order = await prisma.fulfillmentOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error(`FulfillmentOrder not found: ${orderId}`);
  }

  const existingArtifacts = (order.deliveryArtifacts as any[]) || [];
  const mergedArtifacts = artifacts ? [...existingArtifacts, ...artifacts] : existingArtifacts;

  const data: any = {
    status,
    deliveryArtifacts: mergedArtifacts,
  };

  if (qaScore !== undefined) data.qualityScore = qaScore;
  if (notes) data.verificationNotes = `${order.verificationNotes ? order.verificationNotes + '\n' : ''}[${new Date().toISOString()}] ${notes}`;
  if (status === 'DELIVERED') data.deliveredAt = new Date();
  if (status === 'ACCEPTED') data.customerAcceptedAt = new Date();
  if (status === 'DISPUTED') data.disputedAt = new Date();

  return prisma.fulfillmentOrder.update({
    where: { id: orderId },
    data,
  });
}

/**
 * Performs automated QA inspection on a fulfillment order before delivery.
 * Evaluates completion criteria and gates delivery through Jev 'completion' gate.
 */
export async function inspectAndVerifyOrder(input: VerifyDeliveryInput) {
  const { orderId, inspectionCriteria } = input;

  const order = await prisma.fulfillmentOrder.findUnique({
    where: { id: orderId },
    include: { venture: true, customer: true },
  });

  if (!order) {
    throw new Error(`Order not found: ${orderId}`);
  }

  const totalCriteria = inspectionCriteria.length;
  const passedCriteria = inspectionCriteria.filter((c) => c.passed).length;
  const calculatedScore = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0;

  // Jev completion gate verification
  let verifiedScore = calculatedScore;
  try {
    const { askJev } = await import('@/lib/intelligence/decision/jev');
    const questions = {
      delivery_quality: { type: 'score', description: 'Quality score 0-100', min: 0, max: 100 },
    };
    const jevRes = await instrumentedJevCall(
      {
        gateType: 'completion',
        threshold: 0.80,
        state: { orderId, calculatedScore, inspectionCriteria },
        questions,
      },
      () => askJev({ orderId, calculatedScore, inspectionCriteria }, questions)
    );
    const scoreVal = (jevRes as any)?.decision?.delivery_quality;
    if (typeof scoreVal === 'number') verifiedScore = scoreVal > 1 ? scoreVal : Math.round(scoreVal * 100);
  } catch (_) {
    verifiedScore = calculatedScore;
  }
  const isApproved = verifiedScore >= 80 && passedCriteria === totalCriteria;

  const newStatus: FulfillmentStatus = isApproved ? 'DELIVERED' : 'IN_PROGRESS';
  const notes = isApproved
    ? `QA Inspection Passed (${verifiedScore.toFixed(0)}%). All ${totalCriteria} criteria satisfied. Promoted to DELIVERED.`
    : `QA Inspection Incomplete (${verifiedScore.toFixed(0)}%). ${totalCriteria - passedCriteria} criteria failed. Retained in IN_PROGRESS.`;

  const updatedOrder = await updateFulfillmentOrder({
    orderId,
    status: newStatus,
    qaScore: Math.round(verifiedScore),
    notes,
  });

  return {
    order: updatedOrder,
    isApproved,
    qualityScore: Math.round(verifiedScore),
    passedCriteria,
    totalCriteria,
  };
}

/**
 * Customer accepts order delivery.
 * Updates order, customer stats, and logs success in venture memory.
 */
export async function customerAcceptOrder(orderId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.fulfillmentOrder.update({
      where: { id: orderId },
      data: {
        status: 'ACCEPTED',
        customerAcceptedAt: new Date(),
      },
      include: { venture: true, customer: true },
    });

    // Record verified completion memory
    await tx.ventureMemory.create({
      data: {
        ventureId: order.ventureId,
        category: 'LESSON',
        insight: `Fulfillment successfully accepted for customer "${order.customer.name}" with QA score ${order.qualityScore ?? 100}%.`,
        supportingData: { orderId, artifactsCount: (order.deliveryArtifacts as any[]).length },
        confidence: 0.95,
      },
    });

    return order;
  });
}
