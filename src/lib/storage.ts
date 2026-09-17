// Zapis danych klas.
// • Folder „dane” obok aplikacji — gdy serwer to obsługuje (paczka Windows i `npm run dev`). Każda klasa to osobny plik .json.
// • Pamięć przeglądarki (IndexedDB) — zapasowo, gdy aplikacja działa bez naszego serwera.

type Store = {
  get: <T>(key: string) => Promise<T | undefined>
  set: (key: string, value: unknown) => Promise<void>
  remove: (key: string) => Promise<void>
}

export type StorageInfo = { kind: 'folder'; folder: string } | { kind: 'browser' }

/* ---------- IndexedDB ---------- */

const DB_NAME = 'hub-klasowy'
const STORE = 'kv'
let dbPromise: Promise<IDBDatabase> | null = null

function openDb() {
  dbPromise ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(STORE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  return dbPromise
}

async function runIdb<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openDb()
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode)
    const request = action(transaction.objectStore(STORE))
    transaction.oncomplete = () => resolve(request.result)
    transaction.onerror = () => reject(transaction.error ?? request.error)
    transaction.onabort = () => reject(transaction.error ?? request.error)
  })
}

export const browserStorage: Store = {
  get: <T>(key: string) => runIdb<T | undefined>('readonly', (store) => store.get(key) as IDBRequest<T | undefined>),
  set: (key, value) => runIdb('readwrite', (store) => store.put(value, key)).then(() => undefined),
  remove: (key) => runIdb('readwrite', (store) => store.delete(key)).then(() => undefined),
}

/* ---------- Folder „dane” przez lokalny serwer ---------- */

const fileName = (key: string) => {
  const base = key === 'classes-index' ? 'klasy' : key.startsWith('class:') ? key.slice('class:'.length) : key
  return `${base.replace(/[^\w.-]/g, '_')}.json`
}

// Zapisy idą po kolei, żeby wolniejszy starszy zapis nie nadpisał nowszego.
let writeQueue: Promise<unknown> = Promise.resolve()

const folderStorage: Store = {
  async get<T>(key: string) {
    const response = await fetch(`api/dane/${fileName(key)}`, { cache: 'no-store' })
    if (response.status === 404) return undefined
    if (!response.ok) throw new Error(`Odczyt ${key}: ${response.status}`)
    return (await response.json()) as T
  },
  set(key, value) {
    const body = JSON.stringify(value)
    const write = writeQueue.catch(() => undefined).then(async () => {
      const response = await fetch(`api/dane/${fileName(key)}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body })
      if (!response.ok) throw new Error(`Zapis ${key}: ${response.status}`)
    })
    writeQueue = write
    return write
  },
  remove(key) {
    const removal = writeQueue.catch(() => undefined).then(async () => {
      const response = await fetch(`api/dane/${fileName(key)}`, { method: 'DELETE' })
      if (!response.ok && response.status !== 404) throw new Error(`Usuwanie ${key}: ${response.status}`)
    })
    writeQueue = removal
    return removal
  },
}

let infoPromise: Promise<StorageInfo> | null = null

export function getStorageInfo() {
  infoPromise ??= fetch('api/dane/', { cache: 'no-store', headers: { Accept: 'application/json' } })
    .then(async (response): Promise<StorageInfo> => {
      if (!response.ok || !response.headers.get('content-type')?.includes('json')) return { kind: 'browser' }
      const status = (await response.json()) as { ok?: boolean; folder?: string }
      return status.ok ? { kind: 'folder', folder: status.folder ?? 'dane' } : { kind: 'browser' }
    })
    .catch((): StorageInfo => ({ kind: 'browser' }))
  return infoPromise
}

const activeStore = async () => ((await getStorageInfo()).kind === 'folder' ? folderStorage : browserStorage)

export const storage: Store = {
  get: async <T>(key: string) => (await activeStore()).get<T>(key),
  set: async (key, value) => (await activeStore()).set(key, value),
  remove: async (key) => (await activeStore()).remove(key),
}
