'use client';

import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FighterLoadout } from '@/lib/cosmetics/stats';
import type { AvatarEmotion } from '@/hooks/useAvatar';

export interface MetahumanCompanionProps {
  /** URL to the Metahuman .glb (must have ARKit blendshapes on the face mesh) */
  glbUrl: string;
  loadout?: FighterLoadout;
  emotion?: AvatarEmotion;
  isSpeaking?: boolean;
  isWorking?: boolean;
  workLabel?: string;
  workProgress?: number;
  faceAngle?: number;
  /** Viseme input for lip sync: array of {name, weight} from your STT/TTS pipeline */
  visemes?: Array<{ name: string; weight: number }>;
}

const EMOTION_BLENDSHAPES: Partial<Record<AvatarEmotion, Record<string, number>>> = {
  neutral: {
    EyeBlinkLeft: 0,
    EyeBlinkRight: 0,
    BrowInnerUp: 0,
    BrowDownLeft: 0,
    BrowDownRight: 0,
    BrowOuterUpLeft: 0,
    BrowOuterUpRight: 0,
    EyeLookUpLeft: 0,
    EyeLookUpRight: 0,
    EyeLookDownLeft: 0,
    EyeLookDownRight: 0,
    EyeLookInLeft: 0,
    EyeLookInRight: 0,
    EyeLookOutLeft: 0,
    EyeLookOutRight: 0,
    EyeSquintLeft: 0,
    EyeSquintRight: 0,
    EyeWideLeft: 0,
    EyeWideRight: 0,
    CheekSquintLeft: 0,
    CheekSquintRight: 0,
    NoseSneerLeft: 0,
    NoseSneerRight: 0,
    JawOpen: 0,
    MouthClose: 0,
    MouthFunnel: 0,
    MouthPucker: 0,
    MouthLeft: 0,
    MouthRight: 0,
    MouthSmileLeft: 0,
    MouthSmileRight: 0,
    MouthFrownLeft: 0,
    MouthFrownRight: 0,
    MouthDimpleLeft: 0,
    MouthDimpleRight: 0,
    MouthStretchLeft: 0,
    MouthStretchRight: 0,
    MouthRollLower: 0,
    MouthRollUpper: 0,
    MouthShrugLower: 0,
    MouthShrugUpper: 0,
    MouthPressLeft: 0,
    MouthPressRight: 0,
    MouthLowerDownLeft: 0,
    MouthLowerDownRight: 0,
    TongueOut: 0,
  },
  happy: {
    EyeBlinkLeft: 0,
    EyeBlinkRight: 0,
    BrowInnerUp: 0.15,
    BrowOuterUpLeft: 0.4,
    BrowOuterUpRight: 0.4,
    EyeSquintLeft: 0.35,
    EyeSquintRight: 0.35,
    CheekSquintLeft: 0.5,
    CheekSquintRight: 0.5,
    MouthSmileLeft: 0.8,
    MouthSmileRight: 0.8,
    MouthDimpleLeft: 0.4,
    MouthDimpleRight: 0.4,
    MouthStretchLeft: 0.3,
    MouthStretchRight: 0.3,
    MouthPressLeft: 0.2,
    MouthPressRight: 0.2,
  },
  confident: {
    BrowInnerUp: 0.1,
    BrowOuterUpLeft: 0.25,
    BrowOuterUpRight: 0.25,
    EyeSquintLeft: 0.2,
    EyeSquintRight: 0.2,
    CheekSquintLeft: 0.15,
    CheekSquintRight: 0.15,
    MouthSmileLeft: 0.4,
    MouthSmileRight: 0.3,
    MouthDimpleLeft: 0.15,
    MouthDimpleRight: 0.15,
    MouthPressLeft: 0.1,
    MouthPressRight: 0.1,
  },
  thinking: {
    BrowInnerUp: 0.5,
    BrowDownLeft: 0.3,
    BrowDownRight: 0.1,
    BrowOuterUpLeft: 0.1,
    BrowOuterUpRight: 0.3,
    EyeLookUpLeft: 0.2,
    EyeLookUpRight: 0.2,
    EyeSquintLeft: 0.25,
    EyeSquintRight: 0.15,
    MouthPressLeft: 0.2,
    MouthPressRight: 0.2,
    MouthLowerDownLeft: 0.1,
    MouthLowerDownRight: 0.1,
  },
  surprised: {
    BrowInnerUp: 1.0,
    BrowOuterUpLeft: 1.0,
    BrowOuterUpRight: 1.0,
    EyeWideLeft: 0.8,
    EyeWideRight: 0.8,
    EyeLookUpLeft: 0.3,
    EyeLookUpRight: 0.3,
    JawOpen: 0.4,
    MouthFunnel: 0.3,
    MouthOpen: 0.5,
  },
  battle: {
    BrowDownLeft: 0.7,
    BrowDownRight: 0.7,
    BrowInnerUp: 0.1,
    EyeSquintLeft: 0.6,
    EyeSquintRight: 0.6,
    EyeLookInLeft: 0.2,
    EyeLookInRight: 0.2,
    NoseSneerLeft: 0.4,
    NoseSneerRight: 0.4,
    MouthPressLeft: 0.5,
    MouthPressRight: 0.5,
    MouthFrownLeft: 0.4,
    MouthFrownRight: 0.4,
    MouthStretchLeft: 0.2,
    MouthStretchRight: 0.2,
  },
};

