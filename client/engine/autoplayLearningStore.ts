import type { AutoplayGoal, AutoplayLearningProfile, ModuleType, ObjectiveProgress } from './types'

const DB_NAME = 'bemerged-ai-learning'
const DB_VERSION = 1
const ATTEMPTS_STORE = 'attempts'
const MAX_ATTEMPTS = 300

type AttemptRecord = {
  id: string
  atIso: string
  goal: AutoplayGoal
  elapsedSeconds: number
  totalShards: number
  objectiveCompletionPercent: number
  objectiveComplete: boolean
  highestStarsByType: Record<ModuleType, number>
}

function createNeutralProfile(): AutoplayLearningProfile {
  return {
    attempts: 0,
    typeBias: {
      Cannon: 1,
      Armor: 1,
      Generator: 1,
      Core: 1,
    },
    bestObjectiveCompletionPercent: 0,
    bestShards: 0,
    bestElapsedSeconds: 0,
  }
}

function withIndexedDb<T>(run: (db: IDBDatabase) => Promise<T>): Promise<T> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'))
  }

  return new Promise<T>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(ATTEMPTS_STORE)) {
        const store = db.createObjectStore(ATTEMPTS_STORE, { keyPath: 'id' })
        store.createIndex('atIso', 'atIso', { unique: false })
      }
    }

    request.onerror = () => reject(request.error || new Error('Failed to open IndexedDB'))
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

function getAllAttempts(db: IDBDatabase): Promise<AttemptRecord[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(ATTEMPTS_STORE, 'readonly')
    const store = tx.objectStore(ATTEMPTS_STORE)
    const request = store.getAll()

    request.onerror = () => reject(request.error || new Error('Failed to read attempts'))
    request.onsuccess = () => {
      const rows = (request.result as AttemptRecord[] | undefined) || []
      rows.sort((left, right) => String(left.atIso).localeCompare(String(right.atIso)))
      resolve(rows)
    }
  })
}

function clampStars(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 0
  return Math.max(0, Math.min(5, Math.floor(parsed)))
}

export function buildLearningProfileFromAttempts(attempts: Array<{
  elapsedSeconds: number
  totalShards: number
  objectiveCompletionPercent: number
  highestStarsByType: Record<ModuleType, number>
}>): AutoplayLearningProfile {
  if (attempts.length === 0) return createNeutralProfile()

  const missingCounts: Record<ModuleType, number> = {
    Cannon: 0,
    Armor: 0,
    Generator: 0,
    Core: 0,
  }

  let bestObjectiveCompletionPercent = 0
  let bestShards = 0
  let bestElapsedSeconds = 0

  for (const attempt of attempts) {
    bestObjectiveCompletionPercent = Math.max(bestObjectiveCompletionPercent, Number(attempt.objectiveCompletionPercent) || 0)
    bestShards = Math.max(bestShards, Number(attempt.totalShards) || 0)

    const elapsed = Number(attempt.elapsedSeconds) || 0
    if (elapsed > 0 && (bestElapsedSeconds <= 0 || elapsed < bestElapsedSeconds)) {
      bestElapsedSeconds = elapsed
    }

    const stars = attempt.highestStarsByType || {
      Cannon: 0,
      Armor: 0,
      Generator: 0,
      Core: 0,
    }

    if ((Number(stars.Cannon) || 0) < 5) missingCounts.Cannon += 1
    if ((Number(stars.Armor) || 0) < 5) missingCounts.Armor += 1
    if ((Number(stars.Generator) || 0) < 5) missingCounts.Generator += 1
    if ((Number(stars.Core) || 0) < 5) missingCounts.Core += 1
  }

  const attemptsCount = attempts.length
  const toBias = (missingCount: number): number => {
    const ratio = attemptsCount > 0 ? (missingCount / attemptsCount) : 0
    return Math.max(0.8, Math.min(2.5, 1 + (ratio * 1.2)))
  }

  return {
    attempts: attemptsCount,
    typeBias: {
      Cannon: toBias(missingCounts.Cannon),
      Armor: toBias(missingCounts.Armor),
      Generator: toBias(missingCounts.Generator),
      Core: toBias(missingCounts.Core),
    },
    bestObjectiveCompletionPercent: Math.max(0, Math.min(100, Math.round(bestObjectiveCompletionPercent))),
    bestShards: Math.max(0, Math.floor(bestShards)),
    bestElapsedSeconds: Math.max(0, Math.floor(bestElapsedSeconds)),
  }
}

function computeProfile(attempts: AttemptRecord[]): AutoplayLearningProfile {
  return buildLearningProfileFromAttempts(attempts)
}

export async function loadBemergedLearningProfile(): Promise<AutoplayLearningProfile> {
  if (typeof indexedDB === 'undefined') return createNeutralProfile()

  try {
    return await withIndexedDb(async db => {
      const attempts = await getAllAttempts(db)
      return computeProfile(attempts)
    })
  } catch {
    return createNeutralProfile()
  }
}

export async function recordBemergedAttempt(input: {
  goal: AutoplayGoal
  elapsedSeconds: number
  totalShards: number
  objective: ObjectiveProgress
}): Promise<AutoplayLearningProfile> {
  if (typeof indexedDB === 'undefined') return createNeutralProfile()

  try {
    return await withIndexedDb(async db => {
      const tx = db.transaction(ATTEMPTS_STORE, 'readwrite')
      const store = tx.objectStore(ATTEMPTS_STORE)

      const now = new Date().toISOString()
      const row: AttemptRecord = {
        id: `attempt-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        atIso: now,
        goal: input.goal,
        elapsedSeconds: Math.max(0, Math.floor(Number(input.elapsedSeconds) || 0)),
        totalShards: Math.max(0, Math.floor(Number(input.totalShards) || 0)),
        objectiveCompletionPercent: Math.max(0, Math.min(100, Math.floor(Number(input.objective.completionPercent) || 0))),
        objectiveComplete: !!input.objective.objectiveComplete,
        highestStarsByType: {
          Cannon: clampStars(input.objective.highestStarsByType.Cannon),
          Armor: clampStars(input.objective.highestStarsByType.Armor),
          Generator: clampStars(input.objective.highestStarsByType.Generator),
          Core: clampStars(input.objective.highestStarsByType.Core),
        },
      }

      await new Promise<void>((resolve, reject) => {
        const request = store.put(row)
        request.onerror = () => reject(request.error || new Error('Failed to store attempt'))
        request.onsuccess = () => resolve()
      })

      await new Promise<void>((resolve, reject) => {
        tx.onerror = () => reject(tx.error || new Error('Failed to commit attempt transaction'))
        tx.oncomplete = () => resolve()
      })

      const attempts = await getAllAttempts(db)
      if (attempts.length > MAX_ATTEMPTS) {
        const overflow = attempts.length - MAX_ATTEMPTS
        const pruneTx = db.transaction(ATTEMPTS_STORE, 'readwrite')
        const pruneStore = pruneTx.objectStore(ATTEMPTS_STORE)
        for (let index = 0; index < overflow; index += 1) {
          pruneStore.delete(attempts[index].id)
        }
        await new Promise<void>((resolve, reject) => {
          pruneTx.onerror = () => reject(pruneTx.error || new Error('Failed to prune old attempts'))
          pruneTx.oncomplete = () => resolve()
        })
      }

      const refreshed = await getAllAttempts(db)
      return computeProfile(refreshed.slice(-MAX_ATTEMPTS))
    })
  } catch {
    return createNeutralProfile()
  }
}
