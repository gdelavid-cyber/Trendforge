import { prisma } from '@/lib/core/db';
import { COSMETICS_CATALOG, CatalogItem, CosmeticRenderConfig } from './catalog';

export interface CatalogSnapshot {
  version: string;
  timestamp: string;
  items: CatalogItem[];
}

let cachedSnapshot: CatalogSnapshot | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60s in-process TTL

export function invalidateServerCatalogCache(): void {
  cachedSnapshot = null;
  lastCacheTime = 0;
}

/**
 * Loads the merged catalog combining the immutable static catalog with
 * any swarm-published 3D render configs and asset URLs stored in PostgreSQL.
 */
export async function loadMergedCatalog(): Promise<CatalogItem[]> {
  const now = Date.now();
  if (cachedSnapshot && now - lastCacheTime < CACHE_TTL_MS) {
    return cachedSnapshot.items;
  }

  try {
    // Fetch all database Cosmetic rows that have published overrides
    const dbCosmetics = await prisma.cosmetic.findMany({
      where: {
        OR: [
          { renderConfig: { not: null as any } },
          { assetUrl: { not: null as any } },
        ],
      },
      select: {
        id: true,
        name: true,
        renderConfig: true,
        assetUrl: true,
      },
    });

    const dbOverrideMap = new Map<string, { renderConfig?: any; assetUrl?: string | null }>();
    dbCosmetics.forEach((c) => {
      if (c.id) dbOverrideMap.set(c.id, { renderConfig: c.renderConfig, assetUrl: c.assetUrl });
      if (c.name) dbOverrideMap.set(c.name, { renderConfig: c.renderConfig, assetUrl: c.assetUrl });
    });

    // Merge onto static catalog immutably
    const merged: CatalogItem[] = COSMETICS_CATALOG.map((item) => {
      const override = dbOverrideMap.get(item.id) || dbOverrideMap.get(item.name);
      if (!override) return item;

      const updated = { ...item };
      if (override.renderConfig) {
        updated.render = override.renderConfig as CosmeticRenderConfig;
      }
      if (override.assetUrl) {
        updated.image = override.assetUrl;
        updated.artPending = false;
      }
      return updated;
    });

    cachedSnapshot = {
      version: `v1.${now}`,
      timestamp: new Date(now).toISOString(),
      items: merged,
    };
    lastCacheTime = now;

    return merged;
  } catch (error) {
    // Graceful fallback to static catalog on DB error
    return COSMETICS_CATALOG;
  }
}

/**
 * Returns a Map keyed by both ID and Name for fast lookups of merged items.
 */
export async function loadMergedCatalogMap(): Promise<Map<string, CatalogItem>> {
  const items = await loadMergedCatalog();
  const map = new Map<string, CatalogItem>();
  items.forEach((item) => {
    map.set(item.id, item);
    map.set(item.name, item);
  });
  return map;
}

