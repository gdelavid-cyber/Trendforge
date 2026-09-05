import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
// @ts-ignore
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { prisma } from '@/lib/core/db';
import { AssetJob, JobStage } from '@prisma/client';
import { SpeciesContext, SpeciesResult, AssetPromptSpec } from './types';

// Minimal Node.js FileReader shim for Three.js GLTFExporter
if (typeof (globalThis as any).FileReader === 'undefined') {
  (globalThis as any).FileReader = class {
    onloadend: (() => void) | null = null;
    result: ArrayBuffer | null = null;

    readAsArrayBuffer(blob: any) {
      if (blob.arrayBuffer) {
        blob.arrayBuffer().then((buf: ArrayBuffer) => {
          this.result = buf;
          if (typeof this.onloadend === 'function') this.onloadend();
        });
      }
    }
  };
}

function buildProceduralMesh(spec: AssetPromptSpec['procedural3D']): THREE.Group {
  const group = new THREE.Group();
  const archetype = spec?.archetype || 'generic';
  const baseColor = new THREE.Color(spec?.baseColor || '#00F0FF');
  const emissiveColor = new THREE.Color(spec?.emissiveColor || '#00F0FF');
  const emissiveIntensity = spec?.emissiveIntensity || 1.5;

  const mat = new THREE.MeshStandardMaterial({
    color: baseColor,
    emissive: emissiveColor,
    emissiveIntensity: emissiveIntensity,
    metalness: spec?.metalness ?? 0.85,
    roughness: spec?.roughness ?? 0.2,
  });

  const accentMat = new THREE.MeshStandardMaterial({
    color: 0x111118,
    metalness: 0.9,
    roughness: 0.1,
  });

  if (archetype === 'crown' || archetype === 'visor') {
    // Torus base ring + cone crown points
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.05, 16, 32), mat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.3, 8), mat);
      spike.position.set(Math.cos(angle) * 0.5, 0.15, Math.sin(angle) * 0.5);
      group.add(spike);
    }
  } else if (archetype === 'blade') {
    // Katana / Sci-fi blade: long thin box + guard + handle cylinder
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.2, 0.12), mat);
    blade.position.y = 0.6;
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 16), accentMat);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 12), accentMat);
    handle.position.y = -0.2;
    group.add(blade, guard, handle);
  } else if (archetype === 'ring') {
    // Energy aura ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.8, 0.08, 16, 48), mat);
    group.add(ring);
  } else if (archetype === 'wings') {
    // Particle trail wings
    const wingL = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), mat);
    wingL.position.set(-0.4, 0.2, 0);
    wingL.rotation.z = Math.PI / 4;
    const wingR = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.8, 4), mat);
    wingR.position.set(0.4, 0.2, 0);
    wingR.rotation.z = -Math.PI / 4;
    group.add(wingL, wingR);
  } else {
    // Generic floating sci-fi core octahedron
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.35, 2), mat);
    group.add(core);
  }

  if (spec?.position) group.position.set(...spec.position);
  if (spec?.scale) group.scale.set(...spec.scale);
  if (spec?.rotation) group.rotation.set(...spec.rotation);

  return group;
}

export async function runModeler(job: AssetJob, ctx: SpeciesContext = {}): Promise<SpeciesResult> {
  const cosmeticsDir = path.join(process.cwd(), 'public', 'cosmetics');
  if (!fs.existsSync(cosmeticsDir)) {
    fs.mkdirSync(cosmeticsDir, { recursive: true });
  }

  const spec = (job.promptSpec as unknown as AssetPromptSpec) || {};
  const proceduralSpec = spec.procedural3D;
  const supportedArchetypes = ['crown', 'visor', 'blade'];

  // Hybrid Scope Enforcement: Only procedural geometric items produce GLBs
  if (!proceduralSpec || !supportedArchetypes.includes(proceduralSpec.archetype)) {
    const skipReason = `3D_SKIPPED: archetype '${proceduralSpec?.archetype || 'none'}' not procedural-capable (2D art valid)`;
    
    if (!ctx.dryRun) {
      await prisma.assetJob.update({
        where: { id: job.id },
        data: {
          modelGlbPath: null,
          renderConfig: null as any,
          errorMessage: skipReason,
          stage: JobStage.QA_INSPECTION, // Proceed to QA with 2D art only
        },
      });
    }

    return {
      success: true,
      nextStage: JobStage.QA_INSPECTION,
      costUsd: 0.0,
      errorMessage: skipReason,
      data: { modelGlbPath: null, skipped3D: true },
    };
  }

  const targetFileName = `${job.catalogItemId}.glb`;
  const targetFilePath = path.join(cosmeticsDir, targetFileName);
  const relativeAssetPath = `/cosmetics/${targetFileName}`;

  try {
    const scene = new THREE.Scene();
    const meshGroup = buildProceduralMesh(proceduralSpec);
    scene.add(meshGroup);

    const exporter = new GLTFExporter();
    const glbBuffer = await new Promise<Buffer>((resolve, reject) => {
      exporter.parse(
        scene,
        (glb: any) => {
          resolve(Buffer.from(glb as ArrayBuffer));
        },
        (err: any) => reject(err),
        { binary: true }
      );
    });

    // Enforce hard budget: <= 1.5 MB
    if (glbBuffer.byteLength > 1.5 * 1024 * 1024) {
      return {
        success: false,
        errorMessage: `GLB size ${glbBuffer.byteLength} exceeds 1.5MB hard cap`,
      };
    }

    fs.writeFileSync(targetFilePath, glbBuffer);

    const renderConfig = {
      kind: 'model3d',
      glbUrl: relativeAssetPath,
      scale: proceduralSpec?.scale || [1, 1, 1],
      position: proceduralSpec?.position || [0, 0, 0],
      rotation: proceduralSpec?.rotation || [0, 0, 0],
      emissiveIntensity: proceduralSpec?.emissiveIntensity || 1.5,
    };

    if (!ctx.dryRun) {
      await prisma.assetJob.update({
        where: { id: job.id },
        data: {
          modelGlbPath: relativeAssetPath,
          renderConfig: renderConfig as any,
          stage: JobStage.QA_INSPECTION, // Advance to QA Inspector
        },
      });
    }

    return {
      success: true,
      nextStage: JobStage.QA_INSPECTION,
      costUsd: 0.0, // Procedural = Zero external cost
      data: { modelGlbPath: relativeAssetPath, renderConfig },
    };
  } catch (error: any) {
    // 3D failure is graceful: job remains valid for 2D publication
    await prisma.assetJob.update({
      where: { id: job.id },
      data: {
        errorMessage: `3D Procedural modeling skipped/failed: ${error.message || error}`,
        stage: JobStage.QA_INSPECTION,
      },
    });

    return {
      success: true,
      nextStage: JobStage.QA_INSPECTION,
      costUsd: 0.0,
      errorMessage: error.message,
    };
  }
}
