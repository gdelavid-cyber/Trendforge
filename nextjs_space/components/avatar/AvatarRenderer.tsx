'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AvatarConfigState, AvatarEmotion, AvatarPose } from '@/hooks/useAvatar';

export interface AvatarRendererProps {
  config: AvatarConfigState;
  emotion?: AvatarEmotion;
  pose?: AvatarPose;
  currentViseme?: {
    amplitude: number;
    mouthOpen: number;
    mouthWide: number;
    mouthRound: number;
  };
  isSpeaking?: boolean;
  isListening?: boolean;
  isThinking?: boolean;
  cameraDistance?: number;
  rotationSpeed?: number;
  wireframe?: boolean;
  interactive?: boolean;
  className?: string;
}

export function AvatarRenderer({
  config,
  emotion = 'confident',
  pose = 'idle',
  currentViseme = { amplitude: 0, mouthOpen: 0, mouthWide: 0, mouthRound: 0 },
  isSpeaking = false,
  isListening = false,
  isThinking = false,
  cameraDistance = 3.5,
  rotationSpeed = 0,
  wireframe = false,
  interactive = true,
  className = '',
}: AvatarRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameId = useRef<number | null>(null);

  // Mesh and node references for live morphing
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headMeshRef = useRef<THREE.Mesh | null>(null);
  const jawMeshRef = useRef<THREE.Mesh | null>(null);
  const leftEyeRef = useRef<THREE.Mesh | null>(null);
  const rightEyeRef = useRef<THREE.Mesh | null>(null);
  const visorMeshRef = useRef<THREE.Mesh | null>(null);
  const crownGroupRef = useRef<THREE.Group | null>(null);
  const orbitalRingsRef = useRef<THREE.Group | null>(null);
  const particleSystemRef = useRef<THREE.Points | null>(null);
  const haloLightRef = useRef<THREE.PointLight | null>(null);

  // Mouse interaction state
  const mousePos = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const userRotation = useRef({ x: 0, y: 0 });

  // Clock
  const clock = useRef(new THREE.Clock());

  // Setup Colors based on skin & aura config
  const getThemeColors = () => {
    let primary = 0x00f0ff; // Cyan
    let accent = 0xf5a623;  // Gold
    let emissive = 0x00f0ff;

    if (config.baseModel === 'WALL_STREET_TITAN') {
      primary = 0xf5a623;
      accent = 0xffffff;
      emissive = 0xffd700;
    } else if (config.baseModel === 'QUANTUM_ANDROID') {
      primary = 0x00f0ff;
      accent = 0xa855f7;
      emissive = 0x00f0ff;
    } else if (config.baseModel === 'COSMIC_ENTITY') {
      primary = 0xc084fc;
      accent = 0xf5a623;
      emissive = 0x9333ea;
    }

    if (config.aura.includes('Fire')) {
      emissive = 0xff007a;
    } else if (config.aura.includes('Matrix')) {
      emissive = 0x00ff66;
    } else if (config.aura.includes('Gold') || config.aura.includes('Sparkles')) {
      emissive = 0xffd700;
    }

    return { primary, accent, emissive };
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 300;
    const height = containerRef.current.clientHeight || 300;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0.15, cameraDistance);
    cameraRef.current = camera;

    // 3. Renderer with alpha and antialias
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(2, 4, 3);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x00f0ff, 1.5);
    dirLight2.position.set(-3, -2, -2);
    scene.add(dirLight2);

    const pointLight = new THREE.PointLight(0x00f0ff, 2, 8);
    pointLight.position.set(0, 1.2, 1.5);
    scene.add(pointLight);
    haloLightRef.current = pointLight;

    // 5. Build 3D Avatar Character Rig
    buildAvatarRig(scene);

    // 6. Window Resize Handler
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // 7. Mouse Orbit Listeners
    const onMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mousePos.current.targetX = x * 0.25;
      mousePos.current.targetY = y * 0.2;

      if (isDragging.current) {
        const deltaX = e.clientX - previousMousePosition.current.x;
        const deltaY = e.clientY - previousMousePosition.current.y;
        userRotation.current.y += deltaX * 0.008;
        userRotation.current.x += deltaY * 0.005;
        userRotation.current.x = Math.max(-0.4, Math.min(0.4, userRotation.current.x));
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const dom = containerRef.current;
    if (interactive && dom) {
      dom.addEventListener('mousedown', onMouseDown);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    // 8. Animation Loop
    const animate = () => {
      animFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = clock.current.getElapsedTime();

      // Smooth mouse follow
      mousePos.current.x += (mousePos.current.targetX - mousePos.current.x) * 0.05;
      mousePos.current.y += (mousePos.current.targetY - mousePos.current.y) * 0.05;

      // Base Levitation & Breathing Floating Motion
      if (avatarGroupRef.current) {
        const levitationY = Math.sin(elapsedTime * 2.0) * 0.04;
        const breathingScale = 1.0 + Math.sin(elapsedTime * 3.0) * 0.01;
        
        avatarGroupRef.current.position.y = levitationY;
        avatarGroupRef.current.scale.set(breathingScale, breathingScale, breathingScale);

        // Rotation from user drag + subtle idle sweep
        const autoRot = rotationSpeed ? elapsedTime * rotationSpeed : 0;
        avatarGroupRef.current.rotation.y = userRotation.current.y + mousePos.current.x + autoRot;
        avatarGroupRef.current.rotation.x = userRotation.current.x - mousePos.current.y * 0.5;
      }

      // Live Lip-Sync Morphing: Jaw and Mouth Movements
      if (jawMeshRef.current) {
        // Target mouth opening driven by currentViseme or speaking amplitude
        const mouthOpenTarget = currentViseme?.mouthOpen || (isSpeaking ? (Math.sin(elapsedTime * 20) * 0.5 + 0.5) * 0.8 : 0);
        jawMeshRef.current.position.y = -0.22 - mouthOpenTarget * 0.12;
        jawMeshRef.current.scale.x = 1.0 + (currentViseme?.mouthWide || 0) * 0.3;
        jawMeshRef.current.scale.z = 1.0 - (currentViseme?.mouthRound || 0) * 0.2;
      }

      // Emotion Expression Morphing
      applyEmotionMorphs(elapsedTime);

      // Rotating Accessories & Particle Rings
      if (orbitalRingsRef.current) {
        orbitalRingsRef.current.rotation.y = elapsedTime * 0.8;
        orbitalRingsRef.current.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2;
      }

      if (crownGroupRef.current) {
        crownGroupRef.current.position.y = 0.52 + Math.sin(elapsedTime * 3) * 0.03;
        crownGroupRef.current.rotation.y = elapsedTime * 0.5;
      }

      // Particle Aura Swirl
      if (particleSystemRef.current) {
        particleSystemRef.current.rotation.y = -elapsedTime * 0.3;
        const positions = particleSystemRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += Math.sin(elapsedTime * 2 + i) * 0.002;
        }
        particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
      window.removeEventListener('resize', handleResize);
      if (interactive && dom) {
        dom.removeEventListener('mousedown', onMouseDown);
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }
      renderer.dispose();
    };
  }, [config.baseModel, config.skin, config.aura, wireframe, cameraDistance, rotationSpeed]);

  // Builds procedural high-spec 3D Avatar geometry
  const buildAvatarRig = (scene: THREE.Scene) => {
    const { primary, accent, emissive } = getThemeColors();

    const avatarGroup = new THREE.Group();
    avatarGroupRef.current = avatarGroup;
    scene.add(avatarGroup);

    // 1. Head Core Mesh
    const headGeo = new THREE.SphereGeometry(0.35, 32, 32);
    headGeo.scale(0.85, 1.15, 0.95);
    const headMat = new THREE.MeshStandardMaterial({
      color: config.baseModel === 'QUANTUM_ANDROID' ? 0x1a1a24 : 0x111118,
      metalness: 0.85,
      roughness: 0.25,
      wireframe,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 0.1, 0);
    avatarGroup.add(headMesh);
    headMeshRef.current = headMesh;

    // 2. Neck & Shoulders Torso
    const torsoGeo = new THREE.CylinderGeometry(0.2, 0.45, 0.5, 32);
    const torsoMat = new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      metalness: 0.9,
      roughness: 0.3,
      wireframe,
    });
    const torsoMesh = new THREE.Mesh(torsoGeo, torsoMat);
    torsoMesh.position.set(0, -0.38, 0);
    avatarGroup.add(torsoMesh);

    // Collar Armor
    const collarGeo = new THREE.TorusGeometry(0.32, 0.05, 16, 32);
    const collarMat = new THREE.MeshStandardMaterial({
      color: accent,
      metalness: 0.9,
      roughness: 0.1,
      emissive: accent,
      emissiveIntensity: 0.3,
      wireframe,
    });
    const collarMesh = new THREE.Mesh(collarGeo, collarMat);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.set(0, -0.2, 0);
    avatarGroup.add(collarMesh);

    // 3. Dynamic Mouth / Lower Jaw Mesh (for Lip-Sync)
    const jawGeo = new THREE.BoxGeometry(0.2, 0.08, 0.15);
    const jawMat = new THREE.MeshStandardMaterial({
      color: 0x0d0d14,
      metalness: 0.7,
      roughness: 0.3,
      wireframe,
    });
    const jawMesh = new THREE.Mesh(jawGeo, jawMat);
    jawMesh.position.set(0, -0.22, 0.22);
    avatarGroup.add(jawMesh);
    jawMeshRef.current = jawMesh;

    // 4. Glowing Cyber Eyes
    const eyeGeo = new THREE.SphereGeometry(0.045, 16, 16);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: primary,
      emissive: primary,
      emissiveIntensity: 1.8,
      metalness: 0.1,
      roughness: 0.1,
    });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.11, 0.12, 0.28);
    avatarGroup.add(leftEye);
    leftEyeRef.current = leftEye;

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat.clone());
    rightEye.position.set(0.11, 0.12, 0.28);
    avatarGroup.add(rightEye);
    rightEyeRef.current = rightEye;

    // 5. Holographic Tactical Visor
    const visorGeo = new THREE.CylinderGeometry(0.32, 0.32, 0.14, 32, 1, true, -Math.PI / 3, (2 * Math.PI) / 3);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: primary,
      emissive: primary,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.2,
      transmission: 0.6,
      wireframe,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.12, 0.05);
    avatarGroup.add(visorMesh);
    visorMeshRef.current = visorMesh;

    // 6. Archetype Specific 3D Adornments
    if (config.baseModel === 'WALL_STREET_TITAN') {
      // Golden Crown
      const crownGroup = new THREE.Group();
      const crownBaseGeo = new THREE.TorusGeometry(0.24, 0.03, 16, 32);
      const crownMat = new THREE.MeshStandardMaterial({
        color: 0xf5a623,
        emissive: 0xf5a623,
        emissiveIntensity: 0.6,
        metalness: 0.95,
        roughness: 0.15,
        wireframe,
      });
      const crownBase = new THREE.Mesh(crownBaseGeo, crownMat);
      crownBase.rotation.x = Math.PI / 2;
      crownGroup.add(crownBase);

      // Crown Spikes
      for (let i = 0; i < 5; i++) {
        const spikeGeo = new THREE.ConeGeometry(0.04, 0.12, 8);
        const spike = new THREE.Mesh(spikeGeo, crownMat);
        const angle = (i / 5) * Math.PI * 2;
        spike.position.set(Math.cos(angle) * 0.24, 0.06, Math.sin(angle) * 0.24);
        crownGroup.add(spike);
      }
      crownGroup.position.set(0, 0.5, 0);
      avatarGroup.add(crownGroup);
      crownGroupRef.current = crownGroup;
    } else if (config.baseModel === 'COSMIC_ENTITY' || config.baseModel === 'QUANTUM_ANDROID') {
      // Orbiting Quantum/Cosmic Rings
      const ringsGroup = new THREE.Group();
      const ring1Geo = new THREE.TorusGeometry(0.55, 0.015, 16, 64);
      const ring1Mat = new THREE.MeshStandardMaterial({
        color: primary,
        emissive: primary,
        emissiveIntensity: 1.0,
        wireframe,
      });
      const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
      ring1.rotation.x = Math.PI / 3;
      ringsGroup.add(ring1);

      const ring2Geo = new THREE.TorusGeometry(0.65, 0.012, 16, 64);
      const ring2Mat = new THREE.MeshStandardMaterial({
        color: accent,
        emissive: accent,
        emissiveIntensity: 0.8,
        wireframe,
      });
      const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
      ring2.rotation.x = -Math.PI / 4;
      ringsGroup.add(ring2);

      ringsGroup.position.set(0, 0.1, 0);
      avatarGroup.add(ringsGroup);
      orbitalRingsRef.current = ringsGroup;
    }

    // 7. Particle Aura Emitter System
    const particleCount = 180;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      const radius = 0.6 + Math.random() * 0.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      particlePos[i] = radius * Math.cos(theta) * Math.cos(phi);
      particlePos[i + 1] = radius * Math.sin(phi) + 0.1;
      particlePos[i + 2] = radius * Math.sin(theta) * Math.cos(phi);
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      color: emissive,
      size: 0.035,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });

    const particleSystem = new THREE.Points(particleGeo, particleMat);
    avatarGroup.add(particleSystem);
    particleSystemRef.current = particleSystem;
  };

  // Adjusts 3D facial expressions and head posture dynamically based on emotion
  const applyEmotionMorphs = (elapsedTime: number) => {
    if (!leftEyeRef.current || !rightEyeRef.current) return;

    let targetEyeScaleY = 1.0;
    let targetEyeIntensity = 1.8;

    switch (emotion) {
      case 'happy':
        targetEyeScaleY = 0.6; // squint smile
        targetEyeIntensity = 2.2;
        break;
      case 'surprised':
        targetEyeScaleY = 1.4; // wide eyes
        targetEyeIntensity = 2.5;
        break;
      case 'thinking':
        targetEyeScaleY = 0.8;
        targetEyeIntensity = 1.5;
        if (headMeshRef.current) {
          headMeshRef.current.rotation.z = Math.sin(elapsedTime * 1.5) * 0.05; // slight head tilt
        }
        break;
      case 'battle':
        targetEyeScaleY = 0.7; // intense stare
        targetEyeIntensity = 3.0;
        break;
      case 'confident':
      default:
        targetEyeScaleY = 1.0;
        targetEyeIntensity = 1.8;
        break;
    }

    // Smooth eye scale and intensity
    leftEyeRef.current.scale.y += (targetEyeScaleY - leftEyeRef.current.scale.y) * 0.1;
    rightEyeRef.current.scale.y += (targetEyeScaleY - rightEyeRef.current.scale.y) * 0.1;

    if (visorMeshRef.current) {
      const visorMat = visorMeshRef.current.material as THREE.MeshPhysicalMaterial;
      if (visorMat) {
        visorMat.emissiveIntensity += (targetEyeIntensity * 0.4 - visorMat.emissiveIntensity) * 0.1;
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[280px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden ${className}`}
    >
      {/* Real-time Status Overlay Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isSpeaking ? 'bg-[#00F0FF] animate-ping' : isListening ? 'bg-[#FF007A] animate-pulse' : isThinking ? 'bg-[#FFD700] animate-bounce' : 'bg-green-400'
          }`}
        />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/80 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-md">
          {isSpeaking ? 'SPEECH // 60FPS LIP-SYNC' : isListening ? 'LISTENING (STT)' : isThinking ? 'REASONING...' : 'ONLINE // IDLE'}
        </span>
      </div>
    </div>
  );
}
