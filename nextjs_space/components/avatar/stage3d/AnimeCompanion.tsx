'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, RoundedBox, Html } from '@react-three/drei';
import * as THREE from 'three';
import { FighterLoadout } from '@/lib/cosmetics/stats';
import { COSMETICS_CATALOG, CatalogItem } from '@/lib/cosmetics/catalog';
import type { AvatarEmotion } from '@/hooks/useAvatar';

/* ------------------------------------------------------------------ */
/* Shared toon shading                                                  */
/* ------------------------------------------------------------------ */

// 3-step luminance ramp gives the cel-shaded anime banding
const TOON_RAMP = (() => {
  const tex = new THREE.DataTexture(new Uint8Array([90, 90, 90, 255, 190, 190, 190, 255, 255, 255, 255, 255]), 3, 1, THREE.RGBAFormat);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
})();

interface CharPalette {
  skin: string;
  hair: string;
  hairShade: string;
  eye: string;
  outfit: string;
  outfitDark: string;
  accent: string;
  line: string;
}

type ArchKey = 'cyber_humanoid' | 'quantum_android' | 'wall_street_titan' | 'cosmic_entity';

export const CHARACTERS: Record<ArchKey, CharPalette> = {
  cyber_humanoid: {
    skin: '#f5e7de', hair: '#1b2438', hairShade: '#111a2c', eye: '#00d5ee',
    outfit: '#141824', outfitDark: '#0c0f18', accent: '#00F0FF', line: '#05070d',
  },
  quantum_android: {
    skin: '#f7ece4', hair: '#dcd2f5', hairShade: '#b9a8ec', eye: '#b48cff',
    outfit: '#eef0f8', outfitDark: '#c9cce0', accent: '#A855F7', line: '#221c38',
  },
  wall_street_titan: {
    skin: '#f6e3d0', hair: '#e8c15a', hairShade: '#c2962e', eye: '#ffb52e',
    outfit: '#181b26', outfitDark: '#10121b', accent: '#FFD700', line: '#0a0804',
  },
  cosmic_entity: {
    skin: '#efe6f2', hair: '#6d5bd0', hairShade: '#54409e', eye: '#ff8ad8',
    outfit: '#191330', outfitDark: '#100b20', accent: '#EC4899', line: '#0a0716',
  },
};

const INK = new THREE.MeshBasicMaterial({ color: '#060810', side: THREE.BackSide });

function toon(color: string, opts?: { emissive?: string; ei?: number }): THREE.Material {
  const m = new THREE.MeshToonMaterial({ color, gradientMap: TOON_RAMP });
  if (opts?.emissive) {
    m.emissive = new THREE.Color(opts.emissive);
    m.emissiveIntensity = opts.ei ?? 0.25;
  }
  return m;
}

