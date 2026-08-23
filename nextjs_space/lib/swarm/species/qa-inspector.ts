import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';
import { COSMETICS_CATALOG } from '@/lib/cosmetics/catalog';
import { AssetJob, JobStage, QAVerdict } from '@prisma/client';
import { SpeciesContext, SpeciesResult } from './types';

export async function runQAInspector(
  job: AssetJob,
  ctx: SpeciesContext = {}
): Promise<SpeciesResult> {
  const cosmeticsDir = path.join(process.cwd(), 'public', 'cosmetics');
  const pngPath = path.join(cosmeticsDir, `${job.catalogItemId}.png`);
  const glbPath = path.join(cosmeticsDir, `${job.catalogItemId}.glb`);

  let binaryValid = false;
  let alphaValid = false;
  let dimensionValid = false;
  let glbParsedValid = true; // True by default if no GLB exists (2D only)
  let polyCount: number | null = null; // null for 2D-only items; set to integer only when GLB parsed
  let fileSizeBytes = 0;
  const failureReasons: string[] = [];


  // Check 1, 2, 3: PNG Validation
  if (fs.existsSync(pngPath)) {
    const pngBuffer = fs.readFileSync(pngPath);
    fileSizeBytes += pngBuffer.length;

    // Check 1: PNG Magic Bytes (89 50 4E 47 0D 0A 1A 0A)
    const expectedPngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (pngBuffer.subarray(0, 8).equals(expectedPngSignature)) {
      binaryValid = true;
    } else {
      failureReasons.push('PNG header magic bytes invalid');
    }

    // Check 3: PNG Dimensions (1024x1024 from IHDR chunk bytes 16-24)
    if (pngBuffer.length >= 24) {
      const width = pngBuffer.readUInt32BE(16);
      const height = pngBuffer.readUInt32BE(20);
      const bitDepth = pngBuffer.readUInt8(24);
      const colorType = pngBuffer.readUInt8(25);

      if (width === 1024 && height === 1024) {
        dimensionValid = true;
      } else {
        failureReasons.push(`PNG dimensions ${width}x${height} != 1024x1024`);
      }

      // Check 2: Alpha channel present (ColorType 6 = RGBA, 4 = Grayscale+Alpha, at 8-bit depth)
      if ((colorType === 6 || colorType === 4) && bitDepth === 8) {
        alphaValid = true; // Alpha channel confirmed
      } else {
        failureReasons.push('PNG lacks 32-bit RGBA alpha transparency');
      }
    }
  } else {
    failureReasons.push(`PNG asset missing on disk: ${pngPath}`);
  }

  // GLB Validation (if present)
  if (fs.existsSync(glbPath)) {
    const glbBuffer = fs.readFileSync(glbPath);
    fileSizeBytes += glbBuffer.length;

    // GLB Magic Bytes: 'glTF' (0x46546C67)
    const magic = glbBuffer.subarray(0, 4).toString('ascii');
    if (magic === 'glTF') {
      if (glbBuffer.length > 1.5 * 1024 * 1024) {
        glbParsedValid = false;
        failureReasons.push(`GLB file size ${(glbBuffer.length / (1024 * 1024)).toFixed(2)}MB exceeds 1.5MB hard cap`);
      } else {
        try {
          const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
          const arrayBuffer = glbBuffer.buffer.slice(
            glbBuffer.byteOffset,
            glbBuffer.byteOffset + glbBuffer.byteLength
          );
          const loader = new GLTFLoader();

          const parsedResult = await new Promise<{ triangles: number; success: boolean; error?: string }>(
            (resolve) => {
              loader.parse(
                arrayBuffer,
                '',
                (gltf: any) => {
                  let triangles = 0;
                  gltf.scene.traverse((child: any) => {
                    if (child.isMesh && child.geometry) {
                      const geom = child.geometry;
                      if (geom.index) {
                        triangles += Math.floor(geom.index.count / 3);
                      } else if (geom.attributes?.position) {
                        triangles += Math.floor(geom.attributes.position.count / 3);
                      }
                    }
                  });
                  resolve({ triangles, success: true });
                },
                (err: any) => {
                  resolve({ triangles: 0, success: false, error: err?.message || String(err) });
                }
              );
            }
          );

          if (parsedResult.success) {
            polyCount = parsedResult.triangles;
            if (polyCount > 25000) {
              glbParsedValid = false;
              failureReasons.push(`GLB polyCount (${polyCount} triangles) exceeds 25,000 budget`);
            } else {
              glbParsedValid = true;
            }
          } else {
            glbParsedValid = false;
            failureReasons.push(`GLB parse failed: ${parsedResult.error}`);
          }
        } catch (parseErr: any) {
          glbParsedValid = false;
          failureReasons.push(`GLB parse exception: ${parseErr.message || parseErr}`);
        }
      }
    } else {
      glbParsedValid = false;
      failureReasons.push('GLB binary magic header invalid');
    }
  }

  // Check 4: Catalog Fit Validation
  const catalogItem = COSMETICS_CATALOG.find((c) => c.id === job.catalogItemId);
  let catalogFitValid = false;
  if (catalogItem) {
    if (catalogItem.slot === job.slot && catalogItem.rarity === job.rarity) {
      catalogFitValid = true;
    } else {
      failureReasons.push(`Catalog slot/rarity mismatch: job(${job.slot}/${job.rarity}) vs catalog(${catalogItem.slot}/${catalogItem.rarity})`);
    }
  } else {
    failureReasons.push(`Catalog item ${job.catalogItemId} not in static catalog`);
  }

  const allPassed = binaryValid && alphaValid && dimensionValid && glbParsedValid && catalogFitValid;
  const attempts = job.attempts + 1;
  const maxAttempts = job.maxAttempts;

  let verdict: QAVerdict = QAVerdict.PASS;
  let nextStage: JobStage = JobStage.PUBLISHING;

  if (!allPassed) {
    if (attempts < maxAttempts) {
      verdict = QAVerdict.REJECT_RETRY;
      nextStage = JobStage.SPEC_DESIGN; // Retry from spec
    } else {
      verdict = QAVerdict.REJECT_FATAL;
      nextStage = JobStage.DEAD_LETTER;
    }
  }

  if (!ctx.dryRun) {
    // Record QA Review in database
    await prisma.qAReview.create({
      data: {
        jobId: job.id,
        inspectorId: ctx.instance?.id,
        verdict,
        binaryValid,
        alphaValid,
        dimensionValid,
        glbParsedValid,
        polyCount,
        fileSizeBytes,
        failureReason: failureReasons.length > 0 ? failureReasons.join('; ') : null,
      },
    });

    await prisma.assetJob.update({
      where: { id: job.id },
      data: {
        attempts,
        stage: nextStage,
        errorMessage: failureReasons.length > 0 ? failureReasons.join('; ') : null,
      },
    });
  }

  return {
    success: allPassed,
    nextStage,
    costUsd: 0.001,
    data: {
      verdict,
      binaryValid,
      alphaValid,
      dimensionValid,
      glbParsedValid,
      catalogFitValid,
      failureReasons,
    },
  };
}
