'use client';

import React from 'react';

/**
 * Vector identity portraits of the four anime companions.
 * Same palettes/silhouettes as the 3D rig in AnimeCompanion.tsx —
 * used wherever a live WebGL canvas would be too heavy (lists, bubbles, cards).
 */

export type PortraitArchetype = 'cyber_humanoid' | 'quantum_android' | 'wall_street_titan' | 'cosmic_entity';

const PALETTES: Record<PortraitArchetype, { bg: string; skin: string; skinShade: string; hair: string; hairShade: string; eye: string; accent: string }> = {
  cyber_humanoid: { bg: '#00F0FF', skin: '#f5e7de', skinShade: '#e5cfc2', hair: '#1b2438', hairShade: '#111a2c', eye: '#00d5ee', accent: '#00F0FF' },
  quantum_android: { bg: '#A855F7', skin: '#f7ece4', skinShade: '#e8d6ca', hair: '#dcd2f5', hairShade: '#b9a8ec', eye: '#b48cff', accent: '#A855F7' },
  wall_street_titan: { bg: '#FFD700', skin: '#f6e3d0', skinShade: '#e6cdb4', hair: '#e8c15a', hairShade: '#c2962e', eye: '#ffb52e', accent: '#FFD700' },
  cosmic_entity: { bg: '#EC4899', skin: '#efe6f2', skinShade: '#ded0e2', hair: '#6d5bd0', hairShade: '#54409e', eye: '#ff8ad8', accent: '#EC4899' },
};

export function normalizeArchetype(raw?: string): PortraitArchetype {
  const k = (raw || '').toLowerCase().replace(/\s+/g, '_');
  if (k.includes('quantum') || k.includes('android')) return 'quantum_android';
  if (k.includes('titan') || k.includes('wall')) return 'wall_street_titan';
  if (k.includes('cosmic') || k.includes('entity') || k.includes('nebula')) return 'cosmic_entity';
  return 'cyber_humanoid';
}

export interface CompanionPortraitProps {
  archetype?: string;
  className?: string;
  seed?: number;
}

