'use client';

import React, { Suspense, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { FighterLoadout } from '@/lib/cosmetics/stats';
import { AnimeCompanion } from './AnimeCompanion';
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
          opacity={0.16}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <group ref={ripples}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
            <ringGeometry args={[0.98, 1.01, 64]} />
            <meshBasicMaterial
              color="#5A7AFF"
              transparent
              opacity={0.2}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

export function Stage3DCanvas({ overrideGlbUrl, className = '', avatarId = 'cyber_humanoid', emotion = 'confident', isSpeaking = false, isWorking = false, workLabel, workProgress, loadout }: Stage3DCanvasProps) {
  return (
    <div className={`relative w-full h-full min-h-[320px] ${className}`}>
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 35, position: [0.35, 1.15, 3.3] }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* depth falloff sells the "4D" stage dimensionality */}
        <fog attach="fog" args={['#05060c', 6.5, 14]} />

        <ambientLight intensity={0.38} />
        <directionalLight position={[3, 5, 4]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
        {/* key cyan + gold practicals */}
        <pointLight position={[-3, 1.6, -2]} intensity={1.6} distance={8} color="#00F0FF" />
        <pointLight position={[3, 1.2, -2.5]} intensity={1.1} distance={8} color="#FFD700" />
        {/* colored rims from behind separate the character from the void */}
        <spotLight position={[-2.4, 2.8, -2.6]} angle={0.7} penumbra={1} intensity={2.2} distance={12} color="#7DF9FF" />
        <spotLight position={[2.6, 2.2, -2.8]} angle={0.7} penumbra={1} intensity={1.5} distance={12} color="#FF9D66" />

        <Suspense fallback={<AnimeCompanion avatarId={avatarId} emotion={emotion} isSpeaking={isSpeaking} loadout={loadout} />}>
          {overrideGlbUrl ? (
            <CustomGLBModel url={overrideGlbUrl} />
          ) : (
            <AnimeCompanion
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

        <Suspense fallback={<AnimeCompanion avatarId={avatarId} emotion={emotion} isSpeaking={isSpeaking} loadout={loadout} />}>
          {overrideGlbUrl ? (
            <CustomGLBModel url={overrideGlbUrl} />
          ) : (
            <AnimeCompanion avatarId={avatarId} loadout={loadout} emotion={emotion} isSpeaking={isSpeaking} />
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
          target={[0, 0.55, 0]}
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
