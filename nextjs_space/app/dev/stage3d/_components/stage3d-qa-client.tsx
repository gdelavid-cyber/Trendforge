'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Boxes,
  Layers,
  Sparkles,
  Sliders,
  Shield,
  Zap,
  Flame,
  Crown,
  Swords,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Stage3D } from '@/components/avatar/stage3d/Stage3D';
import { AvatarRenderer, canRender3D } from '@/components/avatar/AvatarRenderer';
import { FighterLoadout } from '@/lib/cosmetics/stats';
import { COSMETICS_CATALOG } from '@/lib/cosmetics/catalog';

type RenderMode = 'auto' | 'force3d' | 'force2d';

export function Stage3DQaClient() {
  const [renderMode, setRenderMode] = useState<RenderMode>('auto');
  const [testGlbUrl, setTestGlbUrl] = useState<string>('');
  const [glbLoadError, setGlbLoadError] = useState<string | null>(null);

  const [currentLoadout, setCurrentLoadout] = useState<FighterLoadout>({
    HEAD: 'head_diamond_crown',
    BODY: 'skin_neon_cyber',
    AURA: 'aura_plasma_fire',
    TRAIL: 'wings_overclock',
    FINISHER: 'anim_matrix_dodge',
  });

  const gateResult = canRender3D(currentLoadout);

  const is3DActive =
    renderMode === 'force3d' ? true : renderMode === 'force2d' ? false : gateResult;

  const handleGlbUrlSubmit = (url: string) => {
    setTestGlbUrl(url);
    setGlbLoadError(null);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-8">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/25 text-[#00F0FF] text-xs font-mono uppercase tracking-wider mb-2">
            <Boxes className="w-3.5 h-3.5" />
            <span>DEV QA // STAGE3D ENGINE HARNESS & COMPARISON BOOTH</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black font-orbitron uppercase tracking-widest text-white">
            Stage3D <span className="cyan-gold-gradient-text">Harness</span>
          </h1>
          <p className="text-xs md:text-sm text-[#8E9BB4] font-mono mt-1">
            Side-by-side progressive enhancement testing: Stage3D vs Layered 2D Renderer.
          </p>
        </div>

        {/* Render Mode Toggle Switch */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/60 border border-white/10 font-mono text-xs">
          {(['auto', 'force3d', 'force2d'] as RenderMode[]).map((mode) => {
            const isActive = renderMode === mode;
            const labels = {
              auto: `Auto (Gate: ${gateResult ? '3D' : '2D'})`,
              force3d: 'Force 3D',
              force2d: 'Force 2D',
            };

            return (
              <button
                key={mode}
                onClick={() => setRenderMode(mode)}
                className={`px-3 py-1.5 rounded-lg font-bold uppercase transition-all ${
                  isActive
                    ? 'bg-[#00F0FF] text-black shadow-[0_0_12px_rgba(0,240,255,0.4)]'
                    : 'text-[#8E9BB4] hover:text-white'
                }`}
              >
                {labels[mode]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Test Controls Bar */}
      <div className="glass-card p-4 rounded-2xl border border-white/10 mb-8 bg-[#0B0B14] space-y-3 font-mono text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00F0FF]" />
            <span className="font-bold text-white uppercase">Test GLB Asset Injection (Optional):</span>
          </div>
          <div className="flex items-center gap-2 flex-1 max-w-xl">
            <Input
              value={testGlbUrl}
              onChange={(e) => handleGlbUrlSubmit(e.target.value)}
              placeholder="https://.../model.glb"
              className="bg-black/60 border-white/15 text-white font-mono text-xs h-9 rounded-lg"
            />
            {testGlbUrl && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestGlbUrl('')}
                className="h-9 text-xs border-white/20 text-[#8E9BB4] hover:text-white"
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {glbLoadError && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>GLB Load Error: {glbLoadError} — Falling back to 3D Mannequin safely.</span>
          </div>
        )}
      </div>

      {/* =========================================================================
          SIDE-BY-SIDE COMPARISON VIEWPORT
      ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* =======================================================================
            VIEWPORT 1: STAGE3D VIEWPORT (R3F WebGL Canvas)
        ======================================================================= */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#0B0B14]/90 flex flex-col justify-between relative min-h-[520px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 font-mono">
            <div className="flex items-center gap-2">
              <Boxes className="w-4 h-4 text-[#00F0FF]" />
              <h2 className="text-sm font-bold text-white uppercase">Stage3D Canvas (R3F)</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-[#00F0FF]/15 border border-[#00F0FF]/30 text-[#00F0FF]">
              <CheckCircle2 className="w-3 h-3" />
              <span>ACTIVE STAGE</span>
            </div>
          </div>

          {/* 3D Viewport Center */}
          <div className="relative flex-1 w-full h-[400px] flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
            {is3DActive ? (
              <Stage3D
                loadout={currentLoadout}
                overrideGlbUrl={testGlbUrl || undefined}
                fallback={
                  <div className="flex flex-col items-center justify-center gap-2 text-center p-6 text-[#8E9BB4] font-mono text-xs">
                    <AlertTriangle className="w-6 h-6 text-amber-400" />
                    <span>WebGL fallback triggered</span>
                  </div>
                }
                className="w-full h-full"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-center p-6 text-[#8E9BB4] font-mono text-xs">
                <Layers className="w-6 h-6 text-[#00F0FF]" />
                <span className="text-white font-bold">2D Fallback Render Active</span>
                <span className="text-[10px]">
                  Gate resolved to Layered 2D (all current catalog items lack model3d config).
                </span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#8E9BB4]">
            <span>Orbit Controls: Drag to inspect</span>
            <span>Camera FOV: 35 | Demand Frameloop</span>
          </div>
        </div>

        {/* =======================================================================
            VIEWPORT 2: LAYERED 2D AVATAR RENDERER (CONTROL)
        ======================================================================= */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#0B0B14]/90 flex flex-col justify-between relative min-h-[520px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 font-mono">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase">Layered 2D AvatarRenderer (Control)</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Eye className="w-3 h-3" />
              <span>CONTROL</span>
            </div>
          </div>

          {/* 2D Viewport Center */}
          <div className="relative flex-1 w-full h-[400px] flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
            <AvatarRenderer
              avatarId="cyber_humanoid"
              loadout={currentLoadout}
              size="stage"
              mood="battle"
              animated={true}
              interactive={true}
              showParallax={true}
            />
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#8E9BB4]">
            <span>Parallax: Pointer hover</span>
            <span>Layer Stack: 5 Layers (Aura &rarr; Base &rarr; Overlays)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
