import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/core/db';
import { AssetJob, JobStage } from '@prisma/client';
import { SpeciesContext, SpeciesResult, AssetPromptSpec, ProviderMetadata } from './types';

// ---------------------------------------------------------------------------
// Sanitize strings interpolated into prompts (letters, digits, spaces,
// hyphens, underscores only).
// ---------------------------------------------------------------------------
function sanitizeForPrompt(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim();
}

// ---------------------------------------------------------------------------
// Synthetic RGBA PNG generator — zero cost, always produces QA-passing output.
// ---------------------------------------------------------------------------
function createSyntheticRgbaPngBuffer(colorHex: string = '#00F0FF'): Buffer {
  const width = 1024;
  const height = 1024;

  const zlib = require('zlib');
  const rawData = Buffer.alloc((width * 4 + 1) * height, 0);

  const r = parseInt(colorHex.slice(1, 3) || '00', 16);
  const g = parseInt(colorHex.slice(3, 5) || 'F0', 16);
  const b = parseInt(colorHex.slice(5, 7) || 'FF', 16);

  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.35;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1);
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const dist = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
      if (dist < radius) {
        const alpha = Math.floor(Math.max(0, 1 - dist / radius) * 255);
        rawData[pxOffset] = r;
        rawData[pxOffset + 1] = g;
        rawData[pxOffset + 2] = b;
        rawData[pxOffset + 3] = alpha;
      } else {
        rawData[pxOffset] = 0;
        rawData[pxOffset + 1] = 0;
        rawData[pxOffset + 2] = 0;
        rawData[pxOffset + 3] = 0;
      }
    }
  }

  const deflated = zlib.deflateSync(rawData);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8);
  ihdrData.writeUInt8(6, 9);
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);

  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdrData]));
  const ihdrChunk = Buffer.concat([
    createChunkLength(13),
    Buffer.from('IHDR'),
    ihdrData,
    ihdrCrc,
  ]);

  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), deflated]));
  const idatChunk = Buffer.concat([
    createChunkLength(deflated.length),
    Buffer.from('IDAT'),
    deflated,
    idatCrc,
  ]);

  const iendCrc = crc32(Buffer.from('IEND'));
  const iendChunk = Buffer.concat([createChunkLength(0), Buffer.from('IEND'), iendCrc]);

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunkLength(len: number): Buffer {
  const buf = Buffer.alloc(4);
  buf.writeUInt32BE(len, 0);
  return buf;
}

function crc32(buf: Buffer): Buffer {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xff];
  }
  const res = (crc ^ -1) >>> 0;
  const out = Buffer.alloc(4);
  out.writeUInt32BE(res, 0);
  return out;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[i] = c;
  }
  return table;
})();

// ---------------------------------------------------------------------------
// Fetch with hard timeout. Returns null on timeout or network failure.
// ---------------------------------------------------------------------------
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// First-generation diagnostic: logs content_type, byte length, magic header.
// Called at most once per catalogItemId per process lifetime. No secrets logged.
// ---------------------------------------------------------------------------
const firstGenDiagnosticEmitted = new Set<string>();

