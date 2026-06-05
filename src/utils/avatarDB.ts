import type { ExpressionSet } from './emotionExpressions';

const DB_NAME = 'avatar-studio-db';
const STORE_NAME = 'avatars';
const USAGE_STORE = 'api-usage';
const EMOTION_STORE = 'emotionSheets';
// v3: added `api-usage` store. v4: added `emotionSheets` store (heavy sheet PNGs kept
// separate from the lightweight avatar list). Bumping the version re-runs onupgradeneeded
// so the guarded creations below add any missing store for existing users.
const DB_VERSION = 4;
const MAX_AVATARS = 50;
const LS_KEY = 'avatar-studio-saved';

export type BuilderSettings = {
  gender: string; skin: string; hair: string; hairColor: string;
  eyebrows: string; eyes: string; face: string; nose: string;
  lips: string; facialHair: string; glasses: string; earrings: string;
  necklace: string; headwear: string; outfit: string; outfitColor: string;
};

/** Lightweight emotion-sheet metadata stored inline on the avatar (NO image data). */
export type EmotionSheetMeta = {
  set: ExpressionSet;
  cols: number;
  rows: number;
  cell: number;
  order: string[];
  member: string;
  updatedAt: number;
};

export type SavedAvatar = {
  id: string;
  createdAt: number;
  imageUrl: string;            // current image (reflects in-place edits)
  settings: BuilderSettings;   // current attribute snapshot
  styleId: string;             // current style
  mode: 'text' | 'builder';
  prompt?: string;
  // First base, preserved across in-place edits so "revert to original" survives a reload.
  originalBaseUrl?: string;
  originalBaseSnapshot?: BuilderSettings;
  originalBaseStyleId?: string;
  emotionSheet?: EmotionSheetMeta | null; // present once a sheet is saved for this avatar
};

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(USAGE_STORE)) {
        db.createObjectStore(USAGE_STORE, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(EMOTION_STORE)) {
        db.createObjectStore(EMOTION_STORE, { keyPath: 'avatarId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function loadAvatars(): Promise<SavedAvatar[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index('createdAt');
    const req = idx.getAll();
    req.onsuccess = () => {
      // Sort newest first
      const items = (req.result as SavedAvatar[]).sort((a, b) => b.createdAt - a.createdAt);
      resolve(items);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function saveAvatar(avatar: SavedAvatar): Promise<void> {
  const db = await openDB();

  // Enforce max limit — delete oldest beyond MAX_AVATARS-1 to make room
  const all = await loadAvatars();
  if (all.length >= MAX_AVATARS) {
    const toDelete = all.slice(MAX_AVATARS - 1); // oldest items
    const tx = db.transaction([STORE_NAME, EMOTION_STORE], 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const sheets = tx.objectStore(EMOTION_STORE);
    for (const old of toDelete) {
      store.delete(old.id);
      sheets.delete(old.id); // evict the avatar's sheet too (no orphans)
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // Save new avatar
  const tx = db.transaction(STORE_NAME, 'readwrite');
  tx.objectStore(STORE_NAME).put(avatar);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteAvatar(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction([STORE_NAME, EMOTION_STORE], 'readwrite');
  tx.objectStore(STORE_NAME).delete(id);
  tx.objectStore(EMOTION_STORE).delete(id); // drop the avatar's sheet too (no orphans)
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Save (or overwrite) the composed emotion-sheet PNG for an avatar. */
export async function saveEmotionSheet(avatarId: string, dataUrl: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(EMOTION_STORE, 'readwrite');
  tx.objectStore(EMOTION_STORE).put({ avatarId, dataUrl });
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Load the composed emotion-sheet PNG for an avatar (null if none). */
export async function loadEmotionSheet(avatarId: string): Promise<string | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(EMOTION_STORE, 'readonly');
    const req = tx.objectStore(EMOTION_STORE).get(avatarId);
    req.onsuccess = () => resolve((req.result as { dataUrl: string } | undefined)?.dataUrl ?? null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteEmotionSheet(avatarId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(EMOTION_STORE, 'readwrite');
  tx.objectStore(EMOTION_STORE).delete(avatarId);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/** Migrate localStorage data to IndexedDB (runs once) */
export async function migrateFromLocalStorage(): Promise<void> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;

    const items: any[] = JSON.parse(raw);
    if (!items.length) {
      localStorage.removeItem(LS_KEY);
      return;
    }

    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    for (const item of items) {
      // Map old `thumbnail` field to `imageUrl`
      const avatar: SavedAvatar = {
        id: item.id,
        createdAt: item.createdAt,
        imageUrl: item.thumbnail || item.imageUrl || '',
        settings: item.settings,
        styleId: item.styleId,
        mode: item.mode,
        prompt: item.prompt,
      };
      store.put(avatar);
    }

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    localStorage.removeItem(LS_KEY);
    console.log(`[avatarDB] Migrated ${items.length} avatars from localStorage to IndexedDB`);
  } catch (err) {
    console.error('[avatarDB] Migration failed:', err);
  }
}
