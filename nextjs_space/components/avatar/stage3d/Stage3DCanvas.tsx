'use client';

import React, { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { FighterLoadout } from '@/lib/cosmetics/stats';
import { NftMecha3D } from './NftMecha3D';
import { NftStageCompanion } from './NftStageCompanion';
import { AnimeCompanion } from './AnimeCompanion';
import { DivineCompanion } from './divine/DivineCompanion';
import { MetahumanCompanion } from './MetahumanCompanion';
import { useInViewport } from './useInViewport';
import type { AvatarEmotion } from '@/hooks/useAvatar';

export interface Stage3DCanvasProps {
  loadout?: FighterLoadout;
  overrideGlbUrl?: string;
  className?: string;
  avatarId?: string;
  emotion?: AvatarEmotion;
  isSpeaking?: boolean;
  isWorking?: boolean;
  workLabel?: string;
  workProgress?: number;
  /** renderer chassis — 'mecha' (default Next-Gen Triple-A), 'anime', 'divine', or 'metahuman' */
  variant?: 'mecha' | 'anime' | 'divine' | 'metahuman';
  /** URL to Metahuman GLB (used when variant === 'metahuman') */
  metahumanGlbUrl?: string;
  /** Viseme input for lip sync (used when variant === 'metahuman') */
  visemes?: Array<{ name: string; weight: number }>;
}

function CustomGLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = React.useMemo(() => {
    const clone = scene.clone(true);
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0) {
      const s = 1.5 / size.y;
      clone.scale.setScalar(s);
      box.setFromObject(clone);
      clone.position.y -= box.min.y;
    }
    return clone;
  }, [scene]);
  return <primitive object={cloned} position={[0, -0.42, 0]} />;
}

function StageFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.435, 0]} receiveShadow>
      <circleGeometry args={[3.2, 64]} />
      <meshStandardMaterial color="#070910" metalness={0.75} roughness={0.32} envMapIntensity={0.7} />
    </mesh>
  );
}

function StageRings() {
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ripples = useRef<THREE.Group>(null);
  const mats = useRef<THREE.MeshBasicMaterial[]>([]);

  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (ringA.current) ringA.current.rotation.z = t * 0.25;
    if (ringB.current) ringB.current.rotation.z = -t * 0.18;
    if (mats.current[0]) mats.current[0].opacity = 0.24 + Math.sin(t * 1.8) * 0.1;
    if (mats.current[1]) mats.current[1].opacity = 0.14 + Math.cos(t * 1.4) * 0.07;
    if (ripples.current) {
      ripples.current.children.forEach((child, i) => {
        const phase = (t * 0.35 + i / 3) % 1;
        child.scale.setScalar(0.55 + phase * 0.85);
        const m = (child as THREE.Mesh).material as THREE.MeshBasicMaterial;
        m.opacity = (1 - phase) * 0.35;
      });
    }
  });

  return (
    <group position={[0, -0.42, 0]}>
      <mesh ref={ringA} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, 0]}>
        <ringGeometry args={[1.05, 1.09, 72]} />
        <meshBasicMaterial
          ref={(m: THREE.MeshBasicMaterial | null) => { if (m) mats.current[0] = m; }}
          color="#00F0FF"
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ringB} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, 0]}>
        <ringGeometry args={[1.35, 1.37, 72]} />
        <meshBasicMaterial
          ref={(m: THREE.MeshBasicMaterial | null) => { if (m) mats.current[1] = m; }}
          color="#FFD700"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group ref={ripples}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <ringGeometry args={[0.7, 0.72, 64]} />
            <meshBasicMaterial color="#00F0FF" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Stage3DCanvas({ overrideGlbUrl, className = '', avatarId = 'cyber_humanoid', emotion = 'confident', isSpeaking = false, isWorking = false, workLabel, workProgress, loadout, variant = 'mecha', metahumanGlbUrl, visemes }: Stage3DCanvasProps) {
  const { ref: vpRef, inView } = useInViewport<HTMLDivElement>();
  return (
    <div ref={vpRef} className={`relative w-full h-full min-h-[320px] ${className}`}>
      <Canvas
        shadows
        frameloop={inView ? 'always' : 'never'}
        dpr={[1, 1.75]}
        camera={{ fov: 38, position: [0.15, 0.45, 2.7] }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* depth falloff sells the "4D" stage dimensionality */}
        <fog attach="fog" args={['#05060c', 6.5, 14]} />

        {/* Unreal Engine 5 Lumen-Style Ultra-Bright HDR Cinematic Rig */}
        <ambientLight intensity={1.1} />
        <directionalLight position={[3.5, 6, 4.5]} intensity={3.0} castShadow shadow-mapSize={[1024, 1024]} />
        <directionalLight position={[-3.5, 4.5, 3.5]} intensity={2.2} color="#E0F2FE" />
        <pointLight position={[-2.8, 2.2, 2.2]} intensity={4.5} distance={10} color="#00F0FF" />
        <pointLight position={[2.8, 2.2, 2.2]} intensity={4.0} distance={10} color="#E879F9" />
        <spotLight position={[-2.8, 3.2, -2.4]} angle={0.65} penumbra={0.9} intensity={4.0} distance={14} color="#7DF9FF" />
        <spotLight position={[2.8, 2.6, -2.4]} angle={0.65} penumbra={0.9} intensity={3.5} distance={14} color="#F472B6" />
        <pointLight position={[0, 0.4, 2.0]} intensity={3.0} distance={6} color="#38BDF8" />
        <pointLight position={[0, -0.2, 1.2]} intensity={2.0} distance={5} color="#00F0FF" />

        <Suspense fallback={null}>
          {overrideGlbUrl ? (
            <CustomGLBModel url={overrideGlbUrl} />
          ) : variant === 'divine' ? (
            <DivineCompanion
              avatarId={avatarId}
              loadout={loadout}
              emotion={emotion}
              isSpeaking={isSpeaking}
              isWorking={isWorking}
              workLabel={workLabel}
              workProgress={workProgress}
            />
          ) : variant === 'metahuman' ? (
            <MetahumanCompanion
              glbUrl={metahumanGlbUrl ?? overrideGlbUrl ?? ''}
              loadout={loadout}
              emotion={emotion}
              isSpeaking={isSpeaking}
              isWorking={isWorking}
              workLabel={workLabel}
              workProgress={workProgress}
              visemes={visemes}
            />
          ) : (
            <NftMecha3D
              avatarId={avatarId}
              loadout={loadout}
              emotion={emotion}
              isSpeaking={isSpeaking}
              isWorking={isWorking}
              workLabel={workLabel}
              workProgress={workProgress}
            />
          )}
        </Suspense>

        <StageFloor />
        <StageRings />

        <Sparkles count={26} scale={[4, 2.6, 4]} size={1.6} speed={0.22} color="#5A7A99" position={[0, 1, 0]} opacity={0.45} />

        <ContactShadows
          position={[0, -0.428, 0]}
          opacity={0.62}
          scale={3.5}
          blur={1.6}
          far={1.6}
          color="#000000"
        />

        <OrbitControls
          autoRotate
          autoRotateSpeed={0.55}
          enableZoom={false}
          enablePan={false}
          target={[0, 0.25, 0]}
          minPolarAngle={Math.PI / 3.4}
          maxPolarAngle={Math.PI / 1.75}
          minAzimuthAngle={-Math.PI / 2.6}
          maxAzimuthAngle={Math.PI / 2.6}
        />
      </Canvas>
    </div>
  );
}

export default Stage3DCanvas;
