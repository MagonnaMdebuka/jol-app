/**
 * OSM cache utilities for localStorage-based caching
 */
import type { IOsmPlace, IOsmCacheEntry } from '../types/osm.types';

const CACHE_KEY_PREFIX = 'jol-osm-';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STALE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour — refresh in background after this

/** Round coordinate to 3 decimal places (~111m precision) for better cache hits */
export const roundCoord = (n: number): number => Math.round(n * 1000) / 1000;

/** Cache key excludes limit — we always fetch 50+ and slice on read */
export const getCacheKey = (lat: number, lng: number): string =>
  `${CACHE_KEY_PREFIX}${roundCoord(lat)},${roundCoord(lng)}`;

export const getCache = (key: string): IOsmCacheEntry | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry: IOsmCacheEntry = JSON.parse(raw);
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
};

export const setCache = (key: string, data: IOsmPlace[]): void => {
  try {
    const entry: IOsmCacheEntry = { data, timestamp: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — ignore
  }
};

export const isCacheStale = (entry: IOsmCacheEntry): boolean =>
  Date.now() - entry.timestamp > STALE_TTL_MS;

/** Clear all OSM cache entries */
export const clearOsmCache = (): void => {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_KEY_PREFIX));
  keys.forEach((k) => localStorage.removeItem(k));
};

/** Get cache stats for debugging */
export const getOsmCacheStats = (): { entries: number; sizeKB: number } => {
  const keys = Object.keys(localStorage).filter((k) => k.startsWith(CACHE_KEY_PREFIX));
  let totalSize = 0;
  keys.forEach((k) => {
    const v = localStorage.getItem(k);
    if (v) totalSize += v.length * 2; // UTF-16, 2 bytes per char
  });
  return { entries: keys.length, sizeKB: Math.round(totalSize / 1024) };
};