/** Ink-outline pair: primary toon mesh + inverted-hull backface shell */
function M({
  geo,
  color,
  outline = true,
  emissive,
  ei,
  ...rest
}: {
  geo: React.ReactNode;
  color: string;
  outline?: boolean;
  emissive?: string;
  ei?: number;
} & Omit<React.ComponentProps<'mesh'>, 'geometry' | 'material'>) {
  const mat = useMemo(() => toon(color, { emissive, ei }), [color, emissive, ei]);
  return (
    <group {...(rest as any)}>
      <mesh castShadow>
        {geo}
        <primitive object={mat} attach="material" />
      </mesh>
      {outline && (
        <mesh scale={1.04}>
          {geo}
          <primitive object={INK} attach="material" />
        </mesh>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Painted face                                                         */
/* ------------------------------------------------------------------ */

const FACE_SIZE = 1024;
// SphereGeometry front (+Z) sits at u=0.25
const FCX = FACE_SIZE * 0.25;

type FaceState = 'open' | 'talk' | 'blink';

const faceCache = new Map<string, THREE.CanvasTexture>();

function faceTextureKey(arch: ArchKey, emotion: AvatarEmotion, state: FaceState): string {
  return `${arch}:${emotion}:${state}`;
}

function getFace(arch: ArchKey, emotion: AvatarEmotion, state: FaceState, paintOpen = true): THREE.CanvasTexture {
  const key = faceTextureKey(arch, emotion, state);
  const hit = faceCache.get(key);
  if (hit) return hit;

  const p = CHARACTERS[arch];
  const cv = document.createElement('canvas');
  cv.width = cv.height = FACE_SIZE;
  const c = cv.getContext('2d')!;

  // full-skin base; features live only in the +Z face zone
  c.fillStyle = p.skin;
  c.fillRect(0, 0, FACE_SIZE, FACE_SIZE);

  const eyeY = 480;
  const dx = 92;
  const rx = 48;
  const ry = 60;
  const lash = p.line;

  // forehead shadow cast by bangs — sells anime depth instantly
  const fg = c.createLinearGradient(0, 240, 0, 430);
  fg.addColorStop(0, 'rgba(20,16,32,0.22)');
  fg.addColorStop(1, 'rgba(20,16,32,0)');
  c.fillStyle = fg;
  c.fillRect(FCX - 220, 240, 440, 200);

  function eye(x: number, tilt: number, lid: number, irisScale = 1, pupilShift = 0) {
    // open-eye internals are handled by the real 3D eyeballs when paintOpen is false
    if (!paintOpen) return;
    c.save();
    c.translate(x, eyeY);
    c.rotate(tilt);

    // sclera
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.ellipse(0, 0, rx * irisScale, ry * irisScale, 0, 0, Math.PI * 2);
    c.fill();

    // iris — vertical gradient reads as anime glass eye
    const iw = rx * 0.72 * irisScale;
    const ih = ry * 0.86 * irisScale;
    const gx = pupilShift;
    const ig = c.createLinearGradient(0, -ih, 0, ih);
    ig.addColorStop(0, shade(p.eye, -35));
    ig.addColorStop(0.55, p.eye);
    ig.addColorStop(1, shade(p.eye, 40));
    c.fillStyle = ig;
    c.beginPath();
    c.ellipse(gx, 2, iw, ih, 0, 0, Math.PI * 2);
    c.fill();

    // pupil
    c.fillStyle = '#160c22';
    c.beginPath();
    c.ellipse(gx, 4, iw * 0.42, ih * 0.5, 0, 0, Math.PI * 2);
    c.fill();

    // highlights
    c.fillStyle = 'rgba(255,255,255,0.95)';
    c.beginPath();
    c.arc(-iw * 0.34, -ih * 0.38, iw * 0.3, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.65)';
    c.beginPath();
    c.arc(iw * 0.3, ih * 0.34, iw * 0.14, 0, Math.PI * 2);
    c.fill();

    // upper lid cover (smug / sleepy)
    if (lid > 0) {
      c.fillStyle = p.skin;
      c.beginPath();
      c.rect(-rx - 6, -ry - 8, (rx + 6) * 2, ry * lid + 8);
      c.fill();
    }

    // lash line
    c.strokeStyle = lash;
    c.lineWidth = 14;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-rx - 4, -ry * (1 - lid) - 2);
    c.quadraticCurveTo(0, -ry * (1 - lid) - 16, rx + 4, -ry * (1 - lid) - 4);
    c.stroke();
    c.restore();
  }

  function closedEye(x: number, dir: 1 | -1) {
    c.strokeStyle = lash;
    c.lineWidth = 13;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(x - rx * 0.8, eyeY);
    c.quadraticCurveTo(x, eyeY + dir * 34, x + rx * 0.8, eyeY);
    c.stroke();
  }

  function brow(x: number, ang: number, lift: number) {
    c.save();
    c.translate(x, eyeY - 108 + lift);
    c.rotate(ang);
    c.strokeStyle = shade(p.hair, -20);
    c.lineWidth = 12;
    c.lineCap = 'round';
    c.beginPath();
    c.moveTo(-34, 4);
    c.quadraticCurveTo(0, -6, 34, 2);
    c.stroke();
    c.restore();
  }

  function blush(alpha: number) {
    c.fillStyle = `rgba(255,120,140,${alpha})`;
    [-1, 1].forEach((s) => {
      c.beginPath();
      c.ellipse(FCX + s * 158, eyeY + 96, 40, 20, 0, 0, Math.PI * 2);
      c.fill();
    });
  }

  function mouth(kind: 'smile' | 'smirk' | 'o' | 'flat' | 'grin' | 'talkOpen' | 'none') {
    const mx = FCX;
    const my = 640;
    c.strokeStyle = '#7a3040';
    c.fillStyle = '#5c1f30';
    c.lineWidth = 11;
    c.lineCap = 'round';
    switch (kind) {
      case 'smile':
        c.beginPath();
        c.moveTo(mx - 30, my);
        c.quadraticCurveTo(mx, my + 34, mx + 30, my);
        c.stroke();
        break;
      case 'smirk':
        c.beginPath();
        c.moveTo(mx - 26, my + 4);
        c.quadraticCurveTo(mx + 6, my + 18, mx + 34, my - 8);
        c.stroke();
        break;
      case 'o':
        c.fillStyle = '#5c1f30';
        c.beginPath();
        c.ellipse(mx, my + 8, 20, 28, 0, 0, Math.PI * 2);
        c.fill();
        break;
      case 'flat':
        c.beginPath();
        c.moveTo(mx - 22, my);
        c.lineTo(mx + 22, my);
        c.stroke();
        break;
      case 'grin':
        c.beginPath();
        c.moveTo(mx - 40, my - 6);
        c.quadraticCurveTo(mx, my + 56, mx + 40, my - 6);
        c.closePath();
        c.fill();
        c.fillStyle = '#ff7d94';
        c.beginPath();
        c.ellipse(mx, my + 30, 20, 12, 0, 0, Math.PI * 2);
        c.fill();
        break;
      case 'talkOpen':
        c.beginPath();
        c.ellipse(mx, my + 10, 24, 38, 0, 0, Math.PI * 2);
        c.fill();
        c.fillStyle = '#ff7d94';
        c.beginPath();
        c.ellipse(mx, my + 34, 14, 10, 0, 0, Math.PI * 2);
        c.fill();
        break;
      default:
        break;
    }
  }

  switch (emotion) {
    case 'happy':
      closedEye(FCX - dx, -1);
      closedEye(FCX + dx, -1);
      brow(FCX - dx, 0.05, 0);
      brow(FCX + dx, -0.05, 0);
      blush(0.3);
      mouth(state === 'talk' ? 'talkOpen' : 'grin');
      break;
    case 'surprised':
      eye(FCX - dx, 0, 0, 1.12);
      eye(FCX + dx, 0, 0, 1.12);
      brow(FCX - dx, -0.12, -14);
      brow(FCX + dx, 0.12, -14);
      blush(0.15);
      mouth('o');
      break;
    case 'thinking':
      eye(FCX - dx, 0, 0.42, 0.94, -14);
      eye(FCX + dx, 0, 0.42, 0.94, -14);
      brow(FCX - dx, 0.16, 4);
      brow(FCX + dx, -0.02, 10);
      mouth('flat');
      // anime thought-sweat
      c.fillStyle = 'rgba(120,210,255,0.85)';
      c.beginPath();
      c.moveTo(FCX + 208, 350);
      c.quadraticCurveTo(FCX + 236, 402, FCX + 208, 420);
      c.quadraticCurveTo(FCX + 182, 400, FCX + 208, 350);
      c.fill();
      break;
    case 'battle':
      eye(FCX - dx, 0.16, 0.2, 0.92);
      eye(FCX + dx, -0.16, 0.2, 0.92);
      brow(FCX - dx, 0.3, -6);
      brow(FCX + dx, -0.3, -6);
      mouth(state === 'talk' ? 'talkOpen' : 'grin');
      break;
    case 'confident':
      eye(FCX - dx, 0.05, 0.34, 0.9);
      eye(FCX + dx, -0.05, 0.34, 0.9);
      brow(FCX - dx, 0.08, 2);
      brow(FCX + dx, -0.08, 2);
      mouth('smirk');
      break;
    default:
      eye(FCX - dx, 0, 0.08);
      eye(FCX + dx, 0, 0.08);
      brow(FCX - dx, 0.04, 0);
      brow(FCX + dx, -0.04, 0);
      mouth(state === 'talk' ? 'talkOpen' : 'smile');
      break;
  }

  if (state === 'blink') {
    // repaint eyes region as closed lash lines
    c.fillStyle = p.skin;
    c.fillRect(FCX - dx - rx - 30, eyeY - ry - 60, (dx + rx + 30) * 2, ry * 2 + 110);
    closedEye(FCX - dx, 1);
    closedEye(FCX + dx, 1);
  }

  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  faceCache.set(key, tex);
  return tex;
}

function shade(hex: string, amt: number): string {
  const col = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  col.getHSL(hsl);
  col.setHSL(hsl.h, hsl.s, THREE.MathUtils.clamp(hsl.l + amt / 100, 0, 1));
  return `#${col.getHexString()}`;
}

/* ------------------------------------------------------------------ */
/* Cosmetics (chibi-scaled adapters onto the catalog ids)              */
/* ------------------------------------------------------------------ */

function resolveItem(id?: string): CatalogItem | undefined {
  if (!id) return undefined;
  return COSMETICS_CATALOG.find((c) => c.id === id || c.name === id);
}

const HEAD_TOP = 1.42;
const EYE_LINE = 1.08;

function Headwear({ item, p }: { item?: CatalogItem; p: CharPalette }) {
  if (!item) return null;
  const id = item.id;

  if (id === 'head_halo_light') {
    return (
      <HaloSpin>
        <mesh position={[0, HEAD_TOP + 0.24, 0]} rotation={[Math.PI / 2.2, 0, 0]}>
          <torusGeometry args={[0.26, 0.022, 10, 48]} />
          <meshStandardMaterial color="#FFE9A8" emissive="#FFD700" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
      </HaloSpin>
    );
  }

  if (id === 'head_diamond_crown' || id === 'head_crown_spikes') {
    const gold = id === 'head_crown_spikes' ? '#B8860B' : '#E6E8FA';
    return (
      <group position={[0, HEAD_TOP - 0.02, 0]}>
        {[...Array(6)].map((_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.sin(a) * 0.24, 0.07, Math.cos(a) * 0.24]} castShadow>
              <coneGeometry args={[0.038, 0.17, 8]} />
              <meshPhysicalMaterial color={gold} metalness={1} roughness={0.18} />
            </mesh>
          );
        })}
        <mesh position={[0, 0.16, 0]}>
          <octahedronGeometry args={[0.05]} />
          <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      </group>
    );
  }

  if (id === 'head_vr_goggles' || id === 'head_tactical_visor' || id === 'head_gold_shades' || id === 'head_cyber_helmet') {
    const lens = id === 'head_gold_shades' ? '#FFD700' : p.accent;
    return (
      <group position={[0, EYE_LINE + 0.1, 0.3]}>
        <mesh>
          <boxGeometry args={[0.42, 0.09, 0.06]} />
          <meshPhysicalMaterial color="#10141c" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <boxGeometry args={[0.37, 0.055, 0.01]} />
          <meshStandardMaterial color={lens} emissive={lens} emissiveIntensity={1.3} transparent opacity={0.85} toneMapped={false} />
        </mesh>
      </group>
    );
  }

  return null;
}

function HaloSpin({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (g.current) g.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.9) * 0.1;
  });
  return <group ref={g}>{children}</group>;
}

