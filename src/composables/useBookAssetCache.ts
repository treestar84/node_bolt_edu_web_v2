import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'book-assets';
const DB_VERSION = 1;
const IMAGE_STORE = 'images';
const AUDIO_STORE = 'audio';

let dbPromise: ReturnType<typeof openDB> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db: IDBPDatabase) {
        if (!db.objectStoreNames.contains(IMAGE_STORE)) {
          db.createObjectStore(IMAGE_STORE);
        }
        if (!db.objectStoreNames.contains(AUDIO_STORE)) {
          db.createObjectStore(AUDIO_STORE);
        }
      },
    });
  }
  return dbPromise;
}

export async function prefetchBookAssets(pages: Array<{ imageUrl: string; audioUrl: string }>, onProgress?: (done: number, total: number) => void) {
  const db = await getDB();
  let done = 0;
  const total = pages.length * 2;
  for (const page of pages) {
    // Prefetch image
    if (page.imageUrl && page.imageUrl !== '') {
      try {
        const res = await fetch(page.imageUrl.startsWith('http') ? page.imageUrl : 'http://localhost:3001' + page.imageUrl);
        const blob = await res.blob();
        await db.put(IMAGE_STORE, blob, page.imageUrl);
      } catch {}
    }
    done++;
    onProgress?.(done, total);
    // Prefetch audio
    if (page.audioUrl && page.audioUrl !== '') {
      try {
        const res = await fetch(page.audioUrl.startsWith('http') ? page.audioUrl : 'http://localhost:3001' + page.audioUrl);
        const blob = await res.blob();
        await db.put(AUDIO_STORE, blob, page.audioUrl);
      } catch {}
    }
    done++;
    onProgress?.(done, total);
  }
}

export async function getCachedImageUrl(url: string): Promise<string | null> {
  const db = await getDB();
  const blob = await db.get(IMAGE_STORE, url);
  if (blob) {
    return URL.createObjectURL(blob);
  }
  return null;
}

export async function getCachedAudioUrl(url: string): Promise<string | null> {
  const db = await getDB();
  const blob = await db.get(AUDIO_STORE, url);
  if (blob) {
    return URL.createObjectURL(blob);
  }
  return null;
}

export async function clearBookAssets() {
  const db = await getDB();
  await db.clear(IMAGE_STORE);
  await db.clear(AUDIO_STORE);
} 