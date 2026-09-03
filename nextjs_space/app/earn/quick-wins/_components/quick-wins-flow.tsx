'use client';

import React, { useState } from 'react';
import { GuidedEarnFlow } from '@/app/earn/start/_components/guided-earn-flow';
import { AgentSwarmDrawer } from '@/components/earn/agent-swarm-drawer';
import { UnitEconomicsModal } from '@/components/earn/unit-economics-modal';
import { FULL_FINANCIAL_MODELS } from '@/lib/earn/agents';
import { Calculator, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { VettedOpportunity } from '@/app/api/earn/opportunities/route';
import type { GuidedLead } from '@/app/api/earn/leads/route';

interface QuickWinsFlowProps {
  initialOpportunities: VettedOpportunity[];
  initialLeads: GuidedLead[];
  userEarnings?: number;
}

export function QuickWinsFlow({
  initialOpportunities,
  initialLeads,
  userEarnings = 0,
}: QuickWinsFlowProps) {
  const [showEconomicsModal, setShowEconomicsModal] = useState(false);
  const model = FULL_FINANCIAL_MODELS['quick-wins-voice'];

  return (
    <div className="relative">
      {/* Molecular Math Banner */}
      <div className="max-w-6xl mx-auto px-4 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
        <div className="flex items-center gap-2 text-[#38bdf8]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>UNIT ECONOMICS: 20 leads needed · 45 min human time · $712.50 net profit/deal</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowEconomicsModal(true)}
          className="h-7 text-[11px] border-[#38bdf8]/30 text-[#38bdf8] hover:bg-[#38bdf8]/10"
        >
          <Calculator className="w-3 h-3 mr-1" /> View Molecular Math ($950/hr)
        </Button>
      </div>

      <GuidedEarnFlow
        initialOpportunities={initialOpportunities}
        initialLeads={initialLeads}
        userEarnings={userEarnings}
      />

      {/* Floating 9-Agent Swarm Drawer */}
      <AgentSwarmDrawer />

      {/* Molecular Economics Modal */}
      <UnitEconomicsModal
        isOpen={showEconomicsModal}
        onClose={() => setShowEconomicsModal(false)}
        model={model}
      />
    </div>
  );
}