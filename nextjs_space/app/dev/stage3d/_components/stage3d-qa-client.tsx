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
import { canRender3D } from '@/components/avatar/AvatarRenderer';
import { CompanionPortrait } from '@/components/avatar/CompanionPortrait';
import { FighterLoadout } from '@/lib/cosmetics/stats';
import { COSMETICS_CATALOG } from '@/lib/cosmetics/catalog';
import type { AvatarEmotion } from '@/hooks/useAvatar';
import { GuideTour } from '@/components/guide/GuideTour';

type RenderMode = 'auto' | 'force3d' | 'force2d';

const QA_AVATAR_IDS = ['cyber_humanoid', 'quantum_android', 'wall_street_titan', 'cosmic_entity'] as const;
type QaAvatarId = (typeof QA_AVATAR_IDS)[number];

const QA_EMOTIONS: AvatarEmotion[] = ['neutral', 'confident', 'happy', 'surprised', 'thinking', 'battle'];

export function Stage3DQaClient() {
  const [renderMode, setRenderMode] = useState<RenderMode>('auto');
  const [testGlbUrl, setTestGlbUrl] = useState<string>('');
  const [glbLoadError, setGlbLoadError] = useState<string | null>(null);
  const [qaAvatarId, setQaAvatarId] = useState<QaAvatarId>('cyber_humanoid');
  const [qaEmotion, setQaEmotion] = useState<AvatarEmotion>('confident');
  const [qaSpeaking, setQaSpeaking] = useState<boolean>(false);
  const [qaWorking, setQaWorking] = useState<boolean>(false);

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

        {/* Companion Model Controls: avatar / emotion / speech */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-3 border-t border-white/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#FFD700]" />
            <span className="font-bold text-white uppercase">Companion Rig:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1 p-1 rounded-lg bg-black/60 border border-white/10">
              {QA_AVATAR_IDS.map((id) => (
                <button
                  key={id}
                  onClick={() => setQaAvatarId(id)}
                  className={`px-2 py-1 rounded-md font-bold uppercase transition-all ${
                    qaAvatarId === id
                      ? 'bg-[#00F0FF] text-black shadow-[0_0_10px_rgba(0,240,255,0.35)]'
                      : 'text-[#8E9BB4] hover:text-white'
                  }`}
                >
                  {id.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-black/60 border border-white/10">
              {QA_EMOTIONS.map((emo) => (
                <button
                  key={emo}
                  onClick={() => setQaEmotion(emo)}
                  className={`px-2 py-1 rounded-md font-bold uppercase transition-all ${
                    qaEmotion === emo
                      ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                      : 'text-[#8E9BB4] hover:text-white'
                  }`}
                >
                  {emo}
                </button>
              ))}
            </div>
            <button
              onClick={() => setQaSpeaking((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase transition-all border ${
                qaSpeaking
                  ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.3)]'
                  : 'bg-black/60 border-white/10 text-[#8E9BB4] hover:text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{qaSpeaking ? 'Speaking' : 'Silent'}</span>
            </button>
            <button
              onClick={() => setQaWorking((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold uppercase transition-all border ${
                qaWorking
                  ? 'bg-amber-500/20 border-amber-400/50 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'bg-black/60 border-white/10 text-[#8E9BB4] hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>{qaWorking ? 'Working' : 'Idle'}</span>
            </button>
          </div>
        </div>
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
                avatarId={qaAvatarId}
                emotion={qaEmotion}
                isSpeaking={qaSpeaking}
                isWorking={qaWorking}
                workLabel="Scanning Polymarket orderbook"
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
            <span>Camera FOV: 35 | Continuous Frameloop</span>
          </div>
        </div>

        {/* =======================================================================
            VIEWPORT 2: VECTOR IDENTITY PORTRAIT (2D SYSTEM)
        ======================================================================= */}
        <div className="glass-card p-6 rounded-3xl border border-white/10 bg-[#0B0B14]/90 flex flex-col justify-between relative min-h-[520px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 font-mono">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white uppercase">Vector Identity Portrait (2D System)</h2>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <Eye className="w-3 h-3" />
              <span>SVG</span>
            </div>
          </div>

          {/* Portrait Viewport Center */}
          <div className="relative flex-1 w-full h-[400px] flex items-center justify-center bg-black/40 rounded-2xl border border-white/5 overflow-hidden">
            <CompanionPortrait
              archetype={qaAvatarId}
              className="h-full max-h-[380px] aspect-square"
            />
          </div>

          <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#8E9BB4]">
            <span>Blinks, bobs, sways — zero WebGL cost</span>
            <span>Same cast as the 3D rig</span>
          </div>
        </div>
      </div>

      <GuideTour
        id="stage3d-qa"
        steps={[
          { title: 'Live 3D Stage', body: 'The real-time WebGL rig. Drag anywhere on the viewport to orbit the camera — it also slow-orbits on its own when you leave it alone.' },
          { title: 'Companion Rig Controls', body: 'Switch between the four characters (KAIROS, UNIT-Ω, MIDAS, VEIL). Each has its own hair, outfit and silhouette. Emotions repaint the face and re-pose the body — try Battle vs Thinking.' },
          { title: 'Eyes Follow You', body: 'The 3D eyeballs track your cursor with micro-saccades, like a real person scanning a room. Move your mouse across the stage and watch the pupils.' },
          { title: 'Speech & Work Modes', body: 'SPEAKING makes the mouth flap and adds hand gestures. WORKING deploys a holographic task panel — typing hands, code equalizer bars, data motes and a progress halo showing the task running.' },
          { title: 'GLB Injection', body: 'Paste any .glb URL to swap in a custom model — useful for testing externally authored assets against the same stage.' },
          { title: 'Vector Portrait', body: 'The right viewport shows the same character as an animated SVG identity card — this is what runs in lists and chat bubbles where live 3D would be too heavy.' },
        ]}
      />
    </div>
  );
}