const VISEME_TO_BLENDSHAPE: Record<string, Record<string, number>> = {
  sil: { MouthClose: 1 },
  PP: { MouthClose: 1, MouthPressLeft: 0.8, MouthPressRight: 0.8 },
  FF: { MouthClose: 0.3, MouthLowerDownLeft: 0.6, MouthLowerDownRight: 0.6, MouthFunnel: 0.4 },
  TH: { MouthOpen: 0.4, TongueOut: 0.3, MouthLowerDownLeft: 0.3, MouthLowerDownRight: 0.3 },
  DD: { MouthOpen: 0.5, TongueOut: 0.2 },
  kk: { MouthOpen: 0.5, MouthClose: 0.2 },
  CH: { MouthOpen: 0.4, MouthFunnel: 0.5, MouthPucker: 0.3 },
  SS: { MouthClose: 0.4, MouthSmileLeft: 0.3, MouthSmileRight: 0.3, MouthStretchLeft: 0.2, MouthStretchRight: 0.2 },
  nn: { MouthOpen: 0.4, MouthPressLeft: 0.4, MouthPressRight: 0.4 },
  RR: { MouthOpen: 0.3, MouthFunnel: 0.3, MouthPucker: 0.2 },
  aa: { JawOpen: 0.9, MouthOpen: 0.8 },
  EE: { MouthSmileLeft: 0.7, MouthSmileRight: 0.7, MouthStretchLeft: 0.5, MouthStretchRight: 0.5, MouthOpen: 0.3 },
  ih: { MouthSmileLeft: 0.4, MouthSmileRight: 0.4, MouthStretchLeft: 0.3, MouthStretchRight: 0.3, MouthOpen: 0.2 },
  oh: { MouthFunnel: 0.8, MouthPucker: 0.6, JawOpen: 0.5 },
  ou: { MouthFunnel: 0.6, MouthPucker: 0.8, MouthOpen: 0.3 },
  OU: { MouthFunnel: 0.7, MouthPucker: 0.7, JawOpen: 0.4 },
};