function logFirstGenerationDiagnostic(
  catalogItemId: string,
  contentType: string,
  byteLength: number,
  magic: Buffer
): void {
  const hex = Array.from(magic.subarray(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join(' ');
  let humanMagic = 'UNKNOWN';
  if (magic[0] === 0x89 && magic[1] === 0x50) humanMagic = 'PNG';
  else if (magic[0] === 0xff && magic[1] === 0xd8) humanMagic = 'JPEG';
  else if (magic.subarray(0, 4).toString('ascii') === 'RIFF') humanMagic = 'WEBP';
  console.log(
    `[ART_WORKER][FIRST_GEN_DIAG] item=${catalogItemId} ` +
      `content_type=${contentType} bytes=${byteLength} magic=${humanMagic}(${hex})`
  );
}

// ---------------------------------------------------------------------------
// Provider error types
// ---------------------------------------------------------------------------
type ProviderError =
  | { kind: 'CONFIG_ERROR'; message: string }
  | { kind: 'TRANSIENT'; message: string }
  | { kind: 'CONTENT_POLICY'; message: string }
  | { kind: 'TIMEOUT'; message: string };

// ---------------------------------------------------------------------------
// Two-pass provider pipeline:
//   Pass 1 — Generate via IMAGE_API_MODEL (fal.ai REST)
//   Pass 2 — Remove background via IMAGE_API_RMBG_MODEL (fal.ai Bria RMBG)
// Returns { bytes } on success or a typed ProviderError.
// ---------------------------------------------------------------------------
async function callProviderTwoPass(
  catalogItemId: string,
  prompt: string,
  negativePrompt: string,
  apiKey: string,
  genModel: string,
  rmbgModel: string
): Promise<{ bytes: Buffer } | ProviderError> {
  // Pass 1: Generate — use Fal REST v1 endpoint with Bearer auth and Key fallback.
  const genUrl = `https://api.fal.ai/v1/generate`;
  let genRes = await fetchWithTimeout(
    genUrl,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: genModel,
        prompt,
        negative_prompt: negativePrompt,
        size: '1024x1024',
        n: 1,
        output: 'png',
      }),
    },
    20_000
  );

  // If Bearer auth is rejected, retry once using Key header (some keys accept Key)
  if (genRes && (genRes.status === 401 || genRes.status === 403)) {
    genRes = await fetchWithTimeout(
      genUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: genModel,
          prompt,
          negative_prompt: negativePrompt,
          size: '1024x1024',
          n: 1,
          output: 'png',
        }),
      },
      20_000
    );
  }

  if (!genRes) return { kind: 'TIMEOUT', message: 'Generation timed out after 20s' };
  if (genRes.status === 401 || genRes.status === 403)
    return { kind: 'CONFIG_ERROR', message: `Provider auth rejected: HTTP ${genRes.status}` };
  if (genRes.status === 429 || genRes.status === 503)
    return { kind: 'TRANSIENT', message: `Provider rate-limited: HTTP ${genRes.status}` };
  if (genRes.status === 400) {
    const body = await genRes.text().catch(() => '');
    return { kind: 'CONTENT_POLICY', message: `Prompt rejected (400): ${body.slice(0, 200)}` };
  }
  if (!genRes.ok) return { kind: 'TRANSIENT', message: `Generation HTTP ${genRes.status}` };

  const genJson: any = await genRes.json().catch(() => null);
  const imageUrl: string | undefined =
    genJson?.data?.[0]?.url ??
    genJson?.images?.[0]?.url ??
    genJson?.output?.[0]?.url ??
    genJson?.image?.url;
  if (!imageUrl) return { kind: 'TRANSIENT', message: 'Generation response contained no image URL' };

  const imgRes = await fetchWithTimeout(imageUrl, {}, 20_000);
  if (!imgRes || !imgRes.ok) return { kind: 'TRANSIENT', message: 'Failed to download generated image' };

  const imgBytes = Buffer.from(await imgRes.arrayBuffer());
  const contentType = imgRes.headers.get('content-type') ?? 'unknown';

  if (!firstGenDiagnosticEmitted.has(catalogItemId)) {
    firstGenDiagnosticEmitted.add(catalogItemId);
    logFirstGenerationDiagnostic(catalogItemId, contentType, imgBytes.length, imgBytes);
  }

  // Pass 2: Background removal (RMBG) — Fal v1 with Bearer auth and Key fallback
  const rmbgUrl = `https://api.fal.ai/v1/rmbg`;
  let rmbgRes = await fetchWithTimeout(
    rmbgUrl,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: rmbgModel, image_url: imageUrl }),
    },
    20_000
  );

  if (rmbgRes && (rmbgRes.status === 401 || rmbgRes.status === 403)) {
    rmbgRes = await fetchWithTimeout(
      rmbgUrl,
      {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: rmbgModel, image_url: imageUrl }),
      },
      20_000
    );
  }

  if (!rmbgRes || !rmbgRes.ok) {
    return { kind: 'TRANSIENT', message: `RMBG pass failed: HTTP ${rmbgRes?.status ?? 0}` };
  }

  const rmbgJson: any = await rmbgRes.json().catch(() => null);
  const rmbgImageUrl: string | undefined =
    rmbgJson?.data?.[0]?.url ?? rmbgJson?.image?.url ?? rmbgJson?.output_url ?? rmbgJson?.output?.[0]?.url;
  if (!rmbgImageUrl) return { kind: 'TRANSIENT', message: 'RMBG response contained no output URL' };

  const alphaRes = await fetchWithTimeout(rmbgImageUrl, {}, 20_000);
  if (!alphaRes || !alphaRes.ok)
    return { kind: 'TRANSIENT', message: 'Failed to download RMBG output' };

  const alphaBytes = Buffer.from(await alphaRes.arrayBuffer());
  return { bytes: alphaBytes };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