function EyewearChibi({ item, p }: { item?: CatalogItem; p: CharPalette }) {
  if (!item) return null;
  const id = item.id;

  if (id === 'eyes_void_shades') {
    return (
      <group position={[0, EYE_LINE, 0.31]}>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.105, 0, 0]} rotation={[0, s * 0.2, 0]}>
            <boxGeometry args={[0.155, 0.075, 0.03]} />
            <meshPhysicalMaterial color="#050505" metalness={0.6} roughness={0.05} clearcoat={1} />
          </mesh>
        ))}
      </group>
    );
  }

  if (id === 'eyes_holo_monocle') {
    return (
      <group position={[0.115, EYE_LINE, 0.305]}>
        <mesh>
          <torusGeometry args={[0.075, 0.011, 10, 36]} />
          <meshPhysicalMaterial color="#d4af37" metalness={1} roughness={0.15} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.07, 32]} />
          <meshBasicMaterial color={p.accent} transparent opacity={0.28} />
        </mesh>
      </group>
    );
  }

  if (id === 'eyes_plasma_spectacles' || id === 'eyes_quantum_goggles' || id === 'eyes_gold_seer' || id === 'eyes_cyber_visors') {
    const tint = id === 'eyes_plasma_spectacles' ? '#FF2E97' : id === 'eyes_gold_seer' ? '#FFD700' : id === 'eyes_quantum_goggles' ? '#7DF9FF' : p.accent;
    return (
      <mesh position={[0, EYE_LINE + 0.02, 0.315]} rotation={[0.06, 0, 0]}>
        <boxGeometry args={[0.34, 0.06, 0.02]} />
        <meshStandardMaterial color={tint} emissive={tint} emissiveIntensity={1.4} transparent opacity={0.8} toneMapped={false} />
      </mesh>
    );
  }

  return null;
}

function TrailFXChibi({ item, p }: { item?: CatalogItem; p: CharPalette }) {
  const L = useRef<THREE.Group>(null);
  const R = useRef<THREE.Group>(null);

  useFrame((s) => {
    const flap = Math.sin(s.clock.elapsedTime * 2.4) * 0.3;
    if (L.current) L.current.rotation.z = 0.5 + flap;
    if (R.current) R.current.rotation.z = -0.5 - flap;
  });

  if (!item) return null;
  const id = item.id;

  if (id === 'wings_stealth_cape') {
    return (
      <mesh position={[0, 0.68, -0.2]} rotation={[0.14, 0, 0]}>
        <planeGeometry args={[0.62, 0.9]} />
        <meshToonMaterial color="#0a0c14" gradientMap={TOON_RAMP} side={THREE.DoubleSide} />
      </mesh>
    );
  }

  const wingGlow: Record<string, { c: string; e: string }> = {
    wings_angelic: { c: '#f8f8ff', e: '#FFFFFF' },
    wings_cyber_dragon: { c: '#1a0b26', e: '#FF007A' },
    wings_fairy_sparkle: { c: '#ffd6f2', e: '#FF8AD8' },
    wings_gold_phoenix: { c: '#e8c15a', e: '#FF9D00' },
    wings_holo_fins: { c: '#7DF9FF', e: '#00F0FF' },
    wings_mech_blade: { c: '#39415a', e: '#00F0FF' },
    wings_overclock: { c: '#161b26', e: '#00F0FF' },
    wings_glider_pack: { c: '#20283a', e: '#00F0FF' },
  };

  const style = wingGlow[id];
  if (!style) return null;

  return (
    <group position={[0, 0.74, -0.22]}>
      {[-1, 1].map((s) => (
        <group key={s} ref={s === -1 ? L : R}>
          <mesh position={[s * 0.3, 0.06, 0]} rotation={[0.1, s * -0.3, s * 0.35]} scale={[0.42, 0.16, 0.05]}>
            <sphereGeometry args={[1, 18, 12]} />
            <meshStandardMaterial
              color={style.c}
              emissive={style.e}
              emissiveIntensity={0.6}
              transparent
              opacity={0.9}
              side={THREE.DoubleSide}
              flatShading={id === 'wings_cyber_dragon'}
            />
          </mesh>
        </group>
      ))}
      {(id === 'wings_fairy_sparkle' || id === 'wings_gold_phoenix') && (
        <Sparkles count={14} scale={1.1} size={2.2} speed={0.6} color={style.e} position={[0, 0.1, 0]} />
      )}
    </group>
  );
}