const DEFAULT_ARKIT_NAMES = [
  'EyeBlinkLeft', 'EyeBlinkRight',
  'EyeLookDownLeft', 'EyeLookDownRight', 'EyeLookInLeft', 'EyeLookInRight', 'EyeLookOutLeft', 'EyeLookOutRight', 'EyeLookUpLeft', 'EyeLookUpRight',
  'EyeSquintLeft', 'EyeSquintRight', 'EyeWideLeft', 'EyeWideRight',
  'JawForward', 'JawLeft', 'JawRight', 'JawOpen',
  'MouthClose', 'MouthFunnel', 'MouthPucker', 'MouthLeft', 'MouthRight', 'MouthSmileLeft', 'MouthSmileRight', 'MouthFrownLeft', 'MouthFrownRight', 'MouthDimpleLeft', 'MouthDimpleRight', 'MouthStretchLeft', 'MouthStretchRight', 'MouthRollLower', 'MouthRollUpper', 'MouthShrugLower', 'MouthShrugUpper', 'MouthPressLeft', 'MouthPressRight', 'MouthLowerDownLeft', 'MouthLowerDownRight',
  'CheekPuff', 'CheekSquintLeft', 'CheekSquintRight',
  'NoseSneerLeft', 'NoseSneerRight',
  'BrowDownLeft', 'BrowDownRight', 'BrowInnerUp', 'BrowOuterUpLeft', 'BrowOuterUpRight',
  'TongueOut',
];

function findMorphTargetMesh(object: THREE.Object3D): THREE.SkinnedMesh | null {
  let result: THREE.SkinnedMesh | null = null;
  object.traverse((child) => {
    if (child instanceof THREE.SkinnedMesh && child.morphTargetDictionary && Object.keys(child.morphTargetDictionary).length > 0) {
      const dict = child.morphTargetDictionary;
      const hasArkit = DEFAULT_ARKIT_NAMES.some((n) => n in dict);
      if (hasArkit) result = child;
    }
  });
  return result;
}

