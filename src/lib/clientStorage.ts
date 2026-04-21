import Dexie, { type Table } from 'dexie';

type ClientStorageRecord = {
  key: string;
  value: string;
  updatedAt: number;
};

class KodiClientStorage extends Dexie {
  entries!: Table<ClientStorageRecord, string>;

  constructor() {
    super('kodi_client_storage');
    this.version(1).stores({
      entries: '&key, updatedAt'
    });
  }
}

const hasIndexedDb = typeof indexedDB !== 'undefined';
const db = hasIndexedDb ? new KodiClientStorage() : null;
const memoryStore = new Map<string, string>();

const readLegacyValue = (key: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(key);
};

const writeLegacyValue = (key: string, value: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(key, value);
};

const deleteLegacyValue = (key: string) => {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.removeItem(key);
};

const persistValue = async (key: string, value: string) => {
  memoryStore.set(key, value);

  if (db) {
    try {
      await db.entries.put({
        key,
        value,
        updatedAt: Date.now()
      });
      deleteLegacyValue(key);
      return;
    } catch {
      // Fall back below if IndexedDB is unavailable at runtime.
    }
  }

  writeLegacyValue(key, value);
};

const getString = async (key: string, fallback = '') => {
  if (memoryStore.has(key)) {
    return memoryStore.get(key) ?? fallback;
  }

  if (db) {
    try {
      const record = await db.entries.get(key);
      if (record) {
        memoryStore.set(key, record.value);
        return record.value;
      }
    } catch {
      // Fall back to the legacy path below.
    }
  }

  const legacyValue = readLegacyValue(key);
  if (legacyValue !== null) {
    await persistValue(key, legacyValue);
    return legacyValue;
  }

  return fallback;
};

const setString = async (key: string, value: string) => {
  await persistValue(key, value);
};

const remove = async (key: string) => {
  memoryStore.delete(key);

  if (db) {
    try {
      await db.entries.delete(key);
    } catch {
      // Fall back to the legacy path below.
    }
  }

  deleteLegacyValue(key);
};

const getJson = async <T>(key: string, fallback: T): Promise<T> => {
  const value = await getString(key, '');
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const setJson = async <T>(key: string, value: T) => {
  await setString(key, JSON.stringify(value));
};

const getBoolean = async (key: string, fallback = false) => {
  const value = await getString(key);
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return fallback;
};

const setBoolean = async (key: string, value: boolean) => {
  await setString(key, value ? 'true' : 'false');
};

export const clientStorage = {
  getString,
  setString,
  getJson,
  setJson,
  remove,
  getBoolean,
  setBoolean
};
