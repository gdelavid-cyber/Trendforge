'use client';

import React, { useState, useEffect } from 'react';
import { FlowHeader } from './flow-header';
import { Step1Pick } from './step1-pick';
import { Step2Plan } from './step2-plan';
import { Step3Swarm } from './step3-swarm';
import { Step4Buyers } from './step4-buyers';
import { Step5Pipeline } from './step5-pipeline';
import { loadSavedFlowState, saveFlowState } from '@/lib/earn/unlocks';
import type { VettedOpportunity } from '@/app/api/earn/opportunities/route';
import type { GuidedLead } from '@/app/api/earn/leads/route';

interface GuidedEarnFlowProps {
  initialOpportunities: VettedOpportunity[];
  initialLeads: GuidedLead[];
  userEarnings?: number;
}

export function GuidedEarnFlow({
  initialOpportunities,
  initialLeads,
  userEarnings = 0,
}: GuidedEarnFlowProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [opportunities, setOpportunities] = useState<VettedOpportunity[]>(initialOpportunities);
  const [selectedOppId, setSelectedOppId] = useState<string>(initialOpportunities[0]?.id || '');
  const [leads, setLeads] = useState<GuidedLead[]>(initialLeads);
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>(initialLeads.map((l) => l.id));

  useEffect(() => {
    const saved = loadSavedFlowState();
    if (saved?.currentStep && saved.currentStep >= 1 && saved.currentStep <= 5) {
      setCurrentStep(saved.currentStep);
      if (saved.selectedOpportunityId) setSelectedOppId(saved.selectedOpportunityId);
      if (saved.selectedBuyerIds) setSelectedLeadIds(saved.selectedBuyerIds);
    }
  }, []);

  const selectedOpp =
    opportunities.find((o) => o.id === selectedOppId) || opportunities[0] || initialOpportunities[0];

  return (
    <div className="min-h-screen bg-[#06060E] text-white pt-6 pb-20 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <FlowHeader
          currentStep={currentStep}
          onBack={() => setCurrentStep((prev) => Math.max(1, prev - 1))}
        />

        {currentStep === 1 && (
          <Step1Pick
            opportunities={opportunities}
            selectedOppId={selectedOppId}
            onSelect={(id) => setSelectedOppId(id)}
            onShuffle={(newOpps) => setOpportunities(newOpps)}
            onContinue={() => {
              saveFlowState({ currentStep: 2, selectedOpportunityId: selectedOpp?.id });
              setCurrentStep(2);
            }}
          />
        )}

        {currentStep === 2 && (
          <Step2Plan
            selectedOpp={selectedOpp}
            onApprove={(customPrice) => {
              saveFlowState({ currentStep: 3, planApproved: true });
              setCurrentStep(3);
            }}
            onChangeMove={() => setCurrentStep(1)}
          />
        )}

        {currentStep === 3 && (
          <Step3Swarm
            selectedOpp={selectedOpp}
            leads={leads}
            onProceed={() => {
              saveFlowState({ currentStep: 4 });
              setCurrentStep(4);
            }}
          />
        )}

        {currentStep === 4 && (
          <Step4Buyers
            leads={leads}
            onAuthorize={(selectedIds, mode) => {
              setSelectedLeadIds(selectedIds);
              saveFlowState({
                currentStep: 5,
                selectedBuyerIds: selectedIds,
                sentOutreachAt: new Date().toISOString(),
              });
              setCurrentStep(5);
            }}
          />
        )}

        {currentStep === 5 && (
          <Step5Pipeline
            selectedLeadIds={selectedLeadIds}
            leads={leads}
            userEarnings={userEarnings}
          />
        )}
      </div>
    </div>
  );
}