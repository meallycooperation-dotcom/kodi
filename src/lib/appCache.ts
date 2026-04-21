import { clientStorage } from './clientStorage';

const CACHE_PREFIX = 'kodi_app_cache';

export const buildCacheKey = (...parts: Array<string | number | boolean | null | undefined>) =>
  [CACHE_PREFIX, ...parts.map((part) => String(part ?? ''))].join('|');

export const readCache = async <T>(key: string, fallback: T): Promise<T> => {
  return clientStorage.getJson<T>(key, fallback);
};

export const writeCache = async <T>(key: string, value: T) => {
  await clientStorage.setJson(key, value);
};

export const clearCache = async (key: string) => {
  await clientStorage.remove(key);
};
