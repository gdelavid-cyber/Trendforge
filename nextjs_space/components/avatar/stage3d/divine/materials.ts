import * as THREE from 'three';
import type { DivinePalette } from './palette';

export type Quality = 'cinematic' | 'lite';

/**
 * Material bank for the divine chassis.
 *
 * Two decisions drive everything here:
 *
 * 1. The shell is metalness 1 with a near-black base. A fully metallic surface
 *    derives its colour entirely from the environment, so the look is authored
 *    in VoidEnvironment's lightformers, not in an albedo value. Tinting the base
 *    brighter is what makes procedural chrome read as painted plastic.
 * 2. Thin-film iridescence over a clearcoat is the "liquid nano-crystal" — the
 *    hue shift is view-dependent interference, so it changes as the camera
 *    orbits. A gradient texture cannot fake that.
 *
 * Emissive parts are `toneMapped = false` and colour-black-plus-emissive, which
 * pushes them past the bloom pass's luminance threshold while the shell stays
 * under it. That is what makes the bloom selective without a selection buffer.
 */
export interface DivineMaterials {
  /** primary shell — every visible body segment */
  shell: THREE.MeshPhysicalMaterial;
  /** recessed forms: gaps, undersides, inner cavity walls */
  shellDeep: THREE.MeshPhysicalMaterial;
  /** translucent crystal — chest window and core cage */
  glass: THREE.MeshPhysicalMaterial;
  /** halo ring body: metal that also glows along its edge */
  haloMetal: THREE.MeshPhysicalMaterial;
  /** pure light: joint gap rings, seam glows, orbital ribbons */
  light: THREE.MeshStandardMaterial;
  /** additive film: aura shells, ripples, ground bloom */
  film: THREE.MeshBasicMaterial;
  dispose(): void;
}

export function createMaterials(p: DivinePalette, quality: Quality): DivineMaterials {
  const cinematic = quality === 'cinematic';

  const shell = new THREE.MeshPhysicalMaterial({
    color: p.shell,
    metalness: 1,
    roughness: 0.045,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    iridescence: p.iridescence,
    iridescenceIOR: 1.9,
    iridescenceThicknessRange: p.irisRange,
    // pushed well above 1: the void environment is intentionally dim, so the
    // shell needs the boost to catch the lightformer strips at all
    envMapIntensity: cinematic ? 2.6 : 2.0,
  });

  const shellDeep = new THREE.MeshPhysicalMaterial({
    color: p.shellDeep,
    metalness: 1,
    roughness: 0.16,
    clearcoat: 0.6,
    clearcoatRoughness: 0.12,
    iridescence: p.iridescence * 0.45,
    iridescenceIOR: 1.6,
    iridescenceThicknessRange: p.irisRange,
    envMapIntensity: cinematic ? 1.5 : 1.1,
  });

  // Transmission costs an extra scene resolve per frame. Lite trades refraction
  // for a high-envMap translucent physical surface, which holds up at orb size.
  const glass = cinematic
    ? new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        metalness: 0,
        roughness: 0.05,
        transmission: 1,
        thickness: 0.55,
        ior: 2.2,
        attenuationColor: new THREE.Color(p.attenuation),
        attenuationDistance: 0.5,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.2,
        transparent: true,
      })
    : new THREE.MeshPhysicalMaterial({
        color: p.attenuation,
        metalness: 0.1,
        roughness: 0.08,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 2.4,
        transparent: true,
        opacity: 0.42,
      });

  const haloMetal = new THREE.MeshPhysicalMaterial({
    color: p.shell,
    metalness: 1,
    roughness: 0.02,
    clearcoat: 1,
    clearcoatRoughness: 0,
    iridescence: 1,
    iridescenceIOR: 2.1,
    iridescenceThicknessRange: [p.irisRange[0] * 0.7, p.irisRange[1] * 1.2],
    emissive: new THREE.Color(p.halo),
    emissiveIntensity: 0.35,
    envMapIntensity: cinematic ? 3.2 : 2.4,
  });

  const light = new THREE.MeshStandardMaterial({
    color: '#000000',
    emissive: new THREE.Color(p.halo),
    emissiveIntensity: 3.4,
    roughness: 1,
    metalness: 0,
    toneMapped: false,
  });

  const film = new THREE.MeshBasicMaterial({
    color: new THREE.Color(p.aura),
    transparent: true,
    opacity: 0.3,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });

  return {
    shell,
    shellDeep,
    glass,
    haloMetal,
    light,
    film,
    dispose() {
      shell.dispose();
      shellDeep.dispose();
      glass.dispose();
      haloMetal.dispose();
      light.dispose();
      film.dispose();
    },
  };
}

/**
 * Emissive clone at a specific colour/strength. Used for cosmetic accents that
 * must not inherit the palette halo (a gold crown on a cyan chassis).
 */
export function lightMaterial(color: string, intensity = 3): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: '#000000',
    emissive: new THREE.Color(color),
    emissiveIntensity: intensity,
    roughness: 1,
    metalness: 0,
    toneMapped: false,
  });
}

export function filmMaterial(color: string, opacity = 0.3): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}