export function CompanionPortrait({ archetype, className = '', seed = 0 }: CompanionPortraitProps) {
  const arch = normalizeArchetype(archetype);
  const p = PALETTES[arch];
  const delay = `${-(seed % 7) * 0.41}s`;

  return (
    <svg viewBox="0 0 200 200" className={className} role="img" aria-label={`${arch} companion portrait`}>
      <style>{`
        @keyframes cpBob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2.5px); } }
        @keyframes cpBlink { 0%,91%,100% { transform: scaleY(1); } 94%,96% { transform: scaleY(0.07); } }
        @keyframes cpSway { 0%,100% { transform: rotate(-1.8deg); } 50% { transform: rotate(1.8deg); } }
        @keyframes cpDrift { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-1.5px); } }
        .cp-bob { animation: cpBob 3.2s ease-in-out infinite; animation-delay: ${delay}; }
        .cp-blink { transform-box: fill-box; transform-origin: center; animation: cpBlink 4.4s infinite; animation-delay: ${delay}; }
        .cp-sway { transform-box: fill-box; transform-origin: top center; animation: cpSway 3.8s ease-in-out infinite; animation-delay: ${delay}; }
        .cp-drift { animation: cpDrift 2.6s ease-in-out infinite; animation-delay: ${delay}; }
      `}</style>

      {/* ambient backdrop */}
      <defs>
        <radialGradient id={`cpbg-${arch}`} cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor={p.bg} stopOpacity="0.32" />
          <stop offset="70%" stopColor="#0a0c14" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#070810" />
        </radialGradient>
      </defs>
      <rect width="200" height="200" fill={`url(#cpbg-${arch})`} />
      <circle cx="100" cy="96" r="74" fill="none" stroke={p.bg} strokeOpacity="0.22" strokeWidth="1" />
      <circle cx="100" cy="96" r="86" fill="none" stroke={p.bg} strokeOpacity="0.12" strokeWidth="1" />

      <g className="cp-bob">
        {/* ---------------- shoulders / outfit ---------------- */}
        {arch === 'wall_street_titan' ? (
          <g>
            <path d="M28,202 Q38,156 74,148 L126,148 Q162,156 172,202 Z" fill="#181b26" />
            <path d="M88,150 L100,166 L112,150 L118,152 L104,178 L96,178 L82,152 Z" fill="#f4f4f8" />
            <path d="M97,164 L103,164 L107,192 L100,199 L93,192 Z" fill="#d92038" />
            <path d="M74,149 L88,151 L80,168 Z" fill="#10121b" />
            <path d="M126,149 L112,151 L120,168 Z" fill="#10121b" />
          </g>
        ) : arch === 'quantum_android' ? (
          <g>
            <path d="M30,202 Q40,158 74,149 L126,149 Q160,158 170,202 Z" fill="#eef0f8" />
            <path d="M62,162 L58,202" stroke={p.accent} strokeOpacity="0.75" strokeWidth="2.4" fill="none" />
            <path d="M138,162 L142,202" stroke={p.accent} strokeOpacity="0.75" strokeWidth="2.4" fill="none" />
            <path d="M100,158 L106,168 L100,178 L94,168 Z" fill={p.accent} />
            <circle cx="100" cy="168" r="3" fill="#fff" opacity="0.85" />
          </g>
        ) : arch === 'cosmic_entity' ? (
          <g>
            <path d="M34,202 Q42,160 76,150 L124,150 Q158,160 166,202 Z" fill="#191330" />
            <ellipse cx="100" cy="152" rx="30" ry="7" fill={p.hairShade} />
            <ellipse cx="100" cy="150" rx="30" ry="6" fill="none" stroke={p.eye} strokeOpacity="0.5" strokeWidth="1.2" />
            <circle cx="66" cy="176" r="1.6" fill={p.eye} opacity="0.8" className="cp-drift" />
            <circle cx="136" cy="182" r="1.3" fill="#FFD166" opacity="0.8" className="cp-drift" />
            <circle cx="122" cy="172" r="1.1" fill={p.accent} opacity="0.7" className="cp-drift" />
          </g>
        ) : (
          <g>
            <path d="M30,202 Q40,158 74,149 L126,149 Q160,158 170,202 Z" fill="#141824" />
            <rect x="86" y="144" width="28" height="12" rx="4" fill="#0c0f18" />
            <path d="M64,170 L136,170" stroke={p.accent} strokeOpacity="0.9" strokeWidth="2" />
            <path d="M72,182 L128,182" stroke={p.accent} strokeOpacity="0.55" strokeWidth="1.4" />
          </g>
        )}

        {/* neck */}
        <path d="M91,124 L109,124 L109,152 Q100,158 91,152 Z" fill={p.skinShade} />

        {/* ---------------- head ---------------- */}
        <g>
          {/* ears */}
          <circle cx="64" cy="96" r="7" fill={p.skin} />
          <circle cx="136" cy="96" r="7" fill={p.skin} />

          {/* face */}
          <path d="M66,90 Q66,58 100,56 Q134,58 134,90 Q133,118 100,128 Q67,118 66,90 Z" fill={p.skin} />

          {/* eyes */}
          <g className="cp-blink">
            {[85, 115].map((ex) => (
              <g key={ex}>
                <ellipse cx={ex} cy="97" rx="8.4" ry="10.4" fill="#ffffff" />
                <path d={`M${ex - 6},91 q6,-7 12,0 l0,11 q-6,4 -12,0 Z`} fill={p.eye} />
                <ellipse cx={ex} cy="99" rx="3.1" ry="4.4" fill="#181024" />
                <circle cx={ex - 2.6} cy="93.6" r="2.3" fill="#ffffff" opacity="0.95" />
                <circle cx={ex + 2.4} cy="102.5" r="1.1" fill="#ffffff" opacity="0.6" />
              </g>
            ))}
          </g>

          {/* lashes */}
          <path d="M77,90 Q85,84 93,89.5" stroke="#1a1220" strokeWidth="2.6" strokeLinecap="round" fill="none" />
          <path d="M107,89.5 Q115,84 123,90" stroke="#1a1220" strokeWidth="2.6" strokeLinecap="round" fill="none" />

          {/* brows */}
          <path d="M77,81 Q85,77.5 93,80.5" stroke={p.hairShade} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <path d="M107,80.5 Q115,77.5 123,81" stroke={p.hairShade} strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* blush */}
          <ellipse cx="76" cy="110" rx="6.5" ry="3.2" fill="#ff788c" opacity="0.28" />
          <ellipse cx="124" cy="110" rx="6.5" ry="3.2" fill="#ff788c" opacity="0.28" />

          {/* mouth */}
          <path d="M94,114 Q100,119.5 106,114" stroke="#7a3040" strokeWidth="2.2" strokeLinecap="round" fill="none" />

          {/* ---------------- hair ---------------- */}
          {arch === 'cyber_humanoid' && (
            <g>
              <circle cx="100" cy="86" r="39" fill={p.hair} />
              <path d="M63,86 Q64,52 100,49 Q136,52 137,86 L131,86 L127,72 L121,88 L114,70 L108,90 L100,71 L92,91 L86,70 L79,89 L73,73 L69,87 Z" fill={p.hair} />
              <path d="M63,84 L69,96 L73,78 L79,94 L86,74 L92,96 L100,75 L108,95 L114,73 L121,93 L127,75 L131,90 L137,84 L137,80 L63,80 Z" fill={p.hairShade} opacity="0.55" />
              <g className="cp-sway">
                <path d="M62,84 Q46,96 44,128 Q43,152 54,168 Q60,150 58,130 Q57,106 68,92 Z" fill={p.hairShade} />
                <path d="M138,84 Q154,96 156,128 Q157,152 146,168 Q140,150 142,130 Q143,106 132,92 Z" fill={p.hairShade} />
                <circle cx="61" cy="94" r="3.4" fill={p.accent} />
                <circle cx="139" cy="94" r="3.4" fill={p.accent} />
                <circle cx="61" cy="94" r="6.4" fill={p.accent} opacity="0.25" />
                <circle cx="139" cy="94" r="6.4" fill={p.accent} opacity="0.25" />
              </g>
              <path d="M100,47 Q106,38 114,40 Q105,42 104,50 Z" fill={p.hair} />
            </g>
          )}

          {arch === 'quantum_android' && (
            <g>
              <path d="M58,100 Q54,46 100,43 Q146,46 142,100 Q142,122 128,127 L128,96 Q128,72 100,70 Q72,72 72,96 L72,127 Q58,122 58,100 Z" fill={p.hair} />
              <path d="M66,84 Q68,60 100,58 Q132,60 134,84 Q118,78 100,79 Q82,78 66,84 Z" fill={p.hairShade} opacity="0.5" />
              <path d="M64,88 L136,88 L136,96 Q120,90 100,91 Q80,90 64,96 Z" fill={p.hair} />
              <ellipse cx="100" cy="40" rx="27" ry="5.5" fill="none" stroke={p.accent} strokeWidth="2" opacity="0.9" className="cp-sway" />
            </g>
          )}

          {arch === 'wall_street_titan' && (
            <g>
              <path d="M62,92 Q58,50 100,47 Q142,50 138,92 Q140,72 128,62 Q136,74 132,88 Q134,64 100,58 Q66,64 68,88 Q64,74 72,62 Q60,72 62,92 Z" fill={p.hair} />
              <path d="M62,90 Q60,54 100,50 Q140,54 138,90 L134,88 Q136,58 100,54 Q64,58 66,88 Z" fill={p.hairShade} opacity="0.45" />
              <path d="M112,58 Q124,66 120,84 Q118,70 108,62 Z" fill={p.hairShade} />
              <path d="M70,64 Q88,54 108,56 Q90,58 76,68 Z" fill="#fff" opacity="0.14" />
            </g>
          )}

          {arch === 'cosmic_entity' && (
            <g>
              <circle cx="100" cy="84" r="38" fill={p.hair} />
              <path d="M64,84 Q66,52 100,50 Q134,52 136,84 L128,80 Q126,62 100,60 Q74,62 72,80 Z" fill={p.hairShade} opacity="0.5" />
              <path d="M66,80 Q58,92 60,108 Q66,98 72,90 L72,78 Z" fill={p.hair} />
              <path d="M134,80 Q142,92 140,108 Q134,98 128,90 L128,78 Z" fill={p.hair} />
              <g className="cp-sway">
                <path d="M56,104 Q48,118 52,136 Q57,150 50,164 Q64,158 66,140 Q67,120 62,106 Z" fill={p.hairShade} />
                <path d="M144,104 Q152,118 148,136 Q143,150 150,164 Q136,158 134,140 Q133,120 138,106 Z" fill={p.hairShade} />
                <path d="M53,118 l3,6 6,3 -6,3 -3,6 -3,-6 -6,-3 6,-3 Z" fill={p.eye} opacity="0.9" className="cp-drift" />
                <path d="M147,126 l2.4,5 5,2.4 -5,2.4 -2.4,5 -2.4,-5 -5,-2.4 5,-2.4 Z" fill="#FFD166" opacity="0.9" className="cp-drift" />
              </g>
              <path d="M120,64 l3.4,7 7,3.4 -7,3.4 -3.4,7 -3.4,-7 -7,-3.4 7,-3.4 Z" fill="#FFD166" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}

export default CompanionPortrait;
