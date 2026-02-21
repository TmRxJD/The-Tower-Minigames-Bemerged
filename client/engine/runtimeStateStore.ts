import type { BemergedRuntimeState } from './Match3Scene'

const DB_NAME = 'bemerged-runtime'
const DB_VERSION = 1
const STORE_NAME = 'runtime'
const RECORD_ID = 'current'

type RuntimeRecord = {
  id: string
  updatedAt: number
  state: BemergedRuntimeState
}

function withIndexedDb<T>(run: (db: IDBDatabase) => Promise<T>): Promise<T> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'))
  }

  return new Promise<T>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onerror = () => reject(request.error || new Error('Failed to open runtime IndexedDB'))
    request.onsuccess = async () => {
      const db = request.result
      try {
        const result = await run(db)
        resolve(result)
      } catch (error) {
        reject(error)
      } finally {
        db.close()
      }
    }
  })
}

export async function loadBemergedRuntimeState(): Promise<BemergedRuntimeState | null> {
  if (typeof indexedDB === 'undefined') return null

  try {
    return await withIndexedDb(async db => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const row = await new Promise<RuntimeRecord | null>((resolve, reject) => {
        const request = store.get(RECORD_ID)
        request.onerror = () => reject(request.error || new Error('Failed to read runtime state'))
        request.onsuccess = () => resolve((request.result as RuntimeRecord | undefined) || null)
      })

      if (!row || !row.state || row.state.version !== 1) return null
      return row.state
    })
  } catch {
    return null
  }
}

export async function saveBemergedRuntimeState(state: BemergedRuntimeState): Promise<void> {
  if (typeof indexedDB === 'undefined') return

  try {
    await withIndexedDb(async db => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      const record: RuntimeRecord = {
        id: RECORD_ID,
        updatedAt: Date.now(),
        state,
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(record)
        request.onerror = () => reject(request.error || new Error('Failed to persist runtime state'))
        request.onsuccess = () => resolve()
      })

      await new Promise<void>((resolve, reject) => {
        tx.onerror = () => reject(tx.error || new Error('Failed to commit runtime state transaction'))
        tx.oncomplete = () => resolve()
      })
    })
  } catch {
    void 0
  }
}
