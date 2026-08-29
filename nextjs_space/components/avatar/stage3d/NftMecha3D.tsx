'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { FighterLoadout } from '@/lib/cosmetics/stats';

export interface NftMecha3DProps {
  avatarId?: string;
  emotion?: 'neutral' | 'happy' | 'surprised' | 'thinking' | 'confident' | 'battle';
  isSpeaking?: boolean;
  isWorking?: boolean;
  workLabel?: string;
  workProgress?: number;
  loadout?: FighterLoadout;
}

/**
 * NEXT-GENERATION TRIPLE-A SCI-FI CYBERNETIC ANDROID / SENTINEL
 * Designed with precision biomechanical anatomy, high-gloss carbon/chrome PBR shaders,
 * dual interactive glowing optical eye lenses, rotating Arc Reactor core, and floating drone wings.
 */
export function NftMecha3D({
  avatarId = 'cyber_humanoid',
  emotion = 'confident',
  isSpeaking = false,
  isWorking = false,
  loadout,
}: NftMecha3DProps) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftEyeRef = useRef<THREE.Mesh>(null);
  const rightEyeRef = useRef<THREE.Mesh>(null);
  const eyeGlowLeftRef = useRef<THREE.Mesh>(null);
  const eyeGlowRightRef = useRef<THREE.Mesh>(null);
  const chestRef = useRef<THREE.Group>(null);
  const reactorCoreRef = useRef<THREE.Mesh>(null);
  const gyroRing1Ref = useRef<THREE.Mesh>(null);
  const gyroRing2Ref = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Group>(null);
  const leftDroneWingRef = useRef<THREE.Group>(null);
  const rightDroneWingRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const spineConduitRef = useRef<THREE.Group>(null);

  // Triple-A Unreal Engine 5.5 Color Palettes
  const palette = useMemo(() => {
    const key = (avatarId || 'cyber_humanoid').toLowerCase();
    if (key.includes('quantum') || key.includes('omega') || key.includes('unit-o')) {
      return {
        armorPrimary: '#F1F5F9', // Pearl nano-ceramic
        armorSecondary: '#0F172A', // Obsidian carbon
        chrome: '#E2E8F0', // Liquid chrome
        accent: '#8B5CF6', // Electric violet
        glow: '#A855F7', // Violet plasma
        eyeColor: '#00F0FF', // Cyan optical sensor
        metalness: 0.94,
        roughness: 0.1,
      };
    }
    if (key.includes('titan') || key.includes('midas') || key.includes('wall_street')) {
      return {
        armorPrimary: '#090A0F', // Stealth black carbon
        armorSecondary: '#CA8A04', // 24K Brushed gold
        chrome: '#FDE047', // Polished gold chrome
        accent: '#EAB308', // Imperial gold
        glow: '#F59E0B', // Amber energy
        eyeColor: '#FEF08A', // Gold optical sensor
        metalness: 0.96,
        roughness: 0.12,
      };
    }
    if (key.includes('cosmic') || key.includes('veil') || key.includes('nyx')) {
      return {
        armorPrimary: '#0F091A', // Deep cosmic void
        armorSecondary: '#581C87', // Astral violet weave
        chrome: '#C084FC', // Iridescent chrome
        accent: '#06B6D4', // Supernova cyan
        glow: '#EC4899', // Plasma magenta
        eyeColor: '#22D3EE', // Holographic cyan
        metalness: 0.9,
        roughness: 0.14,
      };
    }
    if (key.includes('shadow') || key.includes('viper')) {
      return {
        armorPrimary: '#050608', // Stealth matte carbon
        armorSecondary: '#450A1A', // Crimson weave
        chrome: '#94A3B8', // Dark gunmetal
        accent: '#EF4444', // Laser red
        glow: '#F43F5E', // Crimson plasma
        eyeColor: '#FF0055', // Red optical visor
        metalness: 0.88,
        roughness: 0.16,
      };
    }
    if (key.includes('predator') || key.includes('apex')) {
      return {
        armorPrimary: '#11151C', // Heavy ballistic steel
        armorSecondary: '#9A3412', // Hazard industrial orange
        chrome: '#CBD5E1', // Heavy forged titanium
        accent: '#F97316', // Molten beacon
        glow: '#FB923C', // Solar flare core
        eyeColor: '#00F0FF', // Cyan targeting lens
        metalness: 0.92,
        roughness: 0.14,
      };
    }
    // Default: Genesis Kairos Cybernetic Android (Electric Cyan & Liquid Chrome)
    return {
      armorPrimary: '#070B12', // Deep aerodynamic obsidian
      armorSecondary: '#0284C7', // Cyberpunk cobalt
      chrome: '#F0F9FF', // Liquid silver chrome
      accent: '#00F0FF', // Neon electric cyan
      glow: '#00F0FF', // Cyan plasma
      eyeColor: '#00F0FF', // Glowing cyan optics
      metalness: 0.92,
      roughness: 0.1,
    };
  }, [avatarId]);

  // Triple-A PBR Shaders
  const materials = useMemo(() => {
    return {
      // 1. Aerodynamic Primary Nano-Composite Armor
      primaryArmor: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.armorPrimary),
        metalness: palette.metalness,
        roughness: palette.roughness,
        envMapIntensity: 2.5,
      }),
      // 2. Secondary Carbon Fiber Weave Plates
      secondaryArmor: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.armorSecondary),
        metalness: 0.88,
        roughness: 0.18,
        envMapIntensity: 2.0,
      }),
      // 3. Mirror-Polished Liquid Chrome & Hydraulic Tendons
      liquidChrome: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.chrome),
        metalness: 0.98,
        roughness: 0.04,
        envMapIntensity: 3.0,
      }),
      // 4. Dark Titanium Joint Actuators & Sub-Frame
      darkSubframe: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#030508'),
        metalness: 0.75,
        roughness: 0.28,
      }),
      // 5. High-Gloss Metallic Accent Trims
      accentTrim: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.accent),
        metalness: 0.95,
        roughness: 0.12,
        envMapIntensity: 2.2,
      }),
      // 6. Glowing Optical Camera Lenses (Dual Eyes)
      opticalLens: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.eyeColor),
      }),
      // 7. Emissive Eye Glow Corona (Additive Blending)
      eyeCorona: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
        transparent: true,
        opacity: isSpeaking ? 0.95 : 0.75,
        blending: THREE.AdditiveBlending,
      }),
      // 8. Glowing Plasma Arc Core
      plasmaCore: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
      }),
      // 9. Floating Holographic Energy Blades & Halo
      holographicBlades: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    };
  }, [palette, isSpeaking]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const ptrX = state.pointer.x;
    const ptrY = state.pointer.y;

    // 1. Natural Organic Hovering & Breathing
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 1.8) * 0.025 - 0.12;
    }

    // 2. Interactive Head & Eye Tracking (Follows mouse cursor smoothly)
    if (headRef.current) {
      headRef.current.rotation.y = THREE.MathUtils.lerp(headRef.current.rotation.y, ptrX * 0.45, 0.08);
      headRef.current.rotation.x = THREE.MathUtils.lerp(headRef.current.rotation.x, -ptrY * 0.25 - 0.02, 0.08);
    }

    // 3. Eye Blinking & Dilation Pulses
    const blink = Math.sin(t * 0.5) > 0.98 ? 0.1 : 1.0;
    if (leftEyeRef.current && rightEyeRef.current) {
      leftEyeRef.current.scale.set(1, blink, 1);
      rightEyeRef.current.scale.set(1, blink, 1);
    }
    if (eyeGlowLeftRef.current && eyeGlowRightRef.current) {
      const eyePulse = (1 + Math.sin(t * 4) * 0.15) * blink;
      eyeGlowLeftRef.current.scale.set(eyePulse, eyePulse, 1);
      eyeGlowRightRef.current.scale.set(eyePulse, eyePulse, 1);
    }

    // 4. Arc Reactor Gyroscopic Rotation & Pulsing Core
    if (gyroRing1Ref.current) {
      gyroRing1Ref.current.rotation.x = t * 2.5;
      gyroRing1Ref.current.rotation.y = -t * 1.6;
    }
    if (gyroRing2Ref.current) {
      gyroRing2Ref.current.rotation.y = t * 2.8;
      gyroRing2Ref.current.rotation.z = -t * 1.9;
    }
    if (reactorCoreRef.current) {
      const corePulse = 1 + Math.sin(t * 5) * 0.12;
      reactorCoreRef.current.scale.set(corePulse, corePulse, corePulse);
    }

    // 5. Floating Drone Wings Hovering (Physics-like micro-oscillation)
    if (leftDroneWingRef.current && rightDroneWingRef.current) {
      const flap = Math.sin(t * 2.2) * 0.06;
      leftDroneWingRef.current.position.y = 0.38 + Math.sin(t * 2.2 + 0.5) * 0.02;
      leftDroneWingRef.current.rotation.z = 0.2 + flap;
      rightDroneWingRef.current.position.y = 0.38 + Math.sin(t * 2.2 + 0.5) * 0.02;
      rightDroneWingRef.current.rotation.z = -0.2 - flap;
    }

    // 6. Floating Holographic Halo Orbit
    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.4;
      haloRef.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.6) * 0.08;
    }

    // 7. Arm Sway
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.04;
      rightArmRef.current.rotation.x = -Math.sin(t * 1.8) * 0.04;
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.12, 0]} scale={0.96}>
      {/* ============================================================ */}
      {/* 1. SCULPTED CYBERNETIC ANDROID HEAD & GLOWING OPTICAL EYES   */}
      {/* ============================================================ */}
      <group ref={headRef} position={[0, 0.68, 0]}>
        {/* Sleek Biomechanical Cranium Shell */}
        <mesh material={materials.primaryArmor} position={[0, 0.05, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.2, 32, 32]} />
        </mesh>

        {/* Aerodynamic Carbon Temporal Brow Plates */}
        <mesh material={materials.secondaryArmor} position={[0, 0.08, 0.08]} rotation={[0.2, 0, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.18, 16, 24]} />
        </mesh>

        {/* Sculpted Faceplate Mask with Geometric Seams */}
        <mesh material={materials.secondaryArmor} position={[0, -0.02, 0.1]} castShadow>
          <sphereGeometry args={[0.16, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
        </mesh>

        {/* Sleek Carbon Crest & Blade Antennae */}
        <mesh material={materials.accentTrim} position={[0, 0.22, -0.04]} rotation={[-0.25, 0, 0]} castShadow>
          <coneGeometry args={[0.035, 0.26, 16]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[0, 0.23, -0.04]} rotation={[-0.25, 0, 0]}>
          <coneGeometry args={[0.018, 0.28, 8]} />
        </mesh>

        {/* Swept Ear Sensor Fins (Left & Right) */}
        <group position={[-0.17, 0.06, -0.04]} rotation={[0, -0.25, -0.35]}>
          <mesh material={materials.liquidChrome} castShadow>
            <cylinderGeometry args={[0.018, 0.035, 0.22, 16]} />
          </mesh>
          <mesh material={materials.holographicBlades} position={[0, 0.11, 0]}>
            <coneGeometry args={[0.02, 0.07, 8]} />
          </mesh>
        </group>
        <group position={[0.17, 0.06, -0.04]} rotation={[0, 0.25, 0.35]}>
          <mesh material={materials.liquidChrome} castShadow>
            <cylinderGeometry args={[0.018, 0.035, 0.22, 16]} />
          </mesh>
          <mesh material={materials.holographicBlades} position={[0, 0.11, 0]}>
            <coneGeometry args={[0.02, 0.07, 8]} />
          </mesh>
        </group>

        {/* DUAL NEXT-GEN GLOWING CYBERNETIC OPTICAL EYE LENSES */}
        <group position={[0, 0.02, 0.16]}>
          {/* Left Cyber Optical Eye */}
          <group position={[-0.065, 0, 0]}>
            {/* Chrome Eye Socket Ring */}
            <mesh material={materials.liquidChrome}>
              <torusGeometry args={[0.032, 0.008, 16, 24]} />
            </mesh>
            {/* Dark Inner Iris Aperture */}
            <mesh material={materials.darkSubframe} position={[0, 0, -0.005]}>
              <circleGeometry args={[0.028, 24]} />
            </mesh>
            {/* Glowing Optical Sensor Core */}
            <mesh ref={leftEyeRef} material={materials.opticalLens} position={[0, 0, 0.002]}>
              <circleGeometry args={[0.018, 24]} />
            </mesh>
            {/* Corona Glow Flare */}
            <mesh ref={eyeGlowLeftRef} material={materials.eyeCorona} position={[0, 0, 0.004]}>
              <circleGeometry args={[0.038, 24]} />
            </mesh>
          </group>

          {/* Right Cyber Optical Eye */}
          <group position={[0.065, 0, 0]}>
            {/* Chrome Eye Socket Ring */}
            <mesh material={materials.liquidChrome}>
              <torusGeometry args={[0.032, 0.008, 16, 24]} />
            </mesh>
            {/* Dark Inner Iris Aperture */}
            <mesh material={materials.darkSubframe} position={[0, 0, -0.005]}>
              <circleGeometry args={[0.028, 24]} />
            </mesh>
            {/* Glowing Optical Sensor Core */}
            <mesh ref={rightEyeRef} material={materials.opticalLens} position={[0, 0, 0.002]}>
              <circleGeometry args={[0.018, 24]} />
            </mesh>
            {/* Corona Glow Flare */}
            <mesh ref={eyeGlowRightRef} material={materials.eyeCorona} position={[0, 0, 0.004]}>
              <circleGeometry args={[0.038, 24]} />
            </mesh>
          </group>
        </group>

        {/* Articulated Cybernetic Jaw & Audio Intake Vents */}
        <group position={[0, -0.08, 0.09]}>
          <mesh material={materials.primaryArmor} castShadow>
            <capsuleGeometry args={[0.065, 0.09, 16, 16]} />
          </mesh>
          {/* Glowing Hexagonal Audio Vents */}
          <mesh material={materials.plasmaCore} position={[0, -0.02, 0.075]}>
            <cylinderGeometry args={[0.035, 0.035, 0.01, 6]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          {/* Dual Chrome Hydraulic Neck Pistons */}
          <mesh material={materials.liquidChrome} position={[-0.07, -0.05, -0.02]}>
            <cylinderGeometry args={[0.016, 0.016, 0.12, 16]} />
          </mesh>
          <mesh material={materials.liquidChrome} position={[0.07, -0.05, -0.02]}>
            <cylinderGeometry args={[0.016, 0.016, 0.12, 16]} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* 2. SCULPTED BIOMECHANICAL TORSO & ARC REACTOR HEART          */}
      {/* ============================================================ */}
      <group ref={chestRef} position={[0, 0.26, 0]}>
        {/* Aerodynamic Carbon Torso Core */}
        <mesh material={materials.primaryArmor} position={[0, 0.02, -0.02]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.16, 0.38, 32]} />
        </mesh>

        {/* Sculpted Curved Pectoral Muscle Plates */}
        <mesh material={materials.secondaryArmor} position={[-0.11, 0.12, 0.11]} rotation={[0.12, -0.18, -0.08]} castShadow>
          <capsuleGeometry args={[0.065, 0.13, 16, 16]} />
        </mesh>
        <mesh material={materials.secondaryArmor} position={[0.11, 0.12, 0.11]} rotation={[0.12, 0.18, 0.08]} castShadow>
          <capsuleGeometry args={[0.065, 0.13, 16, 16]} />
        </mesh>

        {/* Clavicle Power Conduits (Liquid Chrome) */}
        <mesh material={materials.liquidChrome} position={[-0.13, 0.22, 0.04]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.018, 0.018, 0.18, 16]} />
        </mesh>
        <mesh material={materials.liquidChrome} position={[0.13, 0.22, 0.04]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.018, 0.018, 0.18, 16]} />
        </mesh>

        {/* CENTRAL GLOWING QUANTUM ARC REACTOR CORE */}
        <group position={[0, 0.05, 0.14]}>
          {/* Beveled Chrome Reactor Housing */}
          <mesh material={materials.liquidChrome} castShadow>
            <torusGeometry args={[0.095, 0.018, 16, 32]} />
          </mesh>

          {/* Gyroscopic Multi-Axis Spinning Rings */}
          <mesh ref={gyroRing1Ref} material={materials.holographicBlades}>
            <torusGeometry args={[0.075, 0.007, 16, 24]} />
          </mesh>
          <mesh ref={gyroRing2Ref} material={materials.holographicBlades}>
            <torusGeometry args={[0.055, 0.005, 16, 24]} />
          </mesh>

          {/* Inner Pulsing Plasma Crystal */}
          <mesh ref={reactorCoreRef} material={materials.plasmaCore}>
            <dodecahedronGeometry args={[0.035, 1]} />
          </mesh>
          {/* Volumetric Core Flare */}
          <mesh material={materials.holographicBlades}>
            <sphereGeometry args={[0.05, 16, 16]} />
          </mesh>
        </group>

        {/* Exposed Spinal Hydraulic Vertebrae (Rear Neural Conduits) */}
        <group ref={spineConduitRef} position={[0, 0.02, -0.15]}>
          {[-0.1, -0.03, 0.04, 0.11].map((y, idx) => (
            <group key={idx} position={[0, y, 0]}>
              <mesh material={materials.liquidChrome}>
                <cylinderGeometry args={[0.035, 0.035, 0.045, 16]} rotation={[Math.PI / 2, 0, 0]} />
              </mesh>
              <mesh material={materials.plasmaCore} position={[0, 0, -0.018]}>
                <sphereGeometry args={[0.01, 12, 12]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ============================================================ */}
      {/* 3. ARTICULATED CYBERNETIC ARMS & SHOULDERS                  */}
      {/* ============================================================ */}
      {/* Left Arm & Pauldron */}
      <group ref={leftArmRef} position={[-0.31, 0.38, 0]}>
        {/* Layered Aerodynamic Pauldron (Shoulder Armor) */}
        <mesh material={materials.primaryArmor} position={[-0.03, 0.02, 0]} rotation={[0, 0, 0.3]} castShadow>
          <sphereGeometry args={[0.11, 24, 24]} />
        </mesh>
        <mesh material={materials.secondaryArmor} position={[-0.06, 0.05, 0]} rotation={[0, 0, 0.45]} castShadow>
          <capsuleGeometry args={[0.05, 0.14, 12, 16]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[-0.12, 0.07, 0]} rotation={[0, 0, 0.45]}>
          <coneGeometry args={[0.018, 0.16, 8]} />
        </mesh>

        {/* Upper Bicep & Hydraulic Actuators */}
        <mesh material={materials.darkSubframe} position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.04, 0.035, 0.16, 16]} />
        </mesh>
        <mesh material={materials.liquidChrome} position={[0.02, -0.14, 0.02]}>
          <cylinderGeometry args={[0.012, 0.012, 0.18, 12]} />
        </mesh>

        {/* Elbow Joint & Forearm */}
        <mesh material={materials.accentTrim} position={[0, -0.24, 0]}>
          <sphereGeometry args={[0.035, 16, 16]} />
        </mesh>
        <mesh material={materials.primaryArmor} position={[0, -0.38, 0.02]} castShadow>
          <capsuleGeometry args={[0.042, 0.18, 16, 16]} />
        </mesh>

        {/* Articulated Cyber Hand & Plasma Fingers */}
        <mesh material={materials.liquidChrome} position={[0, -0.52, 0.02]}>
          <sphereGeometry args={[0.03, 16, 16]} />
        </mesh>
      </group>

      {/* Right Arm & Pauldron */}
      <group ref={rightArmRef} position={[0.31, 0.38, 0]}>
        {/* Layered Aerodynamic Pauldron */}
        <mesh material={materials.primaryArmor} position={[0.03, 0.02, 0]} rotation={[0, 0, -0.3]} castShadow>
          <sphereGeometry args={[0.11, 24, 24]} />
        </mesh>
        <mesh material={materials.secondaryArmor} position={[0.06, 0.05, 0]} rotation={[0, 0, -0.45]} castShadow>
          <capsuleGeometry args={[0.05, 0.14, 12, 16]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[0.12, 0.07, 0]} rotation={[0, 0, -0.45]}>
          <coneGeometry args={[0.018, 0.16, 8]} />
        </mesh>

        {/* Upper Bicep & Hydraulic Actuators */}
        <mesh material={materials.darkSubframe} position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.04, 0.035, 0.16, 16]} />
        </mesh>
        <mesh material={materials.liquidChrome} position={[-0.02, -0.14, 0.02]}>
          <cylinderGeometry args={[0.012, 0.012, 0.18, 12]} />
        </mesh>

        {/* Elbow Joint & Forearm */}
        <mesh material={materials.accentTrim} position={[0, -0.24, 0]}>
          <sphereGeometry args={[0.035, 16, 16]} />
        </mesh>
        <mesh material={materials.primaryArmor} position={[0, -0.38, 0.02]} castShadow>
          <capsuleGeometry args={[0.042, 0.18, 16, 16]} />
        </mesh>

        {/* Articulated Cyber Hand & Plasma Fingers */}
        <mesh material={materials.liquidChrome} position={[0, -0.52, 0.02]}>
          <sphereGeometry args={[0.03, 16, 16]} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 4. FLOATING MAGNETIC DRONE WINGS & CELESTIAL HALO            */}
      {/* ============================================================ */}
      {/* Left Drone Wing */}
      <group ref={leftDroneWingRef} position={[-0.26, 0.38, -0.15]}>
        <mesh material={materials.secondaryArmor} rotation={[0, 0, -0.55]} castShadow>
          <coneGeometry args={[0.038, 0.48, 16]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[-0.07, 0.1, 0]} rotation={[0, 0, -0.55]}>
          <coneGeometry args={[0.02, 0.54, 8]} />
        </mesh>
      </group>

      {/* Right Drone Wing */}
      <group ref={rightDroneWingRef} position={[0.26, 0.38, -0.15]}>
        <mesh material={materials.secondaryArmor} rotation={[0, 0, 0.55]} castShadow>
          <coneGeometry args={[0.038, 0.48, 16]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[0.07, 0.1, 0]} rotation={[0, 0, 0.55]}>
          <coneGeometry args={[0.02, 0.54, 8]} />
        </mesh>
      </group>

      {/* Celestial Holographic Data Halo (Floating Overhead) */}
      <group ref={haloRef} position={[0, 0.9, -0.1]}>
        <mesh material={materials.holographicBlades}>
          <torusGeometry args={[0.3, 0.008, 16, 48]} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, idx) => (
          <mesh
            key={idx}
            material={materials.plasmaCore}
            position={[Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0]}
          >
            <sphereGeometry args={[0.014, 12, 12]} />
          </mesh>
        ))}
      </group>

      {/* ============================================================ */}
      {/* 5. TAPERED WAIST & ANTI-GRAVITY REPULSOR CORE               */}
      {/* ============================================================ */}
      <group position={[0, -0.04, 0]}>
        {/* Tapered Ballistic Waist Pelvis */}
        <mesh material={materials.primaryArmor} castShadow>
          <cylinderGeometry args={[0.14, 0.07, 0.18, 32]} />
        </mesh>
        {/* Chrome Hydraulic Hip Actuators */}
        <mesh material={materials.liquidChrome} position={[-0.08, 0.02, 0]} rotation={[0, 0, 0.25]}>
          <cylinderGeometry args={[0.016, 0.016, 0.14, 16]} />
        </mesh>
        <mesh material={materials.liquidChrome} position={[0.08, 0.02, 0]} rotation={[0, 0, -0.25]}>
          <cylinderGeometry args={[0.016, 0.016, 0.14, 16]} />
        </mesh>

        {/* Anti-Gravity Repulsor Emitter (Bottom Plume) */}
        <mesh material={materials.accentTrim} position={[0, -0.12, 0]}>
          <cylinderGeometry args={[0.05, 0.035, 0.05, 24]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[0, -0.18, 0]}>
          <torusGeometry args={[0.1, 0.012, 16, 32]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
        <mesh material={materials.plasmaCore} position={[0, -0.22, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.055, 0.18, 24]} />
        </mesh>
      </group>

      {/* Floating Cybernetic Sparkle Motes */}
      <Sparkles
        count={25}
        scale={2.0}
        size={2.0}
        speed={0.5}
        color={palette.glow}
        opacity={0.65}
      />
    </group>
  );
}

export default NftMecha3D;
