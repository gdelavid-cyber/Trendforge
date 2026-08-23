import fs from 'fs';
import path from 'path';
import { afterAll, describe, expect, it } from 'vitest';
import { runQAInspector } from '../lib/swarm/species/qa-inspector';
import { COSMETICS_CATALOG } from '@/lib/cosmetics/catalog';
import { AssetJob, JobStage, QAVerdict } from '@prisma/client';

// QA inspector gating logic tested in dry-run mode (no DB writes).
// Fixtures are written to throwaway paths; the positive catalog-fit case
// temporarily borrows a real catalog id only if no asset already exists.

const COSMETICS_DIR = path.join(process.cwd(), 'public', 'cosmetics');
const FIXTURE_PNG = path.join(COSMETICS_DIR, 'qa_test_fixture_item.png');
const FIXTURE_GLB = path.join(COSMETICS_DIR, 'qa_test_fixture_item.glb');

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function buildPngHeader(opts: {
  width?: number;
  height?: number;
  bitDepth?: number;
  colorType?: number;
} = {}): Buffer {
  const { width = 1024, height = 1024, bitDepth = 8, colorType = 6 } = opts;
  const buf = Buffer.alloc(32);
  PNG_SIGNATURE.copy(buf, 0);
  buf.writeUInt32BE(13, 8); // IHDR data length
  buf.write('IHDR', 12, 'ascii');
  buf.writeUInt32BE(width, 16);
  buf.writeUInt32BE(height, 20);
  buf.writeUInt8(bitDepth, 24);
  buf.writeUInt8(colorType, 25);
  return buf;
}

function makeJob(overrides: Partial<AssetJob> = {}): AssetJob {
  return {
    id: 'qa-test-job',
    catalogItemId: 'qa_test_fixture_item',
    slot: 'HEAD',
    rarity: 'LEGENDARY',
    attempts: 0,
    maxAttempts: 3,
    priority: 0,
    stage: JobStage.QA_INSPECTION,
    ...overrides,
  } as AssetJob;
}

function runDry(job: AssetJob) {
  return runQAInspector(job, { dryRun: true });
}

afterAll(() => {
  for (const f of [FIXTURE_PNG, FIXTURE_GLB]) {
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
});

describe('swarm QA inspector (dry-run)', () => {
  it('rejects a job whose PNG fails magic-byte validation and retries from spec', async () => {
    fs.writeFileSync(FIXTURE_PNG, Buffer.from('definitely not a png'));
    const result = await runDry(makeJob());

    expect(result.success).toBe(false);
    expect(result.data.verdict).toBe(QAVerdict.REJECT_RETRY);
    expect(result.nextStage).toBe(JobStage.SPEC_DESIGN);
    expect(result.data.failureReasons).toContainEqual(expect.stringContaining('magic bytes invalid'));
  });

  it('rejects a valid PNG with wrong dimensions as REJECT_FATAL once attempts are exhausted', async () => {
    fs.writeFileSync(FIXTURE_PNG, buildPngHeader({ width: 512, height: 512 }));
    const exhausted = makeJob({ attempts: 2, maxAttempts: 3 });

    const result = await runDry(exhausted);

    expect(result.success).toBe(false);
    expect(result.data.dimensionValid).toBe(false);
    expect(result.data.failureReasons).toContainEqual(expect.stringContaining('512x512 != 1024x1024'));
    expect(result.data.verdict).toBe(QAVerdict.REJECT_FATAL);
    expect(result.nextStage).toBe(JobStage.DEAD_LETTER);
  });

  it('fails a non-RGBA PNG on the alpha check', async () => {
    fs.writeFileSync(FIXTURE_PNG, buildPngHeader({ colorType: 2 }));
    const result = await runDry(makeJob());

    expect(result.success).toBe(false);
    expect(result.data.alphaValid).toBe(false);
    expect(result.data.failureReasons).toContainEqual(expect.stringContaining('RGBA'));
  });

  it('flags a GLB with a corrupt magic header even when the PNG is fine', async () => {
    fs.writeFileSync(FIXTURE_PNG, buildPngHeader());
    fs.writeFileSync(FIXTURE_GLB, Buffer.from('not-a-glb'));

    const result = await runDry(makeJob());

    expect(result.success).toBe(false);
    expect(result.data.glbParsedValid).toBe(false);
    expect(result.data.failureReasons).toContainEqual('GLB binary magic header invalid');
  });

  it('rejects when the catalog item does not exist even with a perfect asset', async () => {
    fs.writeFileSync(FIXTURE_PNG, buildPngHeader());
    if (fs.existsSync(FIXTURE_GLB)) fs.unlinkSync(FIXTURE_GLB);

    const result = await runDry(makeJob());

    expect(result.data.binaryValid).toBe(true);
    expect(result.data.dimensionValid).toBe(true);
    expect(result.data.catalogFitValid).toBe(false);
    expect(result.data.failureReasons).toContainEqual(
      expect.stringContaining('not in static catalog')
    );
  });

  // Positive gating path: needs a real catalog id whose slot/rarity match the
  // job. Only borrowed if no published asset exists at that path yet.
  const realItem = COSMETICS_CATALOG.find((c) => c.id === 'skin_neon_cyber');
  const realPngPath = realItem ? path.join(COSMETICS_DIR, `${realItem.id}.png`) : null;
  const canBorrowRealId = Boolean(realItem && realPngPath && !fs.existsSync(realPngPath));

  it.runIf(canBorrowRealId)(
    'passes a complete asset whose slot and rarity match the catalog',
    async () => {
      fs.writeFileSync(realPngPath!, buildPngHeader());
      try {
        const result = await runDry(
          makeJob({
            catalogItemId: realItem!.id,
            slot: realItem!.slot,
            rarity: realItem!.rarity,
          })
        );

        expect(result.success).toBe(true);
        expect(result.data.verdict).toBe(QAVerdict.PASS);
        expect(result.nextStage).toBe(JobStage.PUBLISHING);
        expect(result.data.polyCount).toBeNull(); // 2D-only item
        expect(result.costUsd).toBeGreaterThan(0);
      } finally {
        fs.unlinkSync(realPngPath!);
      }
    }
  );

  it.runIf(!canBorrowRealId)(
    'skips the catalog-positive case because a published asset already occupies the fixture path',
    () => {
      expect(fs.existsSync(realPngPath!)).toBe(true);
    }
  );

  it('rejects a job whose slot or rarity diverges from the catalog entry', async () => {
    fs.writeFileSync(FIXTURE_PNG, buildPngHeader());

    const anyItem = COSMETICS_CATALOG[0];
    const wrongSlot = anyItem.slot === 'HEAD' ? 'AURA' : 'HEAD';

    const result = await runDry(
      makeJob({ catalogItemId: anyItem.id, rarity: anyItem.rarity, slot: wrongSlot })
    );

    expect(result.data.catalogFitValid).toBe(false);
    expect(result.data.failureReasons).toContainEqual(
      expect.stringContaining('slot/rarity mismatch')
    );
  });
});
