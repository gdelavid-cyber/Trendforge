'use client';

import React, { useState } from 'react';
import { SceneShell } from '@/components/earn/scene-shell';
import { SceneOpportunity } from '@/components/earn/scenes/scene-opportunity';
import { SceneHowItWorks } from '@/components/earn/scenes/scene-how-it-works';
import { SceneSwarmExecution } from '@/components/earn/scenes/scene-swarm-execution';
import { SceneBuyerPipeline } from '@/components/earn/scenes/scene-buyer-pipeline';
import { SceneLaunchEconomics } from '@/components/earn/scenes/scene-launch-economics';
import { BrainstormModal } from '@/components/earn/brainstorm-modal';
import type { EarnMethod } from '@/lib/earn/methods';

interface MethodClientProps {
  method: EarnMethod;
  user?: any;
}

export function MethodClient({ method, user }: MethodClientProps) {
  const [isBrainstormOpen, setIsBrainstormOpen] = useState(false);

  const scenes = method.scenes;

  return (
    <div className="relative w-full h-full">
      <SceneShell
        totalScenes={scenes.length}
        methodNumber={method.number}
        methodTitle={method.title}
      >
        <SceneOpportunity
          method={method}
          scene={scenes[0]}
          onTriggerSwarm={() => setIsBrainstormOpen(true)}
        />
        <SceneHowItWorks
          method={method}
          scene={scenes[1]}
          onTriggerSwarm={() => setIsBrainstormOpen(true)}
        />
        <SceneSwarmExecution
          method={method}
          scene={scenes[2]}
          onTriggerSwarm={() => setIsBrainstormOpen(true)}
        />
        <SceneBuyerPipeline
          method={method}
          scene={scenes[3]}
          onTriggerSwarm={() => setIsBrainstormOpen(true)}
        />
        <SceneLaunchEconomics
          method={method}
          scene={scenes[4]}
          onTriggerSwarm={() => setIsBrainstormOpen(true)}
        />
      </SceneShell>

      {/* Brainstorm Chamber Modal */}
      <BrainstormModal
        isOpen={isBrainstormOpen}
        onClose={() => setIsBrainstormOpen(false)}
        trendTitle={method.title}
      />
    </div>
  );
}