function AuraFXChibi({ item, fallback }: { item?: CatalogItem; fallback: string }) {
  const r1 = useRef<THREE.Mesh>(null);
  const r2 = useRef<THREE.Mesh>(null);
  const lite = useRef<THREE.PointLight>(null);

  const colors: Record<string, string> = {
    aura_blood_rage: '#DC2626',
    aura_cosmic_dust: '#A78BFA',
    aura_electric_storm: '#00F0FF',
    aura_frost_zero: '#93C5FD',
    aura_gold_sparkles: '#FFD700',
    aura_matrix_glitch: '#00FF66',
    aura_plasma_fire: '#FF007A',
    aura_scan_beam: '#F59E0B',
    aura_synthwave_sun: '#FF2E97',
    aura_void_blackhole: '#8B5CF6',
  };
  const color = colors[item?.id ?? ''] ?? fallback;

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (r1.current) {
      r1.current.rotation.z = t * 0.7;
      r1.current.rotation.x = Math.PI / 2.3 + Math.sin(t * 0.5) * 0.12;
    }
    if (r2.current) {
      r2.current.rotation.z = -t * 0.45;
      r2.current.rotation.x = Math.PI / 1.8 + Math.cos(t * 0.4) * 0.1;
    }
    if (lite.current) lite.current.intensity = 0.7 + Math.sin(t * 2.2) * 0.2;
  });

  return (
    <group position={[0, 0.66, 0]}>
      <Sparkles count={30} scale={[1.5, 1.5, 1.5]} size={2.4} speed={0.4} color={color} opacity={0.65} />
      <mesh ref={r1}>
        <torusGeometry args={[0.56, 0.007, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={r2}>
        <torusGeometry args={[0.7, 0.005, 8, 64]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight ref={lite} color={color} intensity={0.7} distance={2.6} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Character builds                                                     */
/* ------------------------------------------------------------------ */

function HairKairos({ inertia }: { inertia?: React.MutableRefObject<number> }) {
  const p = CHARACTERS.cyber_humanoid;
  const tailL = useRef<THREE.Group>(null);
  const tailR = useRef<THREE.Group>(null);
  const ahoge = useRef<THREE.Group>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const lag = THREE.MathUtils.clamp((inertia?.current ?? 0) * 0.05, -0.32, 0.32);
    if (tailL.current) {
      tailL.current.rotation.z = 0.5 + Math.sin(t * 1.6) * 0.08;
      tailL.current.rotation.x = Math.sin(t * 1.1) * 0.06 - lag;
    }
    if (tailR.current) {
      tailR.current.rotation.z = -0.5 - Math.sin(t * 1.6 + 0.4) * 0.08;
      tailR.current.rotation.x = Math.cos(t * 1.2) * 0.06 - lag;
    }
    if (ahoge.current) ahoge.current.rotation.x = Math.sin(t * 2.6) * 0.18 - 0.1;
  });

  return (
    <group>
      {/* skull cap */}
      <M geo={<sphereGeometry args={[0.352, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.56]} />} color={p.hair} outline={false} position={[0, 0.01, 0]} />
      {/* jagged bangs */}
      {[-2, -1, 0, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.105, 1.28 - Math.abs(i) * 0.012, 0.27]} rotation={[0.42, 0, i * 0.1]} castShadow>
          <coneGeometry args={[0.062, 0.3 - Math.abs(i) * 0.03, 5]} />
          <meshToonMaterial color={p.hair} gradientMap={TOON_RAMP} />
        </mesh>
      ))}
      {/* twin tails with LED ties */}
      {[-1, 1].map((s) => (
        <group key={s} ref={s === -1 ? tailL : tailR} position={[s * 0.33, 1.3, -0.06]}>
          <mesh position={[s * 0.04, -0.22, -0.04]} rotation={[0.2, 0, s * 0.2]} castShadow>
            <capsuleGeometry args={[0.075, 0.5, 6, 14]} />
            <meshToonMaterial color={p.hairShade} gradientMap={TOON_RAMP} />
          </mesh>
          <mesh position={[s * 0.09, -0.56, -0.08]} rotation={[0.35, 0, s * 0.3]} castShadow>
            <coneGeometry args={[0.055, 0.3, 6]} />
            <meshToonMaterial color={p.hairShade} gradientMap={TOON_RAMP} />
          </mesh>
          <mesh position={[s * 0.02, -0.02, 0]}>
            <torusGeometry args={[0.055, 0.014, 8, 24]} />
            <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={1.8} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {/* ahoge */}
      <group ref={ahoge} position={[0.03, 1.44, 0]}>
        <mesh rotation={[0, 0, -0.5]} castShadow>
          <coneGeometry args={[0.024, 0.22, 6]} />
          <meshToonMaterial color={p.hair} gradientMap={TOON_RAMP} />
        </mesh>
      </group>
    </group>
  );
}

function HairUnit() {
  const p = CHARACTERS.quantum_android;
  const ring = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    if (ring.current) ring.current.rotation.z = s.clock.elapsedTime * 0.6;
  });

  return (
    <group>
      {/* glossy bob */}
      <M geo={<sphereGeometry args={[0.365, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.62]} />} color={p.hair} position={[0, 0.012, 0.01]} outline={false} />
      {/* straight fringe */}
      <mesh position={[0, 1.3, 0.265]} rotation={[0.34, 0, 0]} scale={[1, 1, 0.5]}>
        <sphereGeometry args={[0.24, 24, 16, 0, Math.PI]} />
        <meshToonMaterial color={p.hair} gradientMap={TOON_RAMP} />
      </mesh>
      {[-2, -1, 1, 2].map((i) => (
        <mesh key={i} position={[i * 0.098, 1.24, 0.285]} rotation={[0.5, 0, -i * 0.06]}>
          <coneGeometry args={[0.05, 0.2, 5]} />
          <meshToonMaterial color={p.hairShade} gradientMap={TOON_RAMP} />
        </mesh>
      ))}
      {/* orbital halo — android designation ring */}
      <mesh ref={ring} position={[0, 1.52, 0]} rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry args={[0.3, 0.008, 8, 64]} />
        <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={1.6} transparent opacity={0.85} toneMapped={false} />
      </mesh>
      {/* side seam lights */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.345, 1.12, 0.08]} rotation={[0, 0, s * 1.2]}>
          <boxGeometry args={[0.012, 0.16, 0.012]} />
          <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function HairMidas() {
  const p = CHARACTERS.wall_street_titan;

  return (
    <group>
      {/* slicked undercut — tight cap */}
      <M geo={<sphereGeometry args={[0.35, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.5]} />} color={p.hair} outline={false} position={[0, 0.008, 0]} />
      {/* swept-back volume */}
      <mesh position={[0, 1.38, -0.1]} rotation={[-0.5, 0, 0]} scale={[1.02, 0.6, 1]}>
        <sphereGeometry args={[0.3, 24, 18]} />
        <meshToonMaterial color={p.hair} gradientMap={TOON_RAMP} />
      </mesh>
      <mesh position={[0, 1.34, 0.22]} rotation={[0.7, 0, 0]} scale={[1, 0.5, 0.8]}>
        <sphereGeometry args={[0.28, 24, 16]} />
        <meshToonMaterial color={p.hair} gradientMap={TOON_RAMP} />
      </mesh>
      {/* signature loose gold strand over forehead */}
      <mesh position={[0.12, 1.24, 0.3]} rotation={[0.2, 0, 0.35]} castShadow>
        <capsuleGeometry args={[0.022, 0.24, 4, 10]} />
        <meshToonMaterial color={p.hairShade} gradientMap={TOON_RAMP} />
      </mesh>
    </group>
  );
}

function HairVeil({ inertia }: { inertia?: React.MutableRefObject<number> }) {
  const p = CHARACTERS.cosmic_entity;
  const drillL = useRef<THREE.Group>(null);
  const drillR = useRef<THREE.Group>(null);
  const stars = useRef<THREE.Group>(null);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const lag = THREE.MathUtils.clamp((inertia?.current ?? 0) * 0.04, -0.26, 0.26);
    if (drillL.current) drillL.current.rotation.z = 0.35 + Math.sin(t * 1.4) * 0.06;
    if (drillR.current) drillR.current.rotation.z = -0.35 - Math.cos(t * 1.4) * 0.06;
    if (drillL.current) drillL.current.rotation.x = -lag + Math.sin(t * 0.9) * 0.04;
    if (drillR.current) drillR.current.rotation.x = -lag + Math.cos(t * 1.1) * 0.04;
    if (stars.current) stars.current.rotation.y = t * 0.5;
  });

  return (
    <group>
      {/* nebula cap */}
      <M geo={<sphereGeometry args={[0.36, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.58]} />} color={p.hair} outline={false} position={[0, 0.01, 0]} />
      {/* parted curtain bangs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.16, 1.26, 0.27]} rotation={[0.4, s * -0.25, s * 0.28]} castShadow>
          <coneGeometry args={[0.075, 0.34, 6]} />
          <meshToonMaterial color={p.hair} gradientMap={TOON_RAMP} />
        </mesh>
      ))}
      {/* twin drills */}
      {[-1, 1].map((s) => (
        <group key={s} ref={s === -1 ? drillL : drillR} position={[s * 0.36, 1.28, -0.05]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[s * (0.02 + i * 0.012), -0.1 - i * 0.13, -i * 0.01]} rotation={[0, 0, s * (0.4 + i * 0.22)]} castShadow>
              <coneGeometry args={[0.055 - i * 0.008, 0.16, 6]} />
              <meshToonMaterial color={i % 2 ? p.hairShade : p.hair} gradientMap={TOON_RAMP} />
            </mesh>
          ))}
        </group>
      ))}
      {/* orbiting star clip */}
      <group ref={stars} position={[0, 1.3, 0]}>
        <mesh position={[0.26, 0.1, 0.14]}>
          <octahedronGeometry args={[0.045]} />
          <meshStandardMaterial color="#FFD166" emissive="#FFD166" emissiveIntensity={1.8} toneMapped={false} />
        </mesh>
        <mesh position={[-0.24, 0.06, 0.16]}>
          <octahedronGeometry args={[0.03]} />
          <meshStandardMaterial color="#EC4899" emissive="#EC4899" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/** Fluttering coat tail — MIDAS */
function CoatTail({ energy }: { energy: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (g.current) g.current.rotation.x = 0.12 + Math.sin(t * energy * 0.9) * 0.07 + Math.sin(t * 2.3) * 0.02;
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.24, -0.05]}>
        <coneGeometry args={[0.23, 0.34, 16, 1, true]} />
        <meshToonMaterial color={CHARACTERS.wall_street_titan.outfitDark} gradientMap={TOON_RAMP} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

/** Undulating wisp tail — VEIL */
function WispTail({ energy }: { energy: number }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (g.current) {
      g.current.rotation.z = Math.sin(t * energy * 0.7) * 0.09;
      const pulse = 1 + Math.sin(t * 2.2) * 0.04;
      g.current.scale.set(pulse, 1, pulse);
    }
  });
  return (
    <group ref={g}>
      <mesh position={[0, 0.18, 0]}>
        <coneGeometry args={[0.14, 0.44, 16, 1, true]} />
        <meshPhysicalMaterial
          color={CHARACTERS.cosmic_entity.outfitDark}
          emissive={CHARACTERS.cosmic_entity.accent}
          emissiveIntensity={0.35}
          transparent
          opacity={0.75}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Sparkles count={12} scale={[0.5, 0.7, 0.5]} size={2} speed={0.4} color={CHARACTERS.cosmic_entity.accent} position={[0, 0.3, 0]} opacity={0.6} />
    </group>
  );
}

function Outfit({ arch, energy = 2.5 }: { arch: ArchKey; energy?: number }) {
  const p = CHARACTERS[arch];

  if (arch === 'wall_street_titan') {
    return (
      <group>
        {/* jacket shell */}
        <M geo={<cylinderGeometry args={[0.2, 0.235, 0.42, 20]} />} color="#15171f" position={[0, 0.5, 0]} />
        {/* peaked lapels */}
        {[-1, 1].map((s) => (
          <mesh key={`lap${s}`} position={[s * 0.105, 0.62, 0.19]} rotation={[0.05, s * 0.15, s * -0.85]}>
            <boxGeometry args={[0.075, 0.24, 0.02]} />
            <meshToonMaterial color="#0e1017" gradientMap={TOON_RAMP} />
          </mesh>
        ))}
        {/* shirt V + collar wings */}
        <mesh position={[0, 0.6, 0.185]} rotation={[0.08, 0, 0]}>
          <boxGeometry args={[0.095, 0.22, 0.02]} />
          <meshToonMaterial color="#f6f6fa" gradientMap={TOON_RAMP} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={`col${s}`} position={[s * 0.04, 0.7, 0.2]} rotation={[0.1, s * 0.35, s * 0.5]}>
            <boxGeometry args={[0.05, 0.06, 0.014]} />
            <meshToonMaterial color="#f6f6fa" gradientMap={TOON_RAMP} />
          </mesh>
        ))}
        {/* tie: knot + blade + dimple sheen */}
        <mesh position={[0, 0.66, 0.205]}>
          <boxGeometry args={[0.038, 0.038, 0.018]} />
          <meshStandardMaterial color="#b81d31" roughness={0.55} />
        </mesh>
        <mesh position={[0, 0.53, 0.202]} rotation={[0.06, 0, 0]}>
          <coneGeometry args={[0.03, 0.19, 4]} />
          <meshStandardMaterial color="#d92038" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.56, 0.212]} rotation={[0, 0, Math.PI / 4]}>
          <boxGeometry args={[0.006, 0.1, 0.004]} />
          <meshStandardMaterial color="#ff5a6e" roughness={0.3} />
        </mesh>
        {/* waistcoat with pinstripes */}
        <mesh position={[0, 0.4, 0.155]}>
          <cylinderGeometry args={[0.165, 0.185, 0.2, 18, 1, true, Math.PI * 0.15, Math.PI * 0.7]} />
          <meshToonMaterial color="#1b1e29" gradientMap={TOON_RAMP} side={THREE.DoubleSide} />
        </mesh>
        {[-0.05, 0, 0.05].map((x) => (
          <mesh key={x} position={[x, 0.4, 0.172]}>
            <boxGeometry args={[0.004, 0.17, 0.002]} />
            <meshStandardMaterial color={p.accent} transparent opacity={0.28} toneMapped={false} />
          </mesh>
        ))}
        {/* buttons */}
        {[0.44, 0.37].map((y) => (
          <mesh key={y} position={[0, y, 0.176]}>
            <sphereGeometry args={[0.008, 8, 8]} />
            <meshStandardMaterial color="#c9a227" metalness={1} roughness={0.25} />
          </mesh>
        ))}
        {/* pocket square */}
        <mesh position={[0.12, 0.56, 0.178]} rotation={[0, 0, 0.08]}>
          <boxGeometry args={[0.045, 0.03, 0.008]} />
          <meshStandardMaterial color="#FFD700" metalness={0.9} roughness={0.3} />
        </mesh>
        {/* coat tails */}
        <CoatTail energy={energy} />
        {/* watch + French cuffs */}
        {[-1, 1].map((s) => (
          <group key={`w${s}`} position={[s * 0.26, 0.42, 0.02]}>
            <torusGeometry args={[0.052, 0.012, 8, 20]} />
            <meshStandardMaterial color="#0f1118" metalness={0.8} roughness={0.3} />
            <mesh scale={[1, 1, 0.5]}>
              <torusGeometry args={[0.052, 0.004, 6, 20]} />
              <meshStandardMaterial color={p.accent} metalness={1} roughness={0.2} />
            </mesh>
          </group>
        ))}
      </group>
    );
  }

  if (arch === 'quantum_android') {
    return (
      <group>
        {/* bodysuit base */}
        <M geo={<cylinderGeometry args={[0.175, 0.2, 0.4, 20]} />} color={p.outfit} position={[0, 0.5, 0]} />
        {/* corporate blazer panels */}
        {[-1, 1].map((s) => (
          <mesh key={`bz${s}`} position={[s * 0.115, 0.52, 0.13]} rotation={[0, s * -0.12, 0]}>
            <boxGeometry args={[0.11, 0.34, 0.045]} />
            <meshToonMaterial color="#dfe3f2" gradientMap={TOON_RAMP} />
          </mesh>
        ))}
        {/* single button closure */}
        <mesh position={[0.01, 0.45, 0.175]}>
          <sphereGeometry args={[0.012, 10, 10]} />
          <meshStandardMaterial color={p.accent} metalness={0.7} roughness={0.3} />
        </mesh>
        {/* glowing seam lines */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.16, 0.48, 0.145]} rotation={[0, 0, s * 0.3]}>
            <boxGeometry args={[0.01, 0.26, 0.01]} />
            <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={1.5} toneMapped={false} />
          </mesh>
        ))}
        {/* brooch-set core gem */}
        <mesh position={[0, 0.64, 0.168]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.032, 0.007, 8, 20]} />
          <meshPhysicalMaterial color="#d4af37" metalness={1} roughness={0.18} />
        </mesh>
        <mesh position={[0, 0.64, 0.168]}>
          <octahedronGeometry args={[0.042]} />
          <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={2} toneMapped={false} />
        </mesh>
        {/* segmented joints */}
        <mesh position={[0, 0.3, 0]}>
          <torusGeometry args={[0.16, 0.02, 8, 28]} />
          <meshToonMaterial color={p.outfitDark} gradientMap={TOON_RAMP} />
        </mesh>
      </group>
    );
  }

  if (arch === 'cosmic_entity') {
    return (
      <group>
        <M geo={<cylinderGeometry args={[0.16, 0.14, 0.34, 18]} />} color={p.outfit} position={[0, 0.52, 0]} outline={false} />
        {/* high formal neckline */}
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.075, 0.09, 0.06, 14, 1, true]} />
          <meshToonMaterial color={p.outfitDark} gradientMap={TOON_RAMP} side={THREE.DoubleSide} />
        </mesh>
        {/* wisp tail instead of legs */}
        <WispTail energy={energy} />
        {/* collar mantle */}
        <mesh position={[0, 0.68, 0]} rotation={[0.2, 0, 0]}>
          <torusGeometry args={[0.17, 0.035, 10, 28]} />
          <meshToonMaterial color={p.hairShade} gradientMap={TOON_RAMP} />
        </mesh>
        {/* ceremonial chain across the chest */}
        {[0, 1, 2, 3, 4].map((i) => {
          const a = Math.PI * (0.25 + (i / 4) * 0.5);
          return (
            <mesh key={i} position={[Math.cos(a) * 0.15, 0.56 + Math.sin(a) * 0.05, 0.135 + i * 0.004]}>
              <sphereGeometry args={[0.009, 8, 8]} />
              <meshStandardMaterial color="#FFD166" metalness={1} roughness={0.22} />
            </mesh>
          );
        })}
      </group>
    );
  }

  // cyber_humanoid — tailored tech blazer
  return (
    <group>
      {/* base layer */}
      <M geo={<cylinderGeometry args={[0.18, 0.215, 0.4, 20]} />} color={p.outfit} position={[0, 0.5, 0]} />
      {/* blazer front panels, overlapped shut */}
      {[-1, 1].map((s) => (
        <mesh key={`bp${s}`} position={[s * 0.095, 0.5, 0.148]} rotation={[0, s * -0.08, 0]}>
          <boxGeometry args={[0.13, 0.36, 0.04]} />
          <meshToonMaterial color={arch === 'cyber_humanoid' ? '#181d2a' : p.outfit} gradientMap={TOON_RAMP} />
        </mesh>
      ))}
      {/* center zip with pull */}
      <mesh position={[0, 0.5, 0.172]}>
        <boxGeometry args={[0.008, 0.34, 0.008]} />
        <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.36, 0.176]}>
        <boxGeometry args={[0.016, 0.03, 0.01]} />
        <meshStandardMaterial color="#c9ced9" metalness={0.9} roughness={0.25} />
      </mesh>
      {/* slim lapel piping */}
      {[-1, 1].map((s) => (
        <mesh key={`pp${s}`} position={[s * 0.115, 0.63, 0.16]} rotation={[0.05, s * 0.2, s * -0.75]}>
          <boxGeometry args={[0.05, 0.2, 0.012]} />
          <meshToonMaterial color="#12161f" gradientMap={TOON_RAMP} />
        </mesh>
      ))}
      {[-1, 1].map((s) => (
        <mesh key={`pl${s}`} position={[s * 0.142, 0.63, 0.168]} rotation={[0.05, s * 0.2, s * -0.75]}>
          <boxGeometry args={[0.006, 0.2, 0.004]} />
          <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={1.1} toneMapped={false} />
        </mesh>
      ))}
      {/* high collar */}
      <mesh position={[0, 0.71, 0]}>
        <cylinderGeometry args={[0.11, 0.13, 0.09, 18, 1, true]} />
        <meshToonMaterial color={p.outfitDark} gradientMap={TOON_RAMP} side={THREE.DoubleSide} />
      </mesh>
      {/* chest rig lines */}
      <mesh position={[0, 0.44, 0.168]}>
        <boxGeometry args={[0.2, 0.014, 0.012]} />
        <meshStandardMaterial color={p.accent} emissive={p.accent} emissiveIntensity={1} toneMapped={false} />
      </mesh>
      {/* cropped jacket hem */}
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.185, 0.02, 8, 28]} />
        <meshToonMaterial color={p.outfitDark} gradientMap={TOON_RAMP} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Real 3D eyes — sclera/iris/pupil/glints with gaze + saccades        */