export function MetahumanCompanion({
  glbUrl,
  loadout,
  emotion = 'confident',
  isSpeaking = false,
  isWorking = false,
  workLabel,
  workProgress,
  faceAngle = 0,
  visemes = [],
}: MetahumanCompanionProps) {
  const { scene, animations } = useGLTF(glbUrl);
  const morphMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const headRef = useRef<THREE.Object3D | null>(null);
  const eyeLeftRef = useRef<THREE.Object3D | null>(null);
  const eyeRightRef = useRef<THREE.Object3D | null>(null);
  const blinkRef = useRef({ nextAt: 2, until: 0 });
  const saccadeRef = useRef({ nextAt: 1, x: 0, y: 0 });
  const targetWeightsRef = useRef<Record<string, number>>({});
  const currentWeightsRef = useRef<Record<string, number>>({});

  const emotionTargets = useMemo(() => EMOTION_BLENDSHAPES[emotion] ?? {}, [emotion]);

  useEffect(() => {
    const clone = scene.clone(true);
    const mesh = findMorphTargetMesh(clone);
    if (mesh) {
      morphMeshRef.current = mesh;
      const dict = mesh.morphTargetDictionary ?? {};
      mesh.morphTargetInfluences = mesh.morphTargetInfluences ?? new Array(Object.keys(dict).length).fill(0);
      Object.keys(dict).forEach((name) => {
        targetWeightsRef.current[name] = 0;
        currentWeightsRef.current[name] = 0;
      });
    }

    clone.traverse((child: THREE.Object3D) => {
      if (child.name.toLowerCase().includes('head') && !headRef.current) headRef.current = child;
      if (child.name.toLowerCase().includes('eye_left') && !eyeLeftRef.current) eyeLeftRef.current = child;
      if (child.name.toLowerCase().includes('eye_right') && !eyeRightRef.current) eyeRightRef.current = child;
    });

    if (animations.length > 0) {
      const mixer = new THREE.AnimationMixer(clone);
      animations.forEach((clip: THREE.AnimationClip) => {
        const action = mixer.clipAction(clip);
        if (clip.name.toLowerCase().includes('idle') || clip.name.toLowerCase().includes('breath')) {
          action.play();
        }
      });
      mixerRef.current = mixer;
    }

    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    if (size.y > 0) {
      const s = 1.5 / size.y;
      clone.scale.setScalar(s);
      box.setFromObject(clone);
      clone.position.y -= box.min.y;
    }
    clone.position.y -= 0.42;

    return () => {
      mixerRef.current?.uncacheRoot(clone);
    };
  }, [scene, animations]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const lerpK = 1 - Math.exp(-delta * 12);

    if (mixerRef.current) mixerRef.current.update(delta);

    if (morphMeshRef.current) {
      const dict = morphMeshRef.current.morphTargetDictionary ?? {};
      const influences = morphMeshRef.current.morphTargetInfluences ?? [];

      const baseTargets = { ...emotionTargets };

      const b = blinkRef.current;
      if (t > b.nextAt) {
        b.until = t + 0.13;
        b.nextAt = t + (Math.random() < 0.28 ? 0.34 : 2.4 + Math.random() * 2.4);
      }
      const blinking = t < b.until;

      if (blinking) {
        baseTargets.EyeBlinkLeft = 1;
        baseTargets.EyeBlinkRight = 1;
      }

      if (isSpeaking && visemes.length > 0) {
        const v = visemes[0];
        const visemeMap = VISEME_TO_BLENDSHAPE[v.name] ?? {};
        Object.assign(baseTargets, visemeMap);
      } else if (isSpeaking) {
        const talkOpen = Math.sin(t * 15) > 0.1;
        if (talkOpen) {
          baseTargets.JawOpen = Math.max(baseTargets.JawOpen ?? 0, 0.3 + Math.sin(t * 20) * 0.2);
          baseTargets.MouthOpen = Math.max(baseTargets.MouthOpen ?? 0, 0.3);
        }
      }

      if (isWorking) {
        baseTargets.EyeLookDownLeft = Math.max(baseTargets.EyeLookDownLeft ?? 0, 0.3);
        baseTargets.EyeLookDownRight = Math.max(baseTargets.EyeLookDownRight ?? 0, 0.3);
      }

      const s = saccadeRef.current;
      if (t > s.nextAt) {
        s.nextAt = t + 0.7 + Math.random() * 1.7;
        s.x = (Math.random() - 0.5) * 0.4;
        s.y = (Math.random() - 0.5) * 0.2;
      }
      baseTargets.EyeLookInLeft = (baseTargets.EyeLookInLeft ?? 0) + s.x * 0.5;
      baseTargets.EyeLookInRight = (baseTargets.EyeLookInRight ?? 0) - s.x * 0.5;
      baseTargets.EyeLookUpLeft = (baseTargets.EyeLookUpLeft ?? 0) + s.y * 0.3;
      baseTargets.EyeLookUpRight = (baseTargets.EyeLookUpRight ?? 0) + s.y * 0.3;

      Object.keys(dict).forEach((name, idx) => {
        const target = baseTargets[name] ?? 0;
        targetWeightsRef.current[name] = target;
        const current = currentWeightsRef.current[name] ?? 0;
        const next = current + (target - current) * (1 - Math.exp(-delta * (blinking ? 30 : 10)));
        currentWeightsRef.current[name] = next;
        if (idx < influences.length) influences[idx] = next;
      });
    }

    if (headRef.current) {
      const nod = isSpeaking ? Math.sin(t * 10) * 0.05 : 0;
      const workPitch = isWorking ? 0.22 : 0;
      headRef.current.rotation.y = THREE.MathUtils.damp(headRef.current.rotation.y, faceAngle + state.pointer.x * 0.3, 3, delta);
      headRef.current.rotation.x = THREE.MathUtils.damp(headRef.current.rotation.x, workPitch - state.pointer.y * 0.2 + nod, 4, delta);
    }

    if (eyeLeftRef.current) {
      eyeLeftRef.current.rotation.y = state.pointer.x * 0.3;
      eyeLeftRef.current.rotation.x = -state.pointer.y * 0.2;
    }
    if (eyeRightRef.current) {
      eyeRightRef.current.rotation.y = state.pointer.x * 0.3;
      eyeRightRef.current.rotation.x = -state.pointer.y * 0.2;
    }
  });

  return <primitive object={scene} />;
}

export default MetahumanCompanion;