'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { AvatarConfigState, AvatarEmotion, AvatarPose } from '@/hooks/useAvatar';
import { Eye, Layers, Sparkles } from 'lucide-react';

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
  const [webglFailed, setWebglFailed] = useState(false);
  const [force2D, setForce2D] = useState(false);

  // Mesh and node references for live morphing
  const avatarGroupRef = useRef<THREE.Group | null>(null);
  const headMeshRef = useRef<THREE.Mesh | null>(null);
  const jawMeshRef = useRef<THREE.Mesh | null>(null);
  const leftEyeRef = useRef<THREE.Mesh | null>(null);
  const rightEyeRef = useRef<THREE.Mesh | null>(null);
  const visorMeshRef = useRef<THREE.Mesh | null>(null);
  const crownGroupRef = useRef<THREE.Group | null>(null);
  const orbitalRingsRef = useRef<THREE.Group | null>(null);
  const leftWingRef = useRef<THREE.Mesh | null>(null);
  const rightWingRef = useRef<THREE.Mesh | null>(null);
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

    if (config?.baseModel === 'WALL_STREET_TITAN') {
      primary = 0xf5a623;
      accent = 0xffffff;
      emissive = 0xffd700;
    } else if (config?.baseModel === 'QUANTUM_ANDROID') {
      primary = 0x00f0ff;
      accent = 0xa855f7;
      emissive = 0x00f0ff;
    } else if (config?.baseModel === 'COSMIC_ENTITY') {
      primary = 0xc084fc;
      accent = 0xf5a623;
      emissive = 0x9333ea;
    }

    if (config?.aura?.includes('Fire')) {
      emissive = 0xff007a;
    } else if (config?.aura?.includes('Matrix')) {
      emissive = 0x00ff66;
    } else if (config?.aura?.includes('Gold') || config?.aura?.includes('Sparkles')) {
      emissive = 0xffd700;
    }

    return { primary, accent, emissive };
  };

  const get2DImageSrc = () => {
    switch (config?.baseModel) {
      case 'QUANTUM_ANDROID': return '/avatars/quantum_android_animated.webp';
      case 'WALL_STREET_TITAN': return '/avatars/wall_street_titan_animated.webp';
      case 'COSMIC_ENTITY': return '/avatars/cosmic_entity_animated.webp';
      case 'CYBER_HUMANOID':
      default: return '/avatars/cyber_humanoid_animated.webp';
    }
  };

  // Initialize Three.js Scene
  useEffect(() => {
    if (!containerRef.current || force2D) return;

    let renderer: THREE.WebGLRenderer | null = null;
    let camera: THREE.PerspectiveCamera | null = null;

    try {
      const width = Math.max(containerRef.current.clientWidth || 360, 240);
      const height = Math.max(containerRef.current.clientHeight || 360, 240);

      // 1. Scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // 2. Camera
      camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      camera.position.set(0, 0.15, cameraDistance);
      cameraRef.current = camera;

      // 3. Renderer with alpha and antialias
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.3;
      rendererRef.current = renderer;

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(renderer.domElement);

      // 4. Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
      scene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.4);
      dirLight1.position.set(2, 4, 3);
      scene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0x00f0ff, 1.6);
      dirLight2.position.set(-3, -2, -2);
      scene.add(dirLight2);

      const pointLight = new THREE.PointLight(0x00f0ff, 2.5, 8);
      pointLight.position.set(0, 1.2, 1.5);
      scene.add(pointLight);
      haloLightRef.current = pointLight;

      // 5. Build 3D Avatar Character Rig
      buildAvatarRig(scene);

      // 6. Resize Observer for dynamic modals
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const w = Math.max(entry.contentRect.width || 360, 240);
          const h = Math.max(entry.contentRect.height || 360, 240);
          if (camera && renderer) {
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
          }
        }
      });
      resizeObserver.observe(containerRef.current);

      // 7. Mouse Orbit Listeners
      const onMouseDown = (e: MouseEvent) => {
        isDragging.current = true;
        previousMousePosition.current = { x: e.clientX, y: e.clientY };
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / (rect.width || 300)) * 2 - 1;
        const y = -((e.clientY - rect.top) / (rect.height || 300)) * 2 + 1;
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

        // Cyber Wings Dynamic Flapping Animation
        if (leftWingRef.current && rightWingRef.current) {
          const flapAngle = Math.sin(elapsedTime * (isSpeaking ? 5.0 : 2.0)) * 0.25;
          leftWingRef.current.rotation.y = -0.3 + flapAngle;
          rightWingRef.current.rotation.y = 0.3 - flapAngle;
        }

        // Audio-Reactive Point Light Pulsing
        if (haloLightRef.current) {
          const pulseIntensity = isSpeaking ? 3.0 + Math.sin(elapsedTime * 15) * 1.5 : isThinking ? 2.5 + Math.sin(elapsedTime * 6) * 1.0 : 2.0;
          haloLightRef.current.intensity = pulseIntensity;
        }

        if (renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      };

      animate();

      return () => {
        if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
        resizeObserver.disconnect();
        if (interactive && dom) {
          dom.removeEventListener('mousedown', onMouseDown);
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        }
        if (renderer) renderer.dispose();
      };
    } catch (err) {
      console.warn('[AvatarRenderer] WebGL 3D initialization failed, falling back to 2D canvas:', err);
      setWebglFailed(true);
    }
  }, [config?.baseModel, config?.skin, config?.aura, wireframe, cameraDistance, rotationSpeed, force2D]);

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
      color: config?.baseModel === 'QUANTUM_ANDROID' ? 0x1a1a24 : 0x111118,
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
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.11, 0.14, 0.28);
    avatarGroup.add(leftEye);
    leftEyeRef.current = leftEye;

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.11, 0.14, 0.28);
    avatarGroup.add(rightEye);
    rightEyeRef.current = rightEye;

    // 5. Holographic Tactical Visor
    const visorGeo = new THREE.BoxGeometry(0.34, 0.1, 0.12);
    const visorMat = new THREE.MeshPhysicalMaterial({
      color: emissive,
      emissive: emissive,
      emissiveIntensity: 0.6,
      transparent: true,
      opacity: 0.75,
      roughness: 0.1,
      metalness: 0.5,
      transmission: 0.3,
      wireframe,
    });
    const visorMesh = new THREE.Mesh(visorGeo, visorMat);
    visorMesh.position.set(0, 0.14, 0.27);
    avatarGroup.add(visorMesh);
    visorMeshRef.current = visorMesh;

    // 6. Archetype-Specific Geometry
    if (config?.baseModel === 'WALL_STREET_TITAN') {
      const crownGroup = new THREE.Group();
      const baseRingGeo = new THREE.TorusGeometry(0.24, 0.03, 16, 32);
      const goldMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.95,
        roughness: 0.15,
        emissive: 0x553300,
        emissiveIntensity: 0.5,
      });
      const ring = new THREE.Mesh(baseRingGeo, goldMat);
      ring.rotation.x = Math.PI / 2;
      crownGroup.add(ring);

      for (let i = 0; i < 5; i++) {
        const spikeGeo = new THREE.ConeGeometry(0.04, 0.14, 8);
        const spike = new THREE.Mesh(spikeGeo, goldMat);
        const angle = (i / 5) * Math.PI * 2;
        spike.position.set(Math.cos(angle) * 0.24, 0.07, Math.sin(angle) * 0.24);
        crownGroup.add(spike);
      }

      crownGroup.position.set(0, 0.52, 0);
      avatarGroup.add(crownGroup);
      crownGroupRef.current = crownGroup;
    } else if (config?.baseModel === 'QUANTUM_ANDROID') {
      const ringsGroup = new THREE.Group();
      const ringGeo1 = new THREE.TorusGeometry(0.48, 0.015, 16, 64);
      const ringMat1 = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00f0ff,
        emissiveIntensity: 1.5,
      });
      const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
      ringsGroup.add(ring1);

      const ringGeo2 = new THREE.TorusGeometry(0.55, 0.012, 16, 64);
      const ringMat2 = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0xa855f7,
        emissiveIntensity: 1.5,
      });
      const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
      ring2.rotation.x = Math.PI / 3;
      ringsGroup.add(ring2);

      avatarGroup.add(ringsGroup);
      orbitalRingsRef.current = ringsGroup;
    }

    // 7. Cyber Wings
    const wingGeo = new THREE.PlaneGeometry(0.65, 0.35);
    const wingMat = new THREE.MeshStandardMaterial({
      color: primary,
      emissive: primary,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      wireframe: true,
    });

    const leftWing = new THREE.Mesh(wingGeo, wingMat);
    leftWing.position.set(-0.45, -0.1, -0.2);
    leftWing.rotation.y = -0.3;
    avatarGroup.add(leftWing);
    leftWingRef.current = leftWing;

    const rightWing = new THREE.Mesh(wingGeo, wingMat);
    rightWing.position.set(0.45, -0.1, -0.2);
    rightWing.rotation.y = 0.3;
    avatarGroup.add(rightWing);
    rightWingRef.current = rightWing;

    // 8. Particle System
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 1.8;
      positions[i + 1] = (Math.random() - 0.5) * 1.8;
      positions[i + 2] = (Math.random() - 0.5) * 1.8;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: emissive,
      size: 0.025,
      transparent: true,
      opacity: 0.8,
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
        targetEyeScaleY = 0.6;
        targetEyeIntensity = 2.2;
        break;
      case 'surprised':
        targetEyeScaleY = 1.4;
        targetEyeIntensity = 2.5;
        break;
      case 'thinking':
        targetEyeScaleY = 0.8;
        targetEyeIntensity = 1.5;
        if (headMeshRef.current) {
          headMeshRef.current.rotation.z = Math.sin(elapsedTime * 1.5) * 0.05;
        }
        break;
      case 'battle':
        targetEyeScaleY = 0.7;
        targetEyeIntensity = 3.0;
        break;
      case 'confident':
      default:
        targetEyeScaleY = 1.0;
        targetEyeIntensity = 1.8;
        break;
    }

    leftEyeRef.current.scale.y += (targetEyeScaleY - leftEyeRef.current.scale.y) * 0.1;
    rightEyeRef.current.scale.y += (targetEyeScaleY - rightEyeRef.current.scale.y) * 0.1;

    if (visorMeshRef.current) {
      const visorMat = visorMeshRef.current.material as THREE.MeshPhysicalMaterial;
      if (visorMat) {
        visorMat.emissiveIntensity += (targetEyeIntensity * 0.4 - visorMat.emissiveIntensity) * 0.1;
      }
    }
  };

  // Fallback 2D Render View if WebGL fails or if user switches to 2D
  if (webglFailed || force2D) {
    return (
      <div className={`relative w-full h-[360px] flex items-center justify-center p-4 ${className}`}>
        {/* Toggle Mode Button */}
        <button
          onClick={() => setForce2D(false)}
          className="absolute top-3 right-3 z-20 text-[10px] font-mono font-bold uppercase bg-black/70 hover:bg-[#00F0FF]/20 text-[#00F0FF] border border-[#00F0FF]/40 px-2.5 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 transition-all"
        >
          <Layers className="w-3 h-3" /> Switch to 3D WebGL
        </button>

        <div className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-3xl overflow-hidden border-2 border-[#00F0FF]/40 bg-black/80 shadow-[0_0_50px_rgba(0,240,255,0.3)]">
          <img
            src={get2DImageSrc()}
            alt={config?.baseModel || 'Agent Avatar'}
            className="w-full h-full object-cover animate-pulse"
          />
          {isSpeaking && (
            <div className="absolute inset-0 border-2 border-[#00F0FF] animate-ping rounded-3xl pointer-events-none" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[360px] sm:h-[400px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none overflow-hidden ${className}`}
    >
      {/* Real-time Status Overlay Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            isSpeaking ? 'bg-[#00F0FF] animate-ping' : isListening ? 'bg-[#FF007A] animate-pulse' : isThinking ? 'bg-[#FFD700] animate-bounce' : 'bg-green-400'
          }`}
        />
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-white/80 bg-black/60 px-2 py-0.5 rounded-md border border-white/10 backdrop-blur-md">
          {isSpeaking ? 'SPEECH // 60FPS LIP-SYNC' : isListening ? 'LISTENING (STT)' : isThinking ? 'REASONING...' : 'ONLINE // 3D WEBGL'}
        </span>
      </div>

      {/* Switch to 2D Mode Button */}
      <button
        onClick={() => setForce2D(true)}
        className="absolute top-3 right-3 z-20 text-[10px] font-mono font-bold uppercase bg-black/70 hover:bg-white/10 text-[#8E9BB4] hover:text-white border border-white/10 px-2 py-1 rounded-lg backdrop-blur-md flex items-center gap-1 transition-all"
      >
        <Eye className="w-3 h-3" /> 2D Mode
      </button>
    </div>
  );
}
