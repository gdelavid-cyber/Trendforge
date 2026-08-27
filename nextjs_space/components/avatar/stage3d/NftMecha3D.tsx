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
 * Unreal Engine 5.5 Next-Gen Hard-Surface Sci-Fi Cybernetic Robot
 * Built with Nanite-grade micro-geometry, Lumen PBR materials, and cinematic volumetric lighting.
 */
export function NftMecha3D({
  avatarId = 'cyber_humanoid',
  emotion = 'battle',
  isSpeaking = false,
  isWorking = false,
  loadout,
}: NftMecha3DProps) {
  const rootRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const coreOuterRef = useRef<THREE.Group>(null);
  const coreInnerRef = useRef<THREE.Mesh>(null);
  const gyroRingRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftThrusterRef = useRef<THREE.Mesh>(null);
  const rightThrusterRef = useRef<THREE.Mesh>(null);

  // High-End Unreal Engine 5.5 PBR Shading Palette Profiles
  const palette = useMemo(() => {
    const key = (avatarId || 'cyber_humanoid').toLowerCase();
    if (key.includes('quantum') || key.includes('omega') || key.includes('unit-o')) {
      return {
        armorPrimary: '#E6EBF5', // Pearl white nano-ceramic
        armorSecondary: '#1C1F2E', // Deep slate carbon
        metalPiston: '#D8DEE9', // Polished titanium
        accent: '#B48EAD', // Quantum violet
        glow: '#BF5AF2', // Emissive violet
        visor: '#00F0FF', // Cyan optical sensor
        specularIntensity: 0.95,
        roughness: 0.18,
      };
    }
    if (key.includes('titan') || key.includes('midas') || key.includes('wall_street')) {
      return {
        armorPrimary: '#121318', // Matte obsidian
        armorSecondary: '#D4AF37', // 24K Brushed gold
        metalPiston: '#F3E5AB', // Gold chrome
        accent: '#FFD700', // Imperial gold
        glow: '#FFB800', // Amber energy
        visor: '#FFE600', // Gold scanline
        specularIntensity: 1.0,
        roughness: 0.16,
      };
    }
    if (key.includes('cosmic') || key.includes('veil') || key.includes('hyperion')) {
      return {
        armorPrimary: '#180E29', // Deep cosmic nebula
        armorSecondary: '#3B1A59', // Violet weave
        metalPiston: '#A575D4', // Iridescent chrome
        accent: '#00F0FF', // Supernova cyan
        glow: '#D946EF', // Plasma magenta
        visor: '#00FFFF', // Holographic cyan
        specularIntensity: 0.92,
        roughness: 0.22,
      };
    }
    if (key.includes('shadow') || key.includes('nyx') || key.includes('viper')) {
      return {
        armorPrimary: '#0C0D12', // Stealth matte carbon
        armorSecondary: '#240A10', // Crimson weave
        metalPiston: '#71757E', // Dark gunmetal
        accent: '#FF0055', // Crimson neon
        glow: '#FF003C', // Laser red
        visor: '#FF0055', // Red optical visor
        specularIntensity: 0.88,
        roughness: 0.25,
      };
    }
    if (key.includes('predator') || key.includes('apex')) {
      return {
        armorPrimary: '#1E232A', // Heavy ballistic steel
        armorSecondary: '#E65100', // Hazard industrial orange
        metalPiston: '#B0BEC5', // Heavy iron
        accent: '#FF9100', // Amber beacon
        glow: '#FF6D00', // Molten core
        visor: '#00E5FF', // Blue scan sensor
        specularIntensity: 0.9,
        roughness: 0.24,
      };
    }
    // Default: Kairos Cyber Operative (Matte Cyan Titanium & Stealth Obsidian)
    return {
      armorPrimary: '#0E131F', // Deep stealth navy-titanium
      armorSecondary: '#162238', // Anodized alloy
      metalPiston: '#C5D1E8', // Chrome titanium
      accent: '#00F0FF', // Electric cyan
      glow: '#00F0FF', // Cyan pulse
      visor: '#00F0FF', // Cyan tactical sensor
      specularIntensity: 0.95,
      roughness: 0.2,
    };
  }, [avatarId]);

  // Unreal Engine 5.5 PBR Materials
  const materials = useMemo(() => {
    return {
      // Primary Nano-Ceramic Armor Chassis
      primaryArmor: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.armorPrimary),
        metalness: 0.88,
        roughness: palette.roughness,
        envMapIntensity: 1.4,
      }),
      // Secondary Ballistic Carbon-Weave Plates
      secondaryArmor: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.armorSecondary),
        metalness: 0.75,
        roughness: 0.32,
        envMapIntensity: 1.1,
      }),
      // High-Gloss Polished Chrome & Hydraulic Pistons
      chromeHydraulics: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.metalPiston),
        metalness: 0.98,
        roughness: 0.08,
        envMapIntensity: 2.0,
      }),
      // Dark Joint Sub-Frame & Flexible Conduits
      darkJoints: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#08090D'),
        metalness: 0.6,
        roughness: 0.45,
      }),
      // 24K Gold Fasteners & Micro-Circuit Trims
      goldAccents: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.accent),
        metalness: 0.92,
        roughness: 0.15,
        envMapIntensity: 1.8,
      }),
      // Lumen Optical Visor Sensor
      opticalVisor: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.visor),
        emissive: new THREE.Color(palette.glow),
        emissiveIntensity: isSpeaking ? 2.5 : 1.6,
        roughness: 0.05,
        metalness: 0.4,
        transparent: true,
        opacity: 0.94,
      }),
      // Quantum Arc Reactor Core (Emissive Volumetric Shading)
      quantumCore: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
      }),
      // Emissive Particle & Energy Rings (Additive Blending)
      energyRing: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
      }),
      // Thruster Plasma Exhaust
      plasmaExhaust: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      }),
    };
  }, [palette, isSpeaking]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    // Cinematic Breathing & Hover Damping
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 1.5) * 0.022 - 0.25;
    }

    // Dynamic Head Tracking & Micro-Scans
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.65) * 0.14;
      headRef.current.rotation.x = Math.sin(t * 1.1) * 0.035 - 0.02;
    }

    // Lumen Quantum Arc Core Rotation & Pulsing
    if (coreOuterRef.current) {
      coreOuterRef.current.rotation.z = t * 1.8;
      coreOuterRef.current.rotation.y = t * 0.9;
    }
    if (coreInnerRef.current) {
      coreInnerRef.current.rotation.z = -t * 3.2;
      coreInnerRef.current.rotation.x = t * 1.6;
    }
    if (gyroRingRef.current) {
      gyroRingRef.current.rotation.x = t * 2.2;
      gyroRingRef.current.rotation.y = -t * 1.4;
    }

    // Orbital Holographic Data Halos
    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.6;
      haloRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 0.7) * 0.08;
    }
    if (ringRef.current) {
      ringRef.current.rotation.y = t * 0.45;
    }

    // Dynamic Arm Sway & Reactive Servos
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 1.5) * 0.04;
      rightArmRef.current.rotation.x = -Math.sin(t * 1.5) * 0.04;
    }

    // Thruster Plasma Pulsing
    if (leftThrusterRef.current && rightThrusterRef.current) {
      const pulse = 1 + Math.sin(t * 8) * 0.15;
      leftThrusterRef.current.scale.set(1, pulse, 1);
      rightThrusterRef.current.scale.set(1, pulse, 1);
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.25, 0]} scale={0.92}>
      {/* ============================================================ */}
      {/* 1. NANITE-GRADE HEAD & ARTICULATED CYBER HELMET             */}
      {/* ============================================================ */}
      <group ref={headRef} position={[0, 0.78, 0]}>
        {/* Main Angular Cranium Shell */}
        <mesh material={materials.primaryArmor} position={[0, 0.08, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 0.28, 0.36]} />
        </mesh>

        {/* Top Crest Aerodynamic Fin */}
        <mesh material={materials.secondaryArmor} position={[0, 0.23, -0.02]} castShadow>
          <boxGeometry args={[0.06, 0.09, 0.32]} />
        </mesh>
        <mesh material={materials.goldAccents} position={[0, 0.25, -0.02]}>
          <boxGeometry args={[0.02, 0.02, 0.28]} />
        </mesh>

        {/* Swept Temporal Cyber Antennae (Left & Right) */}
        <mesh material={materials.secondaryArmor} position={[-0.2, 0.12, -0.06]} rotation={[0, 0, -0.25]} castShadow>
          <boxGeometry args={[0.04, 0.16, 0.18]} />
        </mesh>
        <mesh material={materials.secondaryArmor} position={[0.2, 0.12, -0.06]} rotation={[0, 0, 0.25]} castShadow>
          <boxGeometry args={[0.04, 0.16, 0.18]} />
        </mesh>

        {/* Rear Heat Sink Exhaust Gills */}
        {[-0.04, 0, 0.04].map((offsetY, idx) => (
          <mesh key={idx} material={materials.darkJoints} position={[0, 0.06 + offsetY, -0.19]}>
            <boxGeometry args={[0.24, 0.015, 0.02]} />
          </mesh>
        ))}

        {/* Lumen Panoramic Optical Visor */}
        <group position={[0, 0.06, 0.17]}>
          {/* Main Curved Sensor Visor */}
          <mesh material={materials.opticalVisor} castShadow>
            <boxGeometry args={[0.28, 0.1, 0.06]} />
          </mesh>
          {/* Internal Optical Scanline Core */}
          <mesh material={materials.quantumCore} position={[0, 0, 0.02]}>
            <boxGeometry args={[0.24, 0.02, 0.01]} />
          </mesh>
          {/* Dual Precision Targeting Sensor Pods */}
          <mesh material={materials.goldAccents} position={[-0.11, 0.02, 0.035]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          <mesh material={materials.goldAccents} position={[0.11, 0.02, 0.035]}>
            <cylinderGeometry args={[0.015, 0.015, 0.02, 12]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
        </group>

        {/* Articulated Titanium Jaw & Audio Intake Vents */}
        <group position={[0, -0.08, 0.12]}>
          <mesh material={materials.primaryArmor} castShadow>
            <boxGeometry args={[0.22, 0.09, 0.14]} />
          </mesh>
          {/* Hexagonal Audio Intake Grille */}
          <mesh material={materials.darkJoints} position={[0, -0.01, 0.075]}>
            <boxGeometry args={[0.12, 0.035, 0.01]} />
          </mesh>
          <mesh material={materials.energyRing} position={[0, -0.01, 0.08]}>
            <boxGeometry args={[0.09, 0.01, 0.005]} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* 2. CERVICAL CYBER-SPINE & EXPOSED HYDRAULICS                 */}
      {/* ============================================================ */}
      <group position={[0, 0.59, 0]}>
        {/* Central Spinal Column */}
        <mesh material={materials.darkJoints}>
          <cylinderGeometry args={[0.075, 0.09, 0.16, 16]} />
        </mesh>
        {/* Quad Polished Chrome Hydraulic Pistons */}
        <mesh material={materials.chromeHydraulics} position={[-0.07, 0, 0.045]} rotation={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.15, 12]} />
        </mesh>
        <mesh material={materials.chromeHydraulics} position={[0.07, 0, 0.045]} rotation={[0.12, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.15, 12]} />
        </mesh>
        <mesh material={materials.chromeHydraulics} position={[-0.06, 0, -0.05]} rotation={[-0.12, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.15, 12]} />
        </mesh>
        <mesh material={materials.chromeHydraulics} position={[0.06, 0, -0.05]} rotation={[-0.12, 0, 0]}>
          <cylinderGeometry args={[0.016, 0.016, 0.15, 12]} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 3. TORSO CHASSIS & LUMEN VOLUMETRIC QUANTUM ARC CORE         */}
      {/* ============================================================ */}
      <group position={[0, 0.28, 0]}>
        {/* Heavy Ballistic Chest Chassis */}
        <mesh material={materials.primaryArmor} position={[0, 0.12, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.58, 0.36, 0.34]} />
        </mesh>

        {/* Angular Pectoral Composite Armor Plates (Left & Right) */}
        <mesh material={materials.secondaryArmor} position={[-0.15, 0.16, 0.16]} rotation={[0, 0.12, 0]} castShadow>
          <boxGeometry args={[0.22, 0.22, 0.08]} />
        </mesh>
        <mesh material={materials.secondaryArmor} position={[0.15, 0.16, 0.16]} rotation={[0, -0.12, 0]} castShadow>
          <boxGeometry args={[0.22, 0.22, 0.08]} />
        </mesh>

        {/* Clavicle Reinforcement Brackets with Gold Fasteners */}
        <mesh material={materials.goldAccents} position={[-0.18, 0.27, 0.14]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.14, 0.025, 0.06]} />
        </mesh>
        <mesh material={materials.goldAccents} position={[0.18, 0.27, 0.14]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.14, 0.025, 0.06]} />
        </mesh>

        {/* Central Recessed Lumen Quantum Arc Reactor */}
        <group position={[0, 0.14, 0.18]}>
          {/* Heavy Titanium Containment Well */}
          <mesh material={materials.secondaryArmor}>
            <cylinderGeometry args={[0.09, 0.09, 0.05, 32]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          <mesh material={materials.chromeHydraulics} position={[0, 0, 0.01]}>
            <torusGeometry args={[0.075, 0.01, 16, 32]} />
          </mesh>
          {/* Counter-Rotating Gyro Stabilizer Gimbal */}
          <mesh ref={gyroRingRef} material={materials.energyRing}>
            <torusGeometry args={[0.06, 0.006, 16, 32]} />
          </mesh>
          {/* Inner Glowing Quantum Arc Core */}
          <group ref={coreOuterRef}>
            <mesh ref={coreInnerRef} material={materials.quantumCore}>
              <octahedronGeometry args={[0.045, 0]} />
            </mesh>
          </group>
          {/* Concentric Energy Ionization Ring */}
          <mesh material={materials.energyRing} position={[0, 0, 0.02]}>
            <ringGeometry args={[0.068, 0.082, 32]} />
          </mesh>
        </group>

        {/* Flank Cooling Heat Sinks with Emissive Coils */}
        <mesh material={materials.darkJoints} position={[-0.26, 0.1, 0.06]} rotation={[0, 0, 0.1]}>
          <boxGeometry args={[0.06, 0.2, 0.18]} />
        </mesh>
        <mesh material={materials.energyRing} position={[-0.29, 0.1, 0.06]}>
          <boxGeometry args={[0.01, 0.14, 0.14]} />
        </mesh>
        <mesh material={materials.darkJoints} position={[0.26, 0.1, 0.06]} rotation={[0, 0, -0.1]}>
          <boxGeometry args={[0.06, 0.2, 0.18]} />
        </mesh>
        <mesh material={materials.energyRing} position={[0.29, 0.1, 0.06]}>
          <boxGeometry args={[0.01, 0.14, 0.14]} />
        </mesh>

        {/* Articulated Abdominal Cyber Core & Spinal Vertebrae */}
        <group position={[0, -0.14, 0]}>
          <mesh material={materials.darkJoints} castShadow>
            <cylinderGeometry args={[0.18, 0.23, 0.22, 24]} />
          </mesh>
          {/* Segmented Abdominal Armor Plates */}
          <mesh material={materials.secondaryArmor} position={[0, 0.03, 0.11]} castShadow>
            <boxGeometry args={[0.18, 0.06, 0.06]} />
          </mesh>
          <mesh material={materials.secondaryArmor} position={[0, -0.05, 0.12]} castShadow>
            <boxGeometry args={[0.2, 0.06, 0.06]} />
          </mesh>
          {/* Dual Chrome Hydraulic Pistons on Abdomen */}
          <mesh material={materials.chromeHydraulics} position={[-0.13, 0, 0.08]} rotation={[0, 0, -0.15]}>
            <cylinderGeometry args={[0.014, 0.014, 0.18, 12]} />
          </mesh>
          <mesh material={materials.chromeHydraulics} position={[0.13, 0, 0.08]} rotation={[0, 0, 0.15]}>
            <cylinderGeometry args={[0.014, 0.014, 0.18, 12]} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* 4. HEAVY DUAL-TIER SHOULDER PAULDRONS & ARMS                 */}
      {/* ============================================================ */}
      {/* Left Arm Assembly */}
      <group ref={leftArmRef} position={[-0.41, 0.42, 0]}>
        {/* Tier 1 Primary Heavy Pauldron */}
        <mesh material={materials.primaryArmor} position={[-0.04, 0.04, 0]} castShadow>
          <sphereGeometry args={[0.15, 20, 20]} />
        </mesh>
        {/* Tier 2 Ballistic Deflector Shield */}
        <mesh material={materials.secondaryArmor} position={[-0.08, 0.06, 0]} rotation={[0, 0, 0.35]} castShadow>
          <boxGeometry args={[0.06, 0.18, 0.2]} />
        </mesh>
        {/* Emissive Tactical Status Light Strip */}
        <mesh material={materials.energyRing} position={[-0.09, 0.06, 0.08]}>
          <boxGeometry args={[0.01, 0.12, 0.02]} />
        </mesh>

        {/* Upper Arm Chassis */}
        <mesh material={materials.primaryArmor} position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.068, 0.058, 0.22, 20]} />
        </mesh>
        <mesh material={materials.chromeHydraulics} position={[-0.04, -0.18, 0.02]}>
          <cylinderGeometry args={[0.012, 0.012, 0.2, 10]} />
        </mesh>

        {/* Articulated Elbow Servo Joint */}
        <mesh material={materials.darkJoints} position={[0, -0.31, 0]}>
          <sphereGeometry args={[0.062, 16, 16]} />
        </mesh>
        <mesh material={materials.goldAccents} position={[0, -0.31, 0.04]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 12]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>

        {/* Forearm Chassis & Tactical Pulse Cuff */}
        <mesh material={materials.secondaryArmor} position={[0, -0.44, 0.02]} castShadow>
          <boxGeometry args={[0.11, 0.2, 0.12]} />
        </mesh>
        <mesh material={materials.energyRing} position={[0, -0.44, 0.085]}>
          <boxGeometry args={[0.07, 0.12, 0.01]} />
        </mesh>
      </group>

      {/* Right Arm Assembly */}
      <group ref={rightArmRef} position={[0.41, 0.42, 0]}>
        {/* Tier 1 Primary Heavy Pauldron */}
        <mesh material={materials.primaryArmor} position={[0.04, 0.04, 0]} castShadow>
          <sphereGeometry args={[0.15, 20, 20]} />
        </mesh>
        {/* Tier 2 Ballistic Deflector Shield */}
        <mesh material={materials.secondaryArmor} position={[0.08, 0.06, 0]} rotation={[0, 0, -0.35]} castShadow>
          <boxGeometry args={[0.06, 0.18, 0.2]} />
        </mesh>
        {/* Emissive Tactical Status Light Strip */}
        <mesh material={materials.energyRing} position={[0.09, 0.06, 0.08]}>
          <boxGeometry args={[0.01, 0.12, 0.02]} />
        </mesh>

        {/* Upper Arm Chassis */}
        <mesh material={materials.primaryArmor} position={[0, -0.18, 0]} castShadow>
          <cylinderGeometry args={[0.068, 0.058, 0.22, 20]} />
        </mesh>
        <mesh material={materials.chromeHydraulics} position={[0.04, -0.18, 0.02]}>
          <cylinderGeometry args={[0.012, 0.012, 0.2, 10]} />
        </mesh>

        {/* Articulated Elbow Servo Joint */}
        <mesh material={materials.darkJoints} position={[0, -0.31, 0]}>
          <sphereGeometry args={[0.062, 16, 16]} />
        </mesh>
        <mesh material={materials.goldAccents} position={[0, -0.31, 0.04]}>
          <cylinderGeometry args={[0.02, 0.02, 0.02, 12]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>

        {/* Forearm Chassis & Tactical Pulse Cuff */}
        <mesh material={materials.secondaryArmor} position={[0, -0.44, 0.02]} castShadow>
          <boxGeometry args={[0.11, 0.2, 0.12]} />
        </mesh>
        <mesh material={materials.energyRing} position={[0, -0.44, 0.085]}>
          <boxGeometry args={[0.07, 0.12, 0.01]} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 5. BACK-MOUNTED MICRO-FUSION THRUSTERS                      */}
      {/* ============================================================ */}
      <group position={[0, 0.38, -0.19]}>
        {/* Left Thruster Pod */}
        <group position={[-0.14, 0, 0]}>
          <mesh material={materials.secondaryArmor} castShadow>
            <cylinderGeometry args={[0.045, 0.055, 0.24, 16]} rotation={[0.2, 0, 0]} />
          </mesh>
          <mesh ref={leftThrusterRef} material={materials.plasmaExhaust} position={[0, -0.14, -0.03]}>
            <coneGeometry args={[0.035, 0.1, 16]} rotation={[Math.PI - 0.2, 0, 0]} />
          </mesh>
        </group>
        {/* Right Thruster Pod */}
        <group position={[0.14, 0, 0]}>
          <mesh material={materials.secondaryArmor} castShadow>
            <cylinderGeometry args={[0.045, 0.055, 0.24, 16]} rotation={[0.2, 0, 0]} />
          </mesh>
          <mesh ref={rightThrusterRef} material={materials.plasmaExhaust} position={[0, -0.14, -0.03]}>
            <coneGeometry args={[0.035, 0.1, 16]} rotation={[Math.PI - 0.2, 0, 0]} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* 6. ORBITAL HOLOGRAM DATA HALOS & IONIZATION PARTICLES       */}
      {/* ============================================================ */}
      <group ref={haloRef} position={[0, 0.45, 0]}>
        <mesh material={materials.energyRing} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.55, 0.008, 16, 64]} />
        </mesh>
        <mesh material={materials.energyRing} rotation={[Math.PI / 2.3, 0, 0]}>
          <torusGeometry args={[0.42, 0.006, 16, 48]} />
        </mesh>
      </group>

      <mesh ref={ringRef} position={[0, 0.35, 0]}>
        <torusGeometry args={[0.78, 0.012, 16, 64]} />
        <meshBasicMaterial
          color={palette.glow}
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <Sparkles
        count={36}
        scale={[2.4, 2.4, 2.4]}
        size={2.6}
        speed={0.45}
        color={palette.glow}
        position={[0, 0.4, 0]}
        opacity={0.65}
      />
    </group>
  );
}

export default NftMecha3D;