/* ------------------------------------------------------------------ */

const LID_BASE: Partial<Record<AvatarEmotion, number>> = {
  neutral: 0.02,
  confident: 0.3,
  battle: 0.16,
  thinking: 0.42,
  surprised: -0.08,
};

function RealEyes({
  p,
  emotion,
  blinkShared,
}: {
  p: CharPalette;
  emotion: AvatarEmotion;
  blinkShared: { current: { nextAt: number; until: number } };
}) {
  const ballL = useRef<THREE.Group>(null);
  const ballR = useRef<THREE.Group>(null);
  const lidL = useRef<THREE.Mesh>(null);
  const lidR = useRef<THREE.Mesh>(null);
  const sac = useRef({ nextAt: 1, x: 0, y: 0 });
  const cur = useRef({ x: 0, y: 0, lid: 0 });

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    // happy paints ∩∩ arcs; blink frames paint lash lines — both hide the balls
    const hidden = emotion === 'happy';
    const blinking = t < blinkShared.current.until;

    if (ballL.current) ballL.current.visible = !hidden && !blinking;
    if (ballR.current) ballR.current.visible = !hidden && !blinking;

    const s = sac.current;
    if (t > s.nextAt) {
      s.nextAt = t + 0.7 + Math.random() * 1.7;
      s.x = (Math.random() - 0.5) * 0.12;
      s.y = (Math.random() - 0.5) * 0.08;
    }

    const tx = state.pointer.x * 0.32 + s.x;
    const ty = -state.pointer.y * 0.22 + s.y;
    cur.current.x += (tx - cur.current.x) * (1 - Math.exp(-delta * 16));
    cur.current.y += (ty - cur.current.y) * (1 - Math.exp(-delta * 16));

    const baseLid = LID_BASE[emotion] ?? 0.02;
    const targetLid = blinking ? 1 : baseLid;
    cur.current.lid += (targetLid - cur.current.lid) * (1 - Math.exp(-delta * (blinking ? 30 : 12)));

    const slant = emotion === 'battle' ? 0.15 : emotion === 'confident' ? 0.06 : emotion === 'thinking' ? -0.05 : 0;

    [ballL, ballR].forEach((r, i) => {
      if (!r.current) return;
      r.current.rotation.y = cur.current.x;
      r.current.rotation.x = cur.current.y;
      r.current.rotation.z = (i === 0 ? slant : -slant);
    });
    [lidL, lidR].forEach((l) => {
      if (l.current) {
        l.current.visible = !hidden;
        l.current.rotation.x = -0.55 + cur.current.lid * 1.05;
      }
    });
  });

  return (
    <group>
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 0.115, 0.02, 0.282]}>
          <group ref={sx === -1 ? ballL : ballR}>
            <mesh scale={[1, 1.06, 0.6]}>
              <sphereGeometry args={[0.052, 24, 20]} />
              <meshToonMaterial color="#f8f5f2" gradientMap={TOON_RAMP} />
            </mesh>
            <group position={[0, 0, 0.026]}>
              <mesh>
                <circleGeometry args={[0.031, 24]} />
                <meshStandardMaterial color={shade(p.eye, -25)} emissive={p.eye} emissiveIntensity={0.55} roughness={0.35} />
              </mesh>
              <mesh position={[0, 0, 0.004]}>
                <circleGeometry args={[0.0145, 20]} />
                <meshStandardMaterial color="#140b1c" roughness={0.2} />
              </mesh>
              <mesh position={[-0.009, 0.011, 0.008]}>
                <sphereGeometry args={[0.0068, 10, 10]} />
                <meshBasicMaterial color="#ffffff" toneMapped={false} />
              </mesh>
              <mesh position={[0.008, -0.008, 0.007]}>
                <sphereGeometry args={[0.0032, 8, 8]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={0.55} toneMapped={false} />
              </mesh>
            </group>
          </group>
          {/* eyelid shell — slides down for lids/blinks */}
          <mesh ref={sx === -1 ? lidL : lidR} rotation={[-0.55, 0, 0]}>
            <sphereGeometry args={[0.0575, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.52]} />
            <meshToonMaterial color={p.skin} gradientMap={TOON_RAMP} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* WorkStation — holographic task panel, typing deck, progress halo    */
/* ------------------------------------------------------------------ */

function WorkStation({
  active,
  label,
  progress,
  p,
}: {
  active: boolean;
  label?: string;
  progress?: number;
  p: CharPalette;
}) {
  const panel = useRef<THREE.Group>(null);
  const bars = useRef<(THREE.Mesh | null)[]>([]);
  const scan = useRef<THREE.Mesh>(null);
  const comet = useRef<THREE.Mesh>(null);
  const pctRef = useRef<HTMLSpanElement>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (panel.current) {
      const target = active ? 1 : 0.0001;
      const k = 1 - Math.exp(-delta * 8);
      panel.current.scale.setScalar(THREE.MathUtils.lerp(panel.current.scale.x, target, k));
    }
    if (!active) return;

    bars.current.forEach((m, i) => {
      if (!m) return;
      const sp = 6 + i * 1.3;
      m.scale.y = 0.22 + Math.abs(Math.sin(t * sp + i * 1.7)) * 0.78;
    });
    if (scan.current) scan.current.position.x = Math.sin(t * 1.1) * 0.21;

    const pr = progress ?? (t * 0.28) % 1;
    if (comet.current) {
      const a = -Math.PI / 2 + pr * Math.PI * 2;
      comet.current.position.set(Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0);
    }
    if (pctRef.current) pctRef.current.textContent = `${Math.round(pr * 100)}%`;
  });

  return (
    <group>
      {/* holo task panel in front of the chest */}
      <group ref={panel} position={[0, 0.58, 0.4]} rotation={[-0.06, 0, 0]} scale={0.0001}>
        <RoundedBox args={[0.56, 0.38, 0.008]} radius={0.03} smoothness={4}>
          <meshBasicMaterial color={p.accent} transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </RoundedBox>
        <RoundedBox args={[0.54, 0.36, 0.01]} radius={0.028} smoothness={4} position={[0, 0, 0.002]}>
          <meshBasicMaterial color="#06121e" transparent opacity={0.62} depthWrite={false} />
        </RoundedBox>

        {/* code equalizer bars */}
        {[-3, -2, -1, 0, 1, 2, 3].map((i, idx) => (
          <mesh
            key={i}
            ref={(m: THREE.Mesh | null) => {
              bars.current[idx] = m;
            }}
            position={[i * 0.058, -0.04, 0.012]}
            scale={[1, 0.4, 1]}
          >
            <planeGeometry args={[0.032, 0.2]} />
            <meshBasicMaterial color={p.accent} transparent opacity={0.75} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        ))}

        {/* sweeping scanline */}
        <mesh ref={scan} position={[0, 0.12, 0.013]}>
          <planeGeometry args={[0.02, 0.02]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* rising data motes */}
        <Sparkles count={14} scale={[0.42, 0.34, 0.1]} size={2} speed={1.6} color={p.accent} position={[0, 0, 0.03]} opacity={0.7} />

        {/* title strip */}
        <mesh position={[0, 0.155, 0.012]}>
          <planeGeometry args={[0.4, 0.018]} />
          <meshBasicMaterial color={p.accent} transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      {/* progress halo above head */}
      {active && (
        <group position={[0, HEAD_TOP + 0.24, 0]} rotation={[Math.PI / 2.6, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.33, 0.35, 48]} />
            <meshBasicMaterial color={p.accent} transparent opacity={0.18} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
          <mesh ref={comet}>
            <sphereGeometry args={[0.024, 12, 12]} />
            <meshBasicMaterial color={p.accent} toneMapped={false} />
          </mesh>
          <Html center distanceFactor={4.2} position={[0, 0.52, 0]} zIndexRange={[60, 50]}>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-mono font-bold whitespace-nowrap pointer-events-none select-none"
              style={{
                borderColor: `${p.accent}66`,
                background: 'rgba(4,8,14,0.82)',
                color: p.accent,
                fontSize: '11px',
                boxShadow: `0 0 16px ${p.accent}33`,
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: p.accent }} />
              <span>{label ?? 'Executing task…'}</span>
              <span ref={pctRef}>0%</span>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export interface AnimeCompanionProps {
  avatarId: string;
  loadout?: FighterLoadout;
  emotion?: AvatarEmotion;
  isSpeaking?: boolean;
  /** shows the holographic work panel + typing + task chip */
  isWorking?: boolean;
  workLabel?: string;
  /** 0..1 — omit to auto-loop */
  workProgress?: number;
  /** baseline yaw so face-off views can turn characters toward each other */
  faceAngle?: number;
}

interface MotionProfile {
  bobSpeed: number;
  bobAmp: number;
  headPitch: number;
  headRoll: number;
  armPose: 'relaxed' | 'guard' | 'chin' | 'cheer' | 'out';
}

function motionProfile(e: AvatarEmotion): MotionProfile {
  switch (e) {
    case 'battle':
      return { bobSpeed: 5.4, bobAmp: 0.045, headPitch: -0.1, headRoll: 0, armPose: 'guard' };
    case 'thinking':
      return { bobSpeed: 1.5, bobAmp: 0.018, headPitch: 0.1, headRoll: 0.14, armPose: 'chin' };
    case 'happy':
      return { bobSpeed: 4.4, bobAmp: 0.06, headPitch: -0.05, headRoll: 0, armPose: 'cheer' };
    case 'surprised':
      return { bobSpeed: 5.8, bobAmp: 0.03, headPitch: -0.12, headRoll: -0.06, armPose: 'out' };
    case 'neutral':
      return { bobSpeed: 2.0, bobAmp: 0.026, headPitch: 0, headRoll: 0, armPose: 'relaxed' };
    default:
      return { bobSpeed: 2.6, bobAmp: 0.03, headPitch: -0.02, headRoll: 0, armPose: 'relaxed' };
  }
}

export function AnimeCompanion({ avatarId, loadout, emotion = 'confident', isSpeaking = false, isWorking = false, workLabel, workProgress, faceAngle = 0 }: AnimeCompanionProps) {
  const arch: ArchKey = (Object.keys(CHARACTERS) as ArchKey[]).includes(avatarId.toLowerCase() as ArchKey)
    ? (avatarId.toLowerCase() as ArchKey)
    : 'cyber_humanoid';
  const p = CHARACTERS[arch];
  const profile = motionProfile(emotion);

  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const headGrp = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const faceMat = useRef<THREE.MeshToonMaterial>(null);
  const blinkRef = useRef({ nextAt: 2, until: 0 });

  const headY = arch === 'cosmic_entity' ? 1.06 : 1.04;
  const floats = arch === 'cosmic_entity';

  const facePlain = useMemo(() => getFace(arch, emotion, 'open', false), [arch, emotion]);
  const facePlainTalk = useMemo(() => getFace(arch, emotion, 'talk', false), [arch, emotion]);
  const faceBlink = useMemo(() => getFace(arch, emotion, 'blink'), [arch, emotion]);

  // hop impulse fires once per emotion change
  const hopRef = useRef({ start: -10, pending: false });
  useEffect(() => {
    hopRef.current.pending = true;
  }, [emotion]);
  const gestureRef = useRef({ next: 0, raised: false });
  const yawVelRef = useRef(0);
  const prevYawRef = useRef(0);
  const burstGrp = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const lerpK = 1 - Math.exp(-delta * 12);

    // emotion-change hop: parabolic jump + squash-stretch
    const hop = hopRef.current;
    if (hop.pending) {
      hop.start = t;
      hop.pending = false;
    }
    let hopY = 0;
    let squash = 1;
    if (hop.start >= 0) {
      const ht = t - hop.start;
      if (ht < 0.5) {
        const k = ht / 0.5;
        hopY = Math.sin(k * Math.PI) * 0.085;
        squash = 1 + Math.sin(k * Math.PI * 2) * 0.055;
      } else {
        hop.start = -10;
      }
    }

    // talking gesture cycle: raised hand alternates with a wave
    const g = gestureRef.current;
    if (isSpeaking && t > g.next) {
      g.next = t + 0.85;
      g.raised = !g.raised;
    }

    if (root.current) {
      const hover = floats ? 0.18 + Math.sin(t * 1.2) * 0.04 : 0;
      root.current.position.y = -0.42 + hover + hopY + Math.sin(t * profile.bobSpeed) * profile.bobAmp;
      root.current.position.x = Math.sin(t * 0.5) * 0.012;
      root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, faceAngle + state.pointer.x * 0.3, 3, delta);
      root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, Math.sin(t * 0.65) * 0.022, 2, delta);

      // yaw velocity feeds hair inertia
      const yaw = root.current.rotation.y;
      yawVelRef.current = THREE.MathUtils.lerp(
        yawVelRef.current,
        (yaw - prevYawRef.current) / Math.max(delta, 1e-4),
        0.12
      );
      prevYawRef.current = yaw;
    }
    if (body.current) {
      const breathe = 1 + Math.sin(t * 2.1 + (isSpeaking ? t * 6 : 0)) * 0.015;
      body.current.scale.set((breathe / squash), breathe * squash, breathe / squash);
      // lean in while speaking
      body.current.rotation.x = THREE.MathUtils.damp(body.current.rotation.x, isSpeaking ? 0.05 : 0, 4, delta);
    }
    if (headGrp.current) {
      const nod = isSpeaking ? Math.sin(t * 10) * 0.05 : 0;
      // working: eyes down toward the holo panel
      const workPitch = isWorking ? 0.22 : 0;
      headGrp.current.rotation.y = THREE.MathUtils.damp(headGrp.current.rotation.y, state.pointer.x * 0.6, 4, delta);
      headGrp.current.rotation.x = THREE.MathUtils.damp(
        headGrp.current.rotation.x,
        profile.headPitch + workPitch + -state.pointer.y * 0.28 + nod,
        4,
        delta
      );
      headGrp.current.rotation.z = THREE.MathUtils.damp(headGrp.current.rotation.z, profile.headRoll, 4, delta);
    }
    if (armL.current && armR.current) {
      const pose = profile.armPose;
      const swingL = pose === 'relaxed' ? Math.sin(t * profile.bobSpeed) * 0.08 : 0;
      const swingR = pose === 'relaxed' ? Math.cos(t * profile.bobSpeed) * 0.08 : 0;
      let txL = pose === 'guard' ? -1.5 : pose === 'chin' ? -2.35 : pose === 'cheer' ? -2.7 : pose === 'out' ? -1.1 : swingL - 0.12;
      let txR = pose === 'guard' ? -1.2 : pose === 'chin' ? -0.25 : pose === 'cheer' ? -2.7 : pose === 'out' ? -1.1 : swingR - 0.12;
      let tz = pose === 'guard' ? 0.45 : pose === 'out' ? 0.7 : 0.14;

      // speaking overrides: right hand gestures between raised and open
      if (isSpeaking && pose !== 'chin') {
        txR = g.raised ? -2.25 : -0.7;
        tz += Math.sin(t * 8) * 0.22;
        txL += Math.sin(t * 5.3) * 0.06;
      }

      // working overrides everything: hands on the holo deck, typing bounce
      if (isWorking) {
        txL = -1.04 + Math.sin(t * 11) * 0.1;
        txR = -1.04 + Math.cos(t * 9.3) * 0.1;
        tz = 0.3;
      }

      armL.current.rotation.x += (txL - armL.current.rotation.x) * lerpK;
      armR.current.rotation.x += (txR - armR.current.rotation.x) * lerpK;
      armL.current.rotation.z += (tz - armL.current.rotation.z) * lerpK;
      armR.current.rotation.z += (-tz - armR.current.rotation.z) * lerpK;
    }

    // blink (with occasional double-tap) + talk frames; open-eye work is done by RealEyes
    const b = blinkRef.current;
    if (t > b.nextAt) {
      b.until = t + 0.13;
      b.nextAt = t + (Math.random() < 0.28 ? 0.34 : 2.4 + Math.random() * 2.4);
    }
    const blinking = t < b.until;

    if (faceMat.current) {
      const nextTex =
        blinking || emotion === 'happy'
          ? faceBlink
          : isSpeaking && Math.sin(t * 15) > 0.1
            ? facePlainTalk
            : facePlain;
      if (faceMat.current.map !== nextTex) faceMat.current.map = nextTex;
    }

    // happy sparkle burst swells in, otherwise collapses to nothing
    if (burstGrp.current) {
      const target = emotion === 'happy' || emotion === 'surprised' ? 1 : 0.0001;
      const s = THREE.MathUtils.lerp(burstGrp.current.scale.x, target, lerpK);
      burstGrp.current.scale.setScalar(s);
      burstGrp.current.rotation.y = t * 0.6;
    }
  });

  return (
    <group ref={root} position={[0, -0.42, 0]}>
      {/* ---------- body ---------- */}
      <group ref={body}>
        <Outfit arch={arch} energy={profile.bobSpeed} />

        {/* arms — chibi stub with mitten hands */}
        {!floats &&
          [-1, 1].map((s) => (
            <group key={s} position={[s * 0.21, 0.66, 0]}>
              <group ref={s === -1 ? armL : armR}>
                <mesh position={[0, -0.14, 0]} rotation={[0, 0, s * 0.12]} castShadow>
                  <capsuleGeometry args={[0.052, 0.16, 6, 12]} />
                  <meshToonMaterial color={p.outfit} gradientMap={TOON_RAMP} />
                </mesh>
                <mesh position={[0, -0.27, 0.01]} castShadow>
                  <sphereGeometry args={[0.062, 16, 16]} />
                  <meshToonMaterial color={p.skin} gradientMap={TOON_RAMP} />
                </mesh>
              </group>
            </group>
          ))}

        {/* legs — stubs (except cosmic: wisp tail handles it) */}
        {!floats &&
          [-1, 1].map((s) => (
            <group key={`leg${s}`} position={[s * 0.09, 0.12, 0]}>
              <mesh castShadow>
                <capsuleGeometry args={[0.055, 0.12, 6, 12]} />
                <meshToonMaterial color={arch === 'wall_street_titan' ? p.outfitDark : p.skin} gradientMap={TOON_RAMP} />
              </mesh>
              <mesh position={[0, -0.08, 0.03]} scale={[1, 0.7, 1.3]} castShadow>
                <sphereGeometry args={[0.06, 14, 12]} />
                <meshToonMaterial color={p.line} gradientMap={TOON_RAMP} />
              </mesh>
            </group>
          ))}

        {/* neck */}
        <mesh position={[0, 0.76, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.08, 12]} />
          <meshToonMaterial color={shade(p.skin, -12)} gradientMap={TOON_RAMP} />
        </mesh>
      </group>

      {/* ---------- head ---------- */}
      <group ref={headGrp} position={[0, headY, 0]}>
        {/* skull with painted face */}
        <mesh castShadow scale={[0.99, 0.95, 0.97]}>
          <sphereGeometry args={[0.345, 48, 48]} />
          <meshToonMaterial ref={faceMat} map={facePlain} gradientMap={TOON_RAMP} />
        </mesh>

        {/* ears */}
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.33, -0.02, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 0.6, 0.6]}>
            <sphereGeometry args={[0.055, 12, 12]} />
            <meshToonMaterial color={p.skin} gradientMap={TOON_RAMP} />
          </mesh>
        ))}

        {arch === 'cyber_humanoid' && <HairKairos inertia={yawVelRef} />}
        {arch === 'quantum_android' && <HairUnit />}
        {arch === 'wall_street_titan' && <HairMidas />}
        {arch === 'cosmic_entity' && <HairVeil inertia={yawVelRef} />}

        {/* real 3D eyeballs — gaze tracking + saccades + emotion lids */}
        <RealEyes p={p} emotion={emotion} blinkShared={blinkRef} />
      </group>

      {/* ---------- working rig ---------- */}
      <WorkStation active={isWorking} label={workLabel} progress={workProgress} p={p} />

      {/* ---------- cosmetics ---------- */}
      <Headwear item={resolveItem(loadout?.HEAD)} p={p} />
      <EyewearChibi item={resolveItem(loadout?.EYEWEAR)} p={p} />
      <TrailFXChibi item={resolveItem(loadout?.TRAIL)} p={p} />
      <AuraFXChibi item={resolveItem(loadout?.AURA)} fallback={p.accent} />

      {/* emotion burst — swells on happy/surprised */}
      <group ref={burstGrp} position={[0, 1.1, 0]} scale={0.0001}>
        <Sparkles count={22} scale={[1.3, 1.3, 1.3]} size={3.2} speed={1.2} color="#FFD166" />
      </group>
    </group>
  );
}

export default AnimeCompanion;
