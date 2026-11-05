const DB_NAME = 'campus-digital-memory';
const STORE = 'app';
const ROOT = 'database';
let openPromise;
let queue = Promise.resolve();

function openDb() {
  if (!('indexedDB' in globalThis)) return Promise.reject(new Error('IndexedDB is unavailable in this browser.'));
  if (!openPromise) openPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE); };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return openPromise;
}

function getRoot() {
  return openDb().then((db) => new Promise((resolve, reject) => {
    const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(ROOT);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  }));
}

/** All mock database writes are serialized through this transaction queue. */
export function tx(update) {
  const run = queue.then(async () => {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      const store = transaction.objectStore(STORE);
      let result;
      const request = store.get(ROOT);
      request.onsuccess = () => {
        try {
          result = update(request.result ?? null);
          if (result && typeof result.then === 'function') throw new Error('IndexedDB transaction updates must be synchronous.');
          store.put(result, ROOT);
        } catch (error) { transaction.abort(); reject(error); }
      };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error || request.error);
      transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted.'));
    });
  });
  queue = run.catch(() => {});
  return run;
}

export async function getDb(initializer, legacyKey = 'cdm_db_v1') {
  const existing = await getRoot();
  if (existing) return existing;
  let legacy;
  try { const raw = localStorage.getItem(legacyKey); if (raw) legacy = JSON.parse(raw); } catch { /* use the current seed */ }
  const created = await tx((current) => current || legacy || initializer());
  try { localStorage.removeItem(legacyKey); } catch { /* ignore unavailable storage */ }
  return created;
}
