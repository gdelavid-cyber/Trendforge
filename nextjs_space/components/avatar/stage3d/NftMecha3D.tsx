'use client';

import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles, Float } from '@react-three/drei';
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
 * NEXT-GENERATION TRIPLE-A SCI-FI CYBERNETIC SENTINEL
 * Sculpted with curved biomechanical aerodynamic geometry, high-gloss PBR materials,
 * gyroscopic plasma Arc Reactor core, floating crystalline wing blades, and volumetric ion thrusters.
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
  const chestRef = useRef<THREE.Group>(null);
  const coreOuterRef = useRef<THREE.Group>(null);
  const coreInnerRef = useRef<THREE.Mesh>(null);
  const gyroRing1Ref = useRef<THREE.Mesh>(null);
  const gyroRing2Ref = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Group>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftThrusterRef = useRef<THREE.Mesh>(null);
  const rightThrusterRef = useRef<THREE.Mesh>(null);
  const repulsorGlowRef = useRef<THREE.Mesh>(null);

  // Triple-A Unreal Engine 5.5 PBR Shading Palette Profiles
  const palette = useMemo(() => {
    const key = (avatarId || 'cyber_humanoid').toLowerCase();
    if (key.includes('quantum') || key.includes('omega') || key.includes('unit-o')) {
      return {
        armorPrimary: '#F0F4FA', // Pearl white nano-ceramic
        armorSecondary: '#141824', // Deep slate obsidian
        metalChrome: '#E2E8F0', // Polished liquid chrome
        accent: '#A855F7', // Quantum violet
        glow: '#C084FC', // Emissive neon plasma
        visor: '#00F0FF', // Cyan sensor visor
        roughness: 0.12,
        metalness: 0.92,
      };
    }
    if (key.includes('titan') || key.includes('midas') || key.includes('wall_street')) {
      return {
        armorPrimary: '#0E0F14', // Matte obsidian carbon
        armorSecondary: '#D4AF37', // 24K Brushed imperial gold
        metalChrome: '#FDE047', // Polished gold chrome
        accent: '#EAB308', // Radiant gold
        glow: '#F59E0B', // Molten amber core
        visor: '#FEF08A', // Gold optical visor
        roughness: 0.14,
        metalness: 0.95,
      };
    }
    if (key.includes('cosmic') || key.includes('veil') || key.includes('nyx')) {
      return {
        armorPrimary: '#110C1D', // Deep cosmic void
        armorSecondary: '#4C1D95', // Astral violet weave
        metalChrome: '#C084FC', // Iridescent chrome
        accent: '#06B6D4', // Supernova cyan
        glow: '#EC4899', // Plasma magenta
        visor: '#22D3EE', // Holographic cyan
        roughness: 0.16,
        metalness: 0.9,
      };
    }
    if (key.includes('shadow') || key.includes('viper')) {
      return {
        armorPrimary: '#08090D', // Stealth matte carbon
        armorSecondary: '#3B0712', // Crimson weave
        metalChrome: '#94A3B8', // Dark titanium
        accent: '#EF4444', // Laser red
        glow: '#F43F5E', // Crimson plasma
        visor: '#FF0055', // Red optical visor
        roughness: 0.18,
        metalness: 0.88,
      };
    }
    if (key.includes('predator') || key.includes('apex')) {
      return {
        armorPrimary: '#171B24', // Heavy ballistic steel
        armorSecondary: '#C2410C', // Hazard industrial orange
        metalChrome: '#CBD5E1', // Heavy forged titanium
        accent: '#F97316', // Molten beacon
        glow: '#FB923C', // Solar flare core
        visor: '#00F0FF', // Cyan targeting lens
        roughness: 0.15,
        metalness: 0.92,
      };
    }
    // Default: Kairos Genesis Cyber Humanoid (Next-Gen Cyberpunk Cyan & Dark Gunmetal)
    return {
      armorPrimary: '#0A0E17', // Aerodynamic obsidian alloy
      armorSecondary: '#00F0FF', // Cyberpunk electric cyan
      metalChrome: '#E0F2FE', // Polished liquid chrome
      accent: '#38BDF8', // Sky plasma
      glow: '#00F0FF', // Neon cyan plasma
      visor: '#00F0FF', // Electric visor
      roughness: 0.12,
      metalness: 0.92,
    };
  }, [avatarId]);

  // Next-Gen PBR Shader Materials
  const materials = useMemo(() => {
    return {
      // 1. Sleek Aerodynamic Primary Nano-Chassis
      primaryArmor: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.armorPrimary),
        metalness: palette.metalness,
        roughness: palette.roughness,
        envMapIntensity: 2.2,
      }),
      // 2. Secondary Carbon & Ceramic Armor Plates
      secondaryArmor: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.armorSecondary),
        metalness: 0.85,
        roughness: 0.22,
        envMapIntensity: 1.8,
      }),
      // 3. Mirror-Polished Liquid Chrome & Hydraulic Tendons
      liquidChrome: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.metalChrome),
        metalness: 0.98,
        roughness: 0.05,
        envMapIntensity: 2.5,
      }),
      // 4. Dark Sub-Frame & Joint Actuators
      darkSubframe: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#05070B'),
        metalness: 0.7,
        roughness: 0.35,
      }),
      // 5. Metallic Accent Trims
      accentTrim: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.accent),
        metalness: 0.92,
        roughness: 0.15,
        envMapIntensity: 2.0,
      }),
      // 6. Curved Refractive Optical Visor Sensor
      opticalVisor: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(palette.visor),
        emissive: new THREE.Color(palette.glow),
        emissiveIntensity: isSpeaking ? 3.2 : 2.0,
        roughness: 0.04,
        metalness: 0.2,
        transmission: 0.6,
        ior: 1.55,
        transparent: true,
        opacity: 0.95,
      }),
      // 7. Glowing Plasma Core (Volumetric Emissive)
      plasmaCore: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
      }),
      // 8. Holographic Energy Rings & Laser Blades (Additive Blending)
      energyBlades: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
      // 9. Ion Thruster Exhaust Plume
      ionPlume: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      }),
    };
  }, [palette, isSpeaking]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // 1. Natural Organic Hovering & Breathing
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 1.8) * 0.03 - 0.15;
    }

    // 2. Smooth Articulated Head Tracking
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.75) * 0.18;
      headRef.current.rotation.x = Math.sin(t * 1.2) * 0.04 - 0.02;
    }

    // 3. Multi-Axis Arc Reactor Gyroscopic Rotation
    if (coreOuterRef.current) {
      coreOuterRef.current.rotation.z = t * 2.2;
      coreOuterRef.current.rotation.y = t * 1.4;
    }
    if (coreInnerRef.current) {
      coreInnerRef.current.rotation.z = -t * 3.5;
      coreInnerRef.current.rotation.x = t * 1.8;
      const pulse = 1 + Math.sin(t * 6) * 0.12;
      coreInnerRef.current.scale.set(pulse, pulse, pulse);
    }
    if (gyroRing1Ref.current) {
      gyroRing1Ref.current.rotation.x = t * 2.8;
      gyroRing1Ref.current.rotation.y = -t * 1.8;
    }
    if (gyroRing2Ref.current) {
      gyroRing2Ref.current.rotation.y = t * 3.1;
      gyroRing2Ref.current.rotation.z = -t * 2.0;
    }

    // 4. Floating Holographic Wings Breathing
    if (leftWingRef.current && rightWingRef.current) {
      const wingFlap = Math.sin(t * 2.0) * 0.08;
      leftWingRef.current.rotation.y = -0.3 + wingFlap;
      leftWingRef.current.rotation.z = 0.15 + wingFlap * 0.5;
      rightWingRef.current.rotation.y = 0.3 - wingFlap;
      rightWingRef.current.rotation.z = -0.15 - wingFlap * 0.5;
    }

    // 5. Celestial Halo Orbit
    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.5;
      haloRef.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.8) * 0.1;
    }

    // 6. Arm Servo Sway
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.05;
      rightArmRef.current.rotation.x = -Math.sin(t * 1.8) * 0.05;
    }

    // 7. Ion Thruster Pulse
    if (leftThrusterRef.current && rightThrusterRef.current) {
      const thrusterPulse = 1 + Math.sin(t * 10) * 0.2;
      leftThrusterRef.current.scale.set(1, thrusterPulse, 1);
      rightThrusterRef.current.scale.set(1, thrusterPulse, 1);
    }

    // 8. Repulsor Wave Pulse
    if (repulsorGlowRef.current) {
      const repulse = 1 + Math.sin(t * 4) * 0.15;
      repulsorGlowRef.current.scale.set(repulse, repulse, 1);
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.15, 0]} scale={0.95}>
      {/* ============================================================ */}
      {/* 1. SCULPTED BIOMECHANICAL HELMET & VISOR                     */}
      {/* ============================================================ */}
      <group ref={headRef} position={[0, 0.72, 0]}>
        {/* Aerodynamic Cranium Shell (Smooth Sphere/Capsule Geometry) */}
        <mesh material={materials.primaryArmor} position={[0, 0.06, 0]} castShadow receiveShadow>
          <sphereGeometry args={[0.22, 32, 32]} />
        </mesh>

        {/* Sleek Rear Head Extension (Streamlined Cyber Crest) */}
        <mesh material={materials.secondaryArmor} position={[0, 0.08, -0.1]} rotation={[-0.35, 0, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.22, 16, 24]} />
        </mesh>

        {/* Top Aerodynamic Blade Fin */}
        <mesh material={materials.accentTrim} position={[0, 0.24, -0.04]} rotation={[-0.2, 0, 0]} castShadow>
          <coneGeometry args={[0.04, 0.28, 16]} />
        </mesh>
        <mesh material={materials.energyBlades} position={[0, 0.25, -0.04]} rotation={[-0.2, 0, 0]}>
          <coneGeometry args={[0.02, 0.29, 8]} />
        </mesh>

        {/* Swept Sleek Temporal Antennae Blades (Left & Right) */}
        <group position={[-0.18, 0.12, -0.05]} rotation={[0, -0.2, -0.4]}>
          <mesh material={materials.secondaryArmor} castShadow>
            <cylinderGeometry args={[0.02, 0.04, 0.26, 16]} />
          </mesh>
          <mesh material={materials.energyBlades} position={[0, 0.13, 0]}>
            <coneGeometry args={[0.025, 0.08, 12]} />
          </mesh>
        </group>

        <group position={[0.18, 0.12, -0.05]} rotation={[0, 0.2, 0.4]}>
          <mesh material={materials.secondaryArmor} castShadow>
            <cylinderGeometry args={[0.02, 0.04, 0.26, 16]} />
          </mesh>
          <mesh material={materials.energyBlades} position={[0, 0.13, 0]}>
            <coneGeometry args={[0.025, 0.08, 12]} />
          </mesh>
        </group>

        {/* Sweeping Panoramic Curved Visor (Next-Gen Optical Shield) */}
        <group position={[0, 0.04, 0.1]}>
          {/* Curved Outer Visor Shield */}
          <mesh material={materials.opticalVisor} rotation={[0, 0, 0]} castShadow>
            <sphereGeometry args={[0.18, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.45]} />
          </mesh>

          {/* Internal Glowing Optical Blade Sensor */}
          <mesh material={materials.plasmaCore} position={[0, 0.02, 0.06]}>
            <torusGeometry args={[0.14, 0.012, 16, 32, Math.PI * 0.8]} />
          </mesh>

          {/* Twin Precision Targeting Sensors */}
          <mesh material={materials.liquidChrome} position={[-0.09, 0.03, 0.12]}>
            <sphereGeometry args={[0.016, 16, 16]} />
          </mesh>
          <mesh material={materials.liquidChrome} position={[0.09, 0.03, 0.12]}>
            <sphereGeometry args={[0.016, 16, 16]} />
          </mesh>
        </group>

        {/* Articulated Cyber Jaw & Audio Intake Vents */}
        <group position={[0, -0.09, 0.08]}>
          <mesh material={materials.primaryArmor} castShadow>
            <capsuleGeometry args={[0.08, 0.1, 16, 16]} />
          </mesh>
          {/* Glowing Hexagonal Intake Matrix */}
          <mesh material={materials.plasmaCore} position={[0, -0.02, 0.085]}>
            <cylinderGeometry args={[0.04, 0.04, 0.01, 6]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          {/* Dual Chrome Neck Actuators */}
          <mesh material={materials.liquidChrome} position={[-0.08, -0.06, -0.02]}>
            <cylinderGeometry args={[0.018, 0.018, 0.12, 16]} />
          </mesh>
          <mesh material={materials.liquidChrome} position={[0.08, -0.06, -0.02]}>
            <cylinderGeometry args={[0.018, 0.018, 0.12, 16]} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* 2. CHASSIS & GYROSCOPIC PLASMA ARC REACTOR CORE             */}
      {/* ============================================================ */}
      <group ref={chestRef} position={[0, 0.28, 0]}>
        {/* Sculpted Biomechanical Torso Base */}
        <mesh material={materials.primaryArmor} position={[0, 0.04, -0.02]} castShadow receiveShadow>
          <cylinderGeometry args={[0.26, 0.18, 0.42, 32]} />
        </mesh>

        {/* Sculpted Curved Pectoral Armor Plates */}
        <mesh material={materials.secondaryArmor} position={[-0.12, 0.14, 0.12]} rotation={[0.15, -0.2, -0.1]} castShadow>
          <capsuleGeometry args={[0.07, 0.14, 16, 16]} />
        </mesh>
        <mesh material={materials.secondaryArmor} position={[0.12, 0.14, 0.12]} rotation={[0.15, 0.2, 0.1]} castShadow>
          <capsuleGeometry args={[0.07, 0.14, 16, 16]} />
        </mesh>

        {/* Chrome Collar Clavicle Tendons */}
        <mesh material={materials.liquidChrome} position={[-0.14, 0.25, 0.04]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 16]} />
        </mesh>
        <mesh material={materials.liquidChrome} position={[0.14, 0.25, 0.04]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 16]} />
        </mesh>

        {/* Central Quantum Arc Reactor Housing */}
        <group position={[0, 0.06, 0.15]}>
          {/* Beveled Reactor Rim */}
          <mesh material={materials.accentTrim} castShadow>
            <torusGeometry args={[0.11, 0.02, 16, 32]} />
          </mesh>

          {/* Gyroscopic Multi-Axis Outer Spinning Rings */}
          <group ref={coreOuterRef}>
            <mesh ref={gyroRing1Ref} material={materials.energyBlades}>
              <torusGeometry args={[0.085, 0.008, 16, 24]} />
            </mesh>
            <mesh ref={gyroRing2Ref} material={materials.energyBlades}>
              <torusGeometry args={[0.065, 0.006, 16, 24]} />
            </mesh>
          </group>

          {/* Inner Pulsing Plasma Core */}
          <mesh ref={coreInnerRef} material={materials.plasmaCore}>
            <dodecahedronGeometry args={[0.04, 2]} />
          </mesh>
          {/* Volumetric Core Glow Halo */}
          <mesh material={materials.energyBlades}>
            <sphereGeometry args={[0.06, 16, 16]} />
          </mesh>
        </group>

        {/* Exposed Spinal Hydraulic Vertebrae (Rear) */}
        <group position={[0, 0.02, -0.16]}>
          {[-0.12, -0.04, 0.04, 0.12].map((y, idx) => (
            <group key={idx} position={[0, y, 0]}>
              <mesh material={materials.liquidChrome}>
                <cylinderGeometry args={[0.04, 0.04, 0.05, 16]} rotation={[Math.PI / 2, 0, 0]} />
              </mesh>
              <mesh material={materials.plasmaCore} position={[0, 0, -0.02]}>
                <sphereGeometry args={[0.012, 12, 12]} />
              </mesh>
            </group>
          ))}
        </group>
      </group>

      {/* ============================================================ */}
      {/* 3. SCULPTED CYBERNETIC SHOULDERS & ARMS                      */}
      {/* ============================================================ */}
      {/* Left Arm & Pauldron */}
      <group ref={leftArmRef} position={[-0.34, 0.42, 0]}>
        {/* Layered Aerodynamic Pauldron (Shoulder Pad) */}
        <mesh material={materials.primaryArmor} position={[-0.04, 0.02, 0]} rotation={[0, 0, 0.35]} castShadow>
          <sphereGeometry args={[0.13, 24, 24]} />
        </mesh>
        <mesh material={materials.secondaryArmor} position={[-0.08, 0.06, 0]} rotation={[0, 0, 0.5]} castShadow>
          <capsuleGeometry args={[0.06, 0.16, 12, 16]} />
        </mesh>
        <mesh material={materials.energyBlades} position={[-0.14, 0.08, 0]} rotation={[0, 0, 0.5]}>
          <coneGeometry args={[0.02, 0.18, 8]} />
        </mesh>

        {/* Upper Arm Bicep */}
        <mesh material={materials.darkSubframe} position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.18, 16]} />
        </mesh>
        <mesh material={materials.liquidChrome} position={[0.02, -0.16, 0.02]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 12]} />
        </mesh>

        {/* Elbow Joint & Forearm Blade */}
        <mesh material={materials.accentTrim} position={[0, -0.27, 0]}>
          <sphereGeometry args={[0.04, 16, 16]} />
        </mesh>
        <mesh material={materials.primaryArmor} position={[0, -0.42, 0.02]} castShadow>
          <capsuleGeometry args={[0.048, 0.2, 16, 16]} />
        </mesh>
        <mesh material={materials.energyBlades} position={[-0.05, -0.42, -0.02]} rotation={[0, 0, -0.1]}>
          <coneGeometry args={[0.02, 0.24, 8]} />
        </mesh>

        {/* Articulated Cyber Hand */}
        <mesh material={materials.liquidChrome} position={[0, -0.58, 0.02]}>
          <sphereGeometry args={[0.035, 16, 16]} />
        </mesh>
      </group>

      {/* Right Arm & Pauldron */}
      <group ref={rightArmRef} position={[0.34, 0.42, 0]}>
        {/* Layered Aerodynamic Pauldron */}
        <mesh material={materials.primaryArmor} position={[0.04, 0.02, 0]} rotation={[0, 0, -0.35]} castShadow>
          <sphereGeometry args={[0.13, 24, 24]} />
        </mesh>
        <mesh material={materials.secondaryArmor} position={[0.08, 0.06, 0]} rotation={[0, 0, -0.5]} castShadow>
          <capsuleGeometry args={[0.06, 0.16, 12, 16]} />
        </mesh>
        <mesh material={materials.energyBlades} position={[0.14, 0.08, 0]} rotation={[0, 0, -0.5]}>
          <coneGeometry args={[0.02, 0.18, 8]} />
        </mesh>

        {/* Upper Arm Bicep */}
        <mesh material={materials.darkSubframe} position={[0, -0.16, 0]}>
          <cylinderGeometry args={[0.045, 0.04, 0.18, 16]} />
        </mesh>
        <mesh material={materials.liquidChrome} position={[-0.02, -0.16, 0.02]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 12]} />
        </mesh>

        {/* Elbow Joint & Forearm Blade */}
        <mesh material={materials.accentTrim} position={[0, -0.27, 0]}>
          <sphereGeometry args={[0.04, 16, 16]} />
        </mesh>
        <mesh material={materials.primaryArmor} position={[0, -0.42, 0.02]} castShadow>
          <capsuleGeometry args={[0.048, 0.2, 16, 16]} />
        </mesh>
        <mesh material={materials.energyBlades} position={[0.05, -0.42, -0.02]} rotation={[0, 0, 0.1]}>
          <coneGeometry args={[0.02, 0.24, 8]} />
        </mesh>

        {/* Articulated Cyber Hand */}
        <mesh material={materials.liquidChrome} position={[0, -0.58, 0.02]}>
          <sphereGeometry args={[0.035, 16, 16]} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 4. FLOATING CRYSTALLINE WING BLADES & ION THRUSTERS         */}
      {/* ============================================================ */}
      {/* Left Wing Blade Rig */}
      <group ref={leftWingRef} position={[-0.22, 0.36, -0.18]}>
        <mesh material={materials.secondaryArmor} rotation={[0, 0, -0.6]} castShadow>
          <coneGeometry args={[0.045, 0.52, 16]} />
        </mesh>
        <mesh material={materials.energyBlades} position={[-0.08, 0.12, 0]} rotation={[0, 0, -0.6]}>
          <coneGeometry args={[0.025, 0.6, 8]} />
        </mesh>
        {/* Plasma Winglet */}
        <mesh material={materials.energyBlades} position={[-0.14, 0.26, 0]} rotation={[0, 0, -0.8]}>
          <coneGeometry args={[0.018, 0.32, 8]} />
        </mesh>
      </group>

      {/* Right Wing Blade Rig */}
      <group ref={rightWingRef} position={[0.22, 0.36, -0.18]}>
        <mesh material={materials.secondaryArmor} rotation={[0, 0, 0.6]} castShadow>
          <coneGeometry args={[0.045, 0.52, 16]} />
        </mesh>
        <mesh material={materials.energyBlades} position={[0.08, 0.12, 0]} rotation={[0, 0, 0.6]}>
          <coneGeometry args={[0.025, 0.6, 8]} />
        </mesh>
        {/* Plasma Winglet */}
        <mesh material={materials.energyBlades} position={[0.14, 0.26, 0]} rotation={[0, 0, 0.8]}>
          <coneGeometry args={[0.018, 0.32, 8]} />
        </mesh>
      </group>

      {/* Twin Ion Thruster Pods (Rear Lower) */}
      <group position={[-0.14, 0.08, -0.2]}>
        <mesh material={materials.darkSubframe} castShadow>
          <cylinderGeometry args={[0.045, 0.055, 0.2, 24]} />
        </mesh>
        <mesh ref={leftThrusterRef} material={materials.ionPlume} position={[0, -0.16, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.04, 0.16, 16]} />
        </mesh>
      </group>

      <group position={[0.14, 0.08, -0.2]}>
        <mesh material={materials.darkSubframe} castShadow>
          <cylinderGeometry args={[0.045, 0.055, 0.2, 24]} />
        </mesh>
        <mesh ref={rightThrusterRef} material={materials.ionPlume} position={[0, -0.16, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.04, 0.16, 16]} />
        </mesh>
      </group>

      {/* Celestial Holographic Data Halo (Floating Overhead) */}
      <group ref={haloRef} position={[0, 0.95, -0.12]}>
        <mesh material={materials.energyBlades}>
          <torusGeometry args={[0.34, 0.01, 16, 48]} />
        </mesh>
        {/* Floating Rune Orbit Nodes */}
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, idx) => (
          <mesh
            key={idx}
            material={materials.plasmaCore}
            position={[Math.cos(angle) * 0.34, Math.sin(angle) * 0.34, 0]}
          >
            <sphereGeometry args={[0.018, 12, 12]} />
          </mesh>
        ))}
      </group>

      {/* ============================================================ */}
      {/* 5. TAPERED WAIST & HOVERING ANTI-GRAVITY REPULSOR CORE       */}
      {/* ============================================================ */}
      <group position={[0, -0.06, 0]}>
        {/* Tapered Ballistic Waist Pelvis */}
        <mesh material={materials.primaryArmor} castShadow>
          <cylinderGeometry args={[0.16, 0.08, 0.22, 32]} />
        </mesh>
        {/* Chrome Hydraulic Hip Actuators */}
        <mesh material={materials.liquidChrome} position={[-0.1, 0.02, 0]} rotation={[0, 0, 0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 16]} />
        </mesh>
        <mesh material={materials.liquidChrome} position={[0.1, 0.02, 0]} rotation={[0, 0, -0.3]}>
          <cylinderGeometry args={[0.02, 0.02, 0.16, 16]} />
        </mesh>

        {/* Anti-Gravity Repulsor Emitter (Bottom Plume) */}
        <mesh material={materials.accentTrim} position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.06, 0.04, 0.06, 24]} />
        </mesh>
        <mesh ref={repulsorGlowRef} material={materials.energyBlades} position={[0, -0.2, 0]}>
          <torusGeometry args={[0.12, 0.015, 16, 32]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>
        <mesh material={materials.ionPlume} position={[0, -0.25, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.07, 0.22, 24]} />
        </mesh>
      </group>

      {/* Volumetric Cosmic Sparkles & Floating Energy Dust */}
      <Sparkles
        count={35}
        scale={2.2}
        size={2.5}
        speed={0.6}
        color={palette.glow}
        opacity={0.7}
      />
    </group>
  );
}

export default NftMecha3D;
