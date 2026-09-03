'use client';

import React from 'react';
import { GuidedEarnFlow } from '@/app/earn/start/_components/guided-earn-flow';
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
  return (
    <div>
      <GuidedEarnFlow
        initialOpportunities={initialOpportunities}
        initialLeads={initialLeads}
        userEarnings={userEarnings}
      />
    </div>
  );
}