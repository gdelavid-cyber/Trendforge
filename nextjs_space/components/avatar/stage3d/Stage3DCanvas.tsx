'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF } from '@react-three/drei';
import { FighterLoadout } from '@/lib/cosmetics/stats';

export interface Stage3DCanvasProps {
  loadout?: FighterLoadout;
  overrideGlbUrl?: string;
  className?: string;
}

function Mannequin() {
  return (
    <group position={[0, -0.4, 0]}>
      {/* Torso Capsule */}
      <mesh position={[0, 0.7, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.22, 0.5, 16, 32]} />
        <meshStandardMaterial
          color="#151722"
          roughness={0.25}
          metalness={0.85}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Head Sphere */}
      <mesh position={[0, 1.22, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.16, 32, 32]} />
        <meshStandardMaterial
          color="#10121C"
          roughness={0.2}
          metalness={0.9}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Chest Energy Core Filament */}
      <mesh position={[0, 0.78, 0.2]}>
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshStandardMaterial
          color="#00F0FF"
          emissive="#00F0FF"
          emissiveIntensity={2.5}
          roughness={0.1}
        />
      </mesh>

      {/* Left Shoulder / Arm Segment */}
      <mesh position={[-0.32, 0.75, 0]} rotation={[0, 0, 0.1]}>
        <capsuleGeometry args={[0.07, 0.4, 12, 16]} />
        <meshStandardMaterial color="#1E2232" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Right Shoulder / Arm Segment */}
      <mesh position={[0.32, 0.75, 0]} rotation={[0, 0, -0.1]}>
        <capsuleGeometry args={[0.07, 0.4, 12, 16]} />
        <meshStandardMaterial color="#1E2232" roughness={0.3} metalness={0.7} />
      </mesh>

      {/* Legs Base */}
      <mesh position={[-0.12, 0.18, 0]}>
        <capsuleGeometry args={[0.08, 0.4, 12, 16]} />
        <meshStandardMaterial color="#11131D" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0.12, 0.18, 0]}>
        <capsuleGeometry args={[0.08, 0.4, 12, 16]} />
        <meshStandardMaterial color="#11131D" roughness={0.3} metalness={0.7} />
      </mesh>
    </group>
  );
}

function CustomGLBModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} position={[0, -0.4, 0]} />;
}

export function Stage3DCanvas({ overrideGlbUrl, className = '' }: Stage3DCanvasProps) {
  return (
    <div className={`relative w-full h-full min-h-[320px] ${className}`}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop="demand"
        camera={{ fov: 35, position: [0, 1.2, 3.2] }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[3, 5, 4]} intensity={1.2} castShadow />
        <directionalLight position={[-3, -2, -2]} intensity={0.4} color="#00F0FF" />

        <Suspense fallback={null}>
          <Environment preset="city" />
        </Suspense>

        <Suspense fallback={<Mannequin />}>
          {overrideGlbUrl ? <CustomGLBModel url={overrideGlbUrl} /> : <Mannequin />}
        </Suspense>

        <ContactShadows
          position={[0, -0.42, 0]}
          opacity={0.6}
          scale={3.5}
          blur={1.5}
          far={1.5}
          color="#000000"
        />

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={Math.PI / 1.8}
          minAzimuthAngle={-Math.PI / 3}
          maxAzimuthAngle={Math.PI / 3}
        />
      </Canvas>
    </div>
  );
}