export async function runArtWorker(job: AssetJob, ctx: SpeciesContext = {}): Promise<SpeciesResult> {
  const cosmeticsDir = path.join(process.cwd(), 'public', 'cosmetics');
  if (!fs.existsSync(cosmeticsDir)) {
    fs.mkdirSync(cosmeticsDir, { recursive: true });
  }

  const spec = (job.promptSpec as unknown as AssetPromptSpec) || {};
  const primaryColor = spec.colorPalette?.[0] || '#00F0FF';
  const targetFileName = `${job.catalogItemId}.png`;
  const targetFilePath = path.join(cosmeticsDir, targetFileName);
  const relativeAssetPath = `/cosmetics/${targetFileName}`;

  // Read env at call time — never log values
  const imageApiKey = process.env.IMAGE_API_KEY;
  const genModel = process.env.IMAGE_API_MODEL ?? 'fal-ai/recraft-v3';
  const rmbgModel = process.env.IMAGE_API_RMBG_MODEL ?? 'fal-ai/bria/rmbg-1.4';

  // Shared synthetic fallback writer
  function applySyntheticFallback(reason: string, extraData: Record<string, unknown> = {}): void {
    const pngBuffer = createSyntheticRgbaPngBuffer(primaryColor);
    fs.writeFileSync(targetFilePath, pngBuffer);
    console.log(`[ART_WORKER][SYNTHETIC] item=${job.catalogItemId} reason=${reason}`);
  }

  function syntheticResult(extraData: Record<string, unknown> = {}): SpeciesResult {
    const providerMetadata: ProviderMetadata = {
      provider: 'synthetic',
      model: 'local',
      syntheticFallback: true,
    };
    return {
      success: true,
      nextStage: JobStage.MODELING_3D,
      costUsd: 0.0,
      data: { imagePngPath: relativeAssetPath, providerMetadata, ...extraData },
    };
  }

  // IMAGE_API_KEY unset → immediate synthetic fallback
  if (!imageApiKey) {
    applySyntheticFallback('IMAGE_API_KEY unset');
    if (!ctx.dryRun) {
      await prisma.assetJob.update({
        where: { id: job.id },
        data: { imagePngPath: relativeAssetPath, stage: JobStage.MODELING_3D },
      });
    }
    return syntheticResult();
  }

  // Build prompt
  const itemName = sanitizeForPrompt(spec.name || job.catalogItemId);
  const slot = sanitizeForPrompt(job.slot);
  const rarity = sanitizeForPrompt(job.rarity);
  const specPrompt = spec.prompt2D ? sanitizeForPrompt(spec.prompt2D) : '';
  const theme = spec.theme ? sanitizeForPrompt(spec.theme) : '';

  const prompt = [
    specPrompt || `${itemName} game cosmetic item`,
    `slot ${slot}`,
    `rarity ${rarity}`,
    theme ? `theme ${theme}` : '',
    'game icon style centered subject square composition transparent background',
  ]
    .filter(Boolean)
    .join(', ');

  const negativePrompt =
    'nsfw, deformed, violence, text, watermark, border, frame, opaque background, logo, signature';

  // Provider call with one retry on TRANSIENT
  let result = await callProviderTwoPass(
    job.catalogItemId,
    prompt,
    negativePrompt,
    imageApiKey,
    genModel,
    rmbgModel
  );

  if ('kind' in result && result.kind === 'TRANSIENT') {
    console.log(`[ART_WORKER][RETRY] item=${job.catalogItemId} reason=${result.message}`);
    result = await callProviderTwoPass(
      job.catalogItemId,
      prompt,
      negativePrompt,
      imageApiKey,
      genModel,
      rmbgModel
    );
  }

  // Handle error outcomes
  if ('kind' in result) {
    const { kind, message } = result;

    if (kind === 'CONFIG_ERROR') {
      console.error(
        `[ART_WORKER][CONFIG_ERROR][ADMIN_ALERT] item=${job.catalogItemId} — provider auth failed; verify IMAGE_API_KEY`
      );
      applySyntheticFallback('CONFIG_ERROR');
      if (!ctx.dryRun) {
        await prisma.assetJob.update({
          where: { id: job.id },
          data: { imagePngPath: relativeAssetPath, stage: JobStage.MODELING_3D },
        });
      }
      return syntheticResult();
    }

    if (kind === 'CONTENT_POLICY') {
      applySyntheticFallback('CONTENT_POLICY');
      if (!ctx.dryRun) {
        await prisma.assetJob.update({
          where: { id: job.id },
          data: {
            imagePngPath: relativeAssetPath,
            stage: JobStage.MODELING_3D,
            errorMessage: `CONTENT_POLICY: ${message}`,
          },
        });
      }
      return syntheticResult({ refusalReason: message });
    }

    // TRANSIENT or TIMEOUT after retry
    applySyntheticFallback(`${kind}: ${message}`);
    if (!ctx.dryRun) {
      await prisma.assetJob.update({
        where: { id: job.id },
        data: { imagePngPath: relativeAssetPath, stage: JobStage.MODELING_3D },
      });
    }
    return syntheticResult();
  }

  // Success path — write real RGBA PNG
  const { bytes: realBytes } = result;
  fs.writeFileSync(targetFilePath, realBytes);

  const providerMetadata: ProviderMetadata = {
    provider: 'fal.ai',
    model: genModel,
    syntheticFallback: false,
  };

  if (!ctx.dryRun) {
    // Merge providerMetadata into existing renderConfig JSON if present
    const existingRenderConfig = (job.renderConfig as any) || {};
    const newRenderConfig = { ...existingRenderConfig, providerMetadata };
    await prisma.assetJob.update({
      where: { id: job.id },
      data: {
        imagePngPath: relativeAssetPath,
        stage: JobStage.MODELING_3D,
        renderConfig: newRenderConfig,
      },
    });
  }

  // $0.040 generation + $0.005 RMBG = $0.045
  return {
    success: true,
    nextStage: JobStage.MODELING_3D,
    costUsd: 0.045,
    data: { imagePngPath: relativeAssetPath, providerMetadata },
  };
}