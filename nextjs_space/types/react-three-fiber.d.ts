import React from 'react';
import * as THREE from 'three';

declare module '@react-three/fiber' {
  export interface CanvasProps {
    children?: React.ReactNode;
    camera?: any;
    dpr?: number | [number, number];
    gl?: any;
    frameloop?: 'always' | 'demand' | 'never';
    shadows?: boolean | 'basic' | 'percentage' | 'soft' | 'variance';
    className?: string;
    style?: React.CSSProperties;
    [key: string]: any;
  }

  export const Canvas: React.FC<CanvasProps>;
  export function useFrame(callback: (state: any, delta: number) => void, renderPriority?: number): void;
  export function useThree<T = any>(selector?: (state: any) => T): T;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      primitive: any;
      ambientLight: any;
      directionalLight: any;
      pointLight: any;
      spotLight: any;
      hemisphereLight: any;
      capsuleGeometry: any;
      sphereGeometry: any;
      boxGeometry: any;
      planeGeometry: any;
      cylinderGeometry: any;
      meshStandardMaterial: any;
      meshBasicMaterial: any;
      meshPhysicalMaterial: any;
      color: any;
      [elemName: string]: any;
    }
  }
}
