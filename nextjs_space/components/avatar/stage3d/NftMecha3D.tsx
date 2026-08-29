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
 * 4D UNREAL ENGINE 5.5 LUMEN & NANITE CYBERNETIC SENTINEL
 * Powered by 4D Hyper-Dimensional Tesseract geometry, real-time temporal dispersion,
 * iridescence physical clearcoat shaders, and gyroscopic Quantum Flux Core.
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
  const gyroRing3Ref = useRef<THREE.Mesh>(null);
  const tesseractGroupRef = useRef<THREE.Group>(null);
  const tesseractInnerRef = useRef<THREE.Mesh>(null);
  const tesseractOuterRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Group>(null);
  const leftDroneWingRef = useRef<THREE.Group>(null);
  const rightDroneWingRef = useRef<THREE.Group>(null);
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const spineConduitRef = useRef<THREE.Group>(null);
  const chronoRingRef = useRef<THREE.Mesh>(null);

  // Unreal Engine 5.5 High-Dynamic-Range PBR Color Profiles
  const palette = useMemo(() => {
    const key = (avatarId || 'cyber_humanoid').toLowerCase();
    if (key.includes('quantum') || key.includes('omega') || key.includes('unit-o')) {
      return {
        armorPrimary: '#F8FAFC',
        armorSecondary: '#1E1B4B',
        chrome: '#FFFFFF',
        accent: '#C084FC',
        glow: '#E879F9',
        eyeColor: '#38BDF8',
        iridescence: '#A855F7',
        metalness: 0.96,
        roughness: 0.05,
      };
    }
    if (key.includes('titan') || key.includes('midas') || key.includes('wall_street')) {
      return {
        armorPrimary: '#1E293B',
        armorSecondary: '#FACC15',
        chrome: '#FEF08A',
        accent: '#FDE047',
        glow: '#F59E0B',
        eyeColor: '#FEF08A',
        iridescence: '#EAB308',
        metalness: 0.98,
        roughness: 0.04,
      };
    }
    if (key.includes('cosmic') || key.includes('veil') || key.includes('nyx')) {
      return {
        armorPrimary: '#1E1B4B',
        armorSecondary: '#7C3AED',
        chrome: '#E9D5FF',
        accent: '#06B6D4',
        glow: '#F43F5E',
        eyeColor: '#38BDF8',
        iridescence: '#EC4899',
        metalness: 0.94,
        roughness: 0.06,
      };
    }
    if (key.includes('shadow') || key.includes('viper')) {
      return {
        armorPrimary: '#18181B',
        armorSecondary: '#991B1B',
        chrome: '#E2E8F0',
        accent: '#EF4444',
        glow: '#FF0055',
        eyeColor: '#FF0055',
        iridescence: '#DC2626',
        metalness: 0.92,
        roughness: 0.08,
      };
    }
    if (key.includes('predator') || key.includes('apex')) {
      return {
        armorPrimary: '#1E293B',
        armorSecondary: '#EA580C',
        chrome: '#FFFFFF',
        accent: '#F97316',
        glow: '#FB923C',
        eyeColor: '#38BDF8',
        iridescence: '#F97316',
        metalness: 0.95,
        roughness: 0.06,
      };
    }
    // Default: Genesis 4D Cyber Sentinel (Cyan Plasma & Liquid Mirror Chrome)
    return {
      armorPrimary: '#1E293B',
      armorSecondary: '#00F0FF',
      chrome: '#FFFFFF',
      accent: '#38BDF8',
      glow: '#00FFFF',
      eyeColor: '#00FFFF',
      iridescence: '#00E5FF',
      metalness: 0.96,
      roughness: 0.04,
    };
  }, [avatarId]);

  // Unreal Engine 5.5 Physical Nanite & Lumen Shaders
  const materials = useMemo(() => {
    return {
      // 1. Nanite High-Gloss Primary Clearcoat Armor with 4D Iridescence
      primaryArmor: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(palette.armorPrimary),
        metalness: palette.metalness,
        roughness: palette.roughness,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        iridescence: 0.85,
        iridescenceIOR: 1.6,
        iridescenceThicknessRange: [100, 400],
        reflectivity: 1.0,
        envMapIntensity: 4.0,
      }),
      // 2. Secondary Carbon Fiber Nanite Plates with Edge Luminance
      secondaryArmor: new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(palette.armorSecondary),
        emissive: new THREE.Color(palette.glow),
        emissiveIntensity: 0.6,
        metalness: 0.92,
        roughness: 0.08,
        clearcoat: 0.9,
        clearcoatRoughness: 0.05,
        iridescence: 1.0,
        iridescenceIOR: 1.8,
        envMapIntensity: 3.5,
      }),
      // 3. Mirror-Polished Liquid Titanium Chrome
      liquidChrome: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.chrome),
        metalness: 1.0,
        roughness: 0.01,
        envMapIntensity: 5.0,
      }),
      // 4. Dark Titanium Joint Actuators
      darkSubframe: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#060911'),
        metalness: 0.85,
        roughness: 0.15,
      }),
      // 5. High-Gloss Metallic Accent Trims
      accentTrim: new THREE.MeshStandardMaterial({
        color: new THREE.Color(palette.accent),
        metalness: 0.98,
        roughness: 0.05,
        envMapIntensity: 4.0,
      }),
      // 6. Hyper-Luminous 4D Optical Eye Sensors
      opticalLens: new THREE.MeshStandardMaterial({
        color: new THREE.Color('#FFFFFF'),
        emissive: new THREE.Color(palette.eyeColor),
        emissiveIntensity: 5.0,
        roughness: 0.0,
        metalness: 0.1,
      }),
      // 7. Emissive Eye Corona (Additive Blending)
      eyeCorona: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
        transparent: true,
        opacity: isSpeaking ? 0.98 : 0.85,
        blending: THREE.AdditiveBlending,
      }),
      // 8. 4D Quantum Flux Core Plasma
      plasmaCore: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
      }),
      // 9. Floating 4D Holographic Photon Wings & Tesseract (Ultra-Bright Additive)
      holographicBlades: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.glow),
        transparent: true,
        opacity: 0.95,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
      // 10. 4D Tesseract Wireframe Matrix
      tesseractWire: new THREE.MeshBasicMaterial({
        color: new THREE.Color(palette.iridescence),
        wireframe: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      }),
    };
  }, [palette, isSpeaking]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const ptrX = state.pointer.x;
    const ptrY = state.pointer.y;

    // 1. Natural Organic Hovering & 4D Phase Shift
    if (rootRef.current) {
      rootRef.current.position.y = Math.sin(t * 1.8) * 0.025 - 0.12;
    }

    // 2. Interactive Head & Eye Tracking
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
      const eyePulse = (1 + Math.sin(t * 4) * 0.2) * blink;
      eyeGlowLeftRef.current.scale.set(eyePulse, eyePulse, 1);
      eyeGlowRightRef.current.scale.set(eyePulse, eyePulse, 1);
    }

    // 4. Arc Reactor Concentric Gyro Rotation
    if (gyroRing1Ref.current) {
      gyroRing1Ref.current.rotation.x = t * 2.8;
      gyroRing1Ref.current.rotation.y = -t * 1.8;
    }
    if (gyroRing2Ref.current) {
      gyroRing2Ref.current.rotation.y = t * 3.2;
      gyroRing2Ref.current.rotation.z = -t * 2.1;
    }
    if (gyroRing3Ref.current) {
      gyroRing3Ref.current.rotation.z = t * 3.6;
      gyroRing3Ref.current.rotation.x = -t * 2.4;
    }
    if (reactorCoreRef.current) {
      const corePulse = 1 + Math.sin(t * 6) * 0.18;
      reactorCoreRef.current.scale.set(corePulse, corePulse, corePulse);
    }

    // 5. 4D Tesseract Hypercube Temporal Transformation (W-axis math projection)
    if (tesseractGroupRef.current) {
      tesseractGroupRef.current.rotation.x = t * 0.8;
      tesseractGroupRef.current.rotation.y = t * 1.2;
      tesseractGroupRef.current.rotation.z = t * 0.6;
    }
    if (tesseractInnerRef.current && tesseractOuterRef.current) {
      // 4D projection scaling oscillation (inverting inside-out)
      const wPhase = Math.sin(t * 1.5);
      const innerS = 0.08 + wPhase * 0.03;
      const outerS = 0.14 - wPhase * 0.03;
      tesseractInnerRef.current.scale.set(innerS, innerS, innerS);
      tesseractOuterRef.current.scale.set(outerS, outerS, outerS);
      tesseractInnerRef.current.rotation.y = -t * 2.0;
    }

    // 6. Chrono Orbit Ring
    if (chronoRingRef.current) {
      chronoRingRef.current.rotation.z = -t * 1.5;
      chronoRingRef.current.rotation.x = Math.PI / 3 + Math.sin(t * 2) * 0.15;
    }

    // 7. Floating Drone Wings
    if (leftDroneWingRef.current && rightDroneWingRef.current) {
      const flap = Math.sin(t * 2.4) * 0.08;
      leftDroneWingRef.current.position.y = 0.38 + Math.sin(t * 2.4 + 0.5) * 0.025;
      leftDroneWingRef.current.rotation.z = 0.22 + flap;
      rightDroneWingRef.current.position.y = 0.38 + Math.sin(t * 2.4 + 0.5) * 0.025;
      rightDroneWingRef.current.rotation.z = -0.22 - flap;
    }

    // 8. Floating Holographic Halo Orbit
    if (haloRef.current) {
      haloRef.current.rotation.z = t * 0.5;
      haloRef.current.rotation.x = Math.PI / 4 + Math.sin(t * 0.7) * 0.08;
    }

    // 9. Arm Sway
    if (leftArmRef.current && rightArmRef.current) {
      leftArmRef.current.rotation.x = Math.sin(t * 1.8) * 0.04;
      rightArmRef.current.rotation.x = -Math.sin(t * 1.8) * 0.04;
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.12, 0]} scale={0.96}>
      {/* ============================================================ */}
      {/* 1. SCULPTED 4D CYBERNETIC ANDROID HEAD & GLOWING OPTICS      */}
      {/* ============================================================ */}
      <group ref={headRef} position={[0, 0.68, 0]}>
        {/* Sleek Biomechanical Cranium Shell (Lumen Clearcoat & Iridescence) */}
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

        {/* Forehead Holographic 4D Laser Matrix */}
        <mesh material={materials.holographicBlades} position={[0, 0.14, 0.16]}>
          <cylinderGeometry args={[0.016, 0.016, 0.01, 16]} rotation={[Math.PI / 2, 0, 0]} />
        </mesh>

        {/* Sleek Carbon Crest & Blade Antennae */}
        <mesh material={materials.accentTrim} position={[0, 0.22, -0.04]} rotation={[-0.25, 0, 0]} castShadow>
          <coneGeometry args={[0.035, 0.26, 16]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[0, 0.23, -0.04]} rotation={[-0.25, 0, 0]}>
          <coneGeometry args={[0.018, 0.28, 8]} />
        </mesh>

        {/* Swept Ear Sensor Fins (Left & Right) with Neon Edge Strips */}
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

        {/* DUAL HYPER-LUMINOUS GLOWING OPTICAL EYE LENSES */}
        <group position={[0, 0.02, 0.16]}>
          {/* Left Cyber Optical Eye */}
          <group position={[-0.065, 0, 0]}>
            <mesh material={materials.liquidChrome}>
              <torusGeometry args={[0.034, 0.008, 16, 24]} />
            </mesh>
            <mesh material={materials.darkSubframe} position={[0, 0, -0.005]}>
              <circleGeometry args={[0.03, 24]} />
            </mesh>
            <mesh ref={leftEyeRef} material={materials.opticalLens} position={[0, 0, 0.002]}>
              <circleGeometry args={[0.02, 24]} />
            </mesh>
            <mesh ref={eyeGlowLeftRef} material={materials.eyeCorona} position={[0, 0, 0.004]}>
              <circleGeometry args={[0.044, 24]} />
            </mesh>
          </group>

          {/* Right Cyber Optical Eye */}
          <group position={[0.065, 0, 0]}>
            <mesh material={materials.liquidChrome}>
              <torusGeometry args={[0.034, 0.008, 16, 24]} />
            </mesh>
            <mesh material={materials.darkSubframe} position={[0, 0, -0.005]}>
              <circleGeometry args={[0.03, 24]} />
            </mesh>
            <mesh ref={rightEyeRef} material={materials.opticalLens} position={[0, 0, 0.002]}>
              <circleGeometry args={[0.02, 24]} />
            </mesh>
            <mesh ref={eyeGlowRightRef} material={materials.eyeCorona} position={[0, 0, 0.004]}>
              <circleGeometry args={[0.044, 24]} />
            </mesh>
          </group>
        </group>

        {/* Articulated Cybernetic Jaw & Audio Intake Vents */}
        <group position={[0, -0.08, 0.09]}>
          <mesh material={materials.primaryArmor} castShadow>
            <capsuleGeometry args={[0.065, 0.09, 16, 16]} />
          </mesh>
          <mesh material={materials.plasmaCore} position={[0, -0.02, 0.075]}>
            <cylinderGeometry args={[0.035, 0.035, 0.01, 6]} rotation={[Math.PI / 2, 0, 0]} />
          </mesh>
          <mesh material={materials.liquidChrome} position={[-0.07, -0.05, -0.02]}>
            <cylinderGeometry args={[0.016, 0.016, 0.12, 16]} />
          </mesh>
          <mesh material={materials.liquidChrome} position={[0.07, -0.05, -0.02]}>
            <cylinderGeometry args={[0.016, 0.016, 0.12, 16]} />
          </mesh>
        </group>
      </group>

      {/* ============================================================ */}
      {/* 2. SCULPTED BIOMECHANICAL TORSO & 4D TESSERACT ARC REACTOR   */}
      {/* ============================================================ */}
      <group ref={chestRef} position={[0, 0.26, 0]}>
        {/* Aerodynamic Carbon Torso Core */}
        <mesh material={materials.primaryArmor} position={[0, 0.02, -0.02]} castShadow receiveShadow>
          <cylinderGeometry args={[0.24, 0.16, 0.38, 32]} />
        </mesh>

        {/* Sculpted Curved Pectoral Muscle Plates with Neon Trim */}
        <mesh material={materials.secondaryArmor} position={[-0.11, 0.12, 0.11]} rotation={[0.12, -0.18, -0.08]} castShadow>
          <capsuleGeometry args={[0.065, 0.13, 16, 16]} />
        </mesh>
        <mesh material={materials.secondaryArmor} position={[0.11, 0.12, 0.11]} rotation={[0.12, 0.18, 0.08]} castShadow>
          <capsuleGeometry args={[0.065, 0.13, 16, 16]} />
        </mesh>

        {/* Clavicle Power Conduits (Liquid Chrome & Neon) */}
        <mesh material={materials.liquidChrome} position={[-0.13, 0.22, 0.04]} rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.018, 0.018, 0.18, 16]} />
        </mesh>
        <mesh material={materials.liquidChrome} position={[0.13, 0.22, 0.04]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.018, 0.018, 0.18, 16]} />
        </mesh>

        {/* CENTRAL 4D QUANTUM TESSERACT ARC REACTOR CORE */}
        <group position={[0, 0.05, 0.14]}>
          {/* Beveled Liquid Chrome Housing */}
          <mesh material={materials.liquidChrome} castShadow>
            <torusGeometry args={[0.098, 0.02, 16, 32]} />
          </mesh>

          {/* Tri-Axis Gyroscopic Spinning Rings */}
          <mesh ref={gyroRing1Ref} material={materials.holographicBlades}>
            <torusGeometry args={[0.078, 0.008, 16, 24]} />
          </mesh>
          <mesh ref={gyroRing2Ref} material={materials.holographicBlades}>
            <torusGeometry args={[0.058, 0.006, 16, 24]} />
          </mesh>
          <mesh ref={gyroRing3Ref} material={materials.holographicBlades}>
            <torusGeometry args={[0.038, 0.004, 16, 24]} />
          </mesh>

          {/* 4D Tesseract Hypercube Projection */}
          <group ref={tesseractGroupRef}>
            <mesh ref={tesseractOuterRef} material={materials.tesseractWire}>
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
            <mesh ref={tesseractInnerRef} material={materials.tesseractWire}>
              <boxGeometry args={[1, 1, 1]} />
            </mesh>
          </group>

          {/* Inner Pulsing Plasma Crystal */}
          <mesh ref={reactorCoreRef} material={materials.plasmaCore}>
            <dodecahedronGeometry args={[0.038, 1]} />
          </mesh>
          {/* Volumetric Core Flare */}
          <mesh material={materials.holographicBlades}>
            <sphereGeometry args={[0.055, 16, 16]} />
          </mesh>
        </group>

        {/* Exposed Spinal Hydraulic Vertebrae with Glowing Neural Nodes */}
        <group ref={spineConduitRef} position={[0, 0.02, -0.15]}>
          {[-0.1, -0.03, 0.04, 0.11].map((y, idx) => (
            <group key={idx} position={[0, y, 0]}>
              <mesh material={materials.liquidChrome}>
                <cylinderGeometry args={[0.035, 0.035, 0.045, 16]} rotation={[Math.PI / 2, 0, 0]} />
              </mesh>
              <mesh material={materials.plasmaCore} position={[0, 0, -0.018]}>
                <sphereGeometry args={[0.012, 12, 12]} />
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
        <mesh material={materials.holographicBlades} position={[-0.045, -0.38, 0]}>
          <boxGeometry args={[0.01, 0.16, 0.01]} />
        </mesh>

        {/* Articulated Cyber Hand & Plasma Fingers */}
        <mesh material={materials.liquidChrome} position={[0, -0.52, 0.02]}>
          <sphereGeometry args={[0.03, 16, 16]} />
        </mesh>
      </group>

      {/* Right Arm & Pauldron */}
      <group ref={rightArmRef} position={[0.31, 0.38, 0]}>
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
        <mesh material={materials.holographicBlades} position={[0.045, -0.38, 0]}>
          <boxGeometry args={[0.01, 0.16, 0.01]} />
        </mesh>

        {/* Articulated Cyber Hand & Plasma Fingers */}
        <mesh material={materials.liquidChrome} position={[0, -0.52, 0.02]}>
          <sphereGeometry args={[0.03, 16, 16]} />
        </mesh>
      </group>

      {/* ============================================================ */}
      {/* 4. FLOATING PHOTONIC DRONE WINGS & 4D CHRONO HALO           */}
      {/* ============================================================ */}
      {/* Left Drone Wing */}
      <group ref={leftDroneWingRef} position={[-0.26, 0.38, -0.15]}>
        <mesh material={materials.secondaryArmor} rotation={[0, 0, -0.55]} castShadow>
          <coneGeometry args={[0.038, 0.48, 16]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[-0.07, 0.1, 0]} rotation={[0, 0, -0.55]}>
          <coneGeometry args={[0.022, 0.56, 8]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[-0.14, 0.22, 0]} rotation={[0, 0, -0.75]}>
          <coneGeometry args={[0.016, 0.32, 8]} />
        </mesh>
      </group>

      {/* Right Drone Wing */}
      <group ref={rightDroneWingRef} position={[0.26, 0.38, -0.15]}>
        <mesh material={materials.secondaryArmor} rotation={[0, 0, 0.55]} castShadow>
          <coneGeometry args={[0.038, 0.48, 16]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[0.07, 0.1, 0]} rotation={[0, 0, 0.55]}>
          <coneGeometry args={[0.022, 0.56, 8]} />
        </mesh>
        <mesh material={materials.holographicBlades} position={[0.14, 0.22, 0]} rotation={[0, 0, 0.75]}>
          <coneGeometry args={[0.016, 0.32, 8]} />
        </mesh>
      </group>

      {/* 4D Temporal Chrono Ring (Floating Diagonal Matrix) */}
      <mesh ref={chronoRingRef} position={[0, 0.35, 0]} material={materials.tesseractWire}>
        <torusGeometry args={[0.48, 0.006, 16, 64]} />
      </mesh>

      {/* Celestial Holographic Data Halo (Floating Overhead) */}
      <group ref={haloRef} position={[0, 0.9, -0.1]}>
        <mesh material={materials.holographicBlades}>
          <torusGeometry args={[0.3, 0.009, 16, 48]} />
        </mesh>
        {[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].map((angle, idx) => (
          <mesh
            key={idx}
            material={materials.plasmaCore}
            position={[Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, 0]}
          >
            <sphereGeometry args={[0.016, 12, 12]} />
          </mesh>
        ))}
      </group>

      {/* ============================================================ */}
      {/* 5. TAPERED WAIST & ANTI-GRAVITY REPULSOR CORE               */}
      {/* ============================================================ */}
      <group position={[0, -0.04, 0]}>
        <mesh material={materials.primaryArmor} castShadow>
          <cylinderGeometry args={[0.14, 0.07, 0.18, 32]} />
        </mesh>
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

      {/* 4D Temporal Particle Sparks (High Density) */}
      <Sparkles
        count={50}
        scale={2.6}
        size={3.0}
        speed={0.8}
        color={palette.glow}
        opacity={0.9}
      />
    </group>
  );
}

export default NftMecha3D;
