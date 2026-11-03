import { useCallback, useEffect, useRef, useState } from 'react'
import type { Profile, WeightEntry } from '../types'
import * as db from './db'
import { isEntryList, isProfileOrNull } from './storage'
import { sortByDate } from './trends'

/**
 * Keeps the user's profile and weigh-ins in sync with Supabase.
 *
 * - Offline-first: changes are applied on screen immediately, saved to a local cache,
 *   and queued. The queue is sent to Supabase as soon as there is a connection.
 * - On start-up (and when the app comes back into focus) the latest data is fetched,
 *   so changes made on another device show up.
 */

type Op =
  | { kind: 'saveProfile'; profile: Profile }
  | { kind: 'saveEntry'; entry: WeightEntry }
  | { kind: 'deleteEntry'; id: string }
  | { kind: 'deleteAll' }

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error'

type Snapshot = { profile: Profile | null; entries: WeightEntry[] }

const cacheKey = (userId: string) => `flowhealth:v2:cache:${userId}`
const queueKey = (userId: string) => `flowhealth:v2:queue:${userId}`
const LEGACY = { profile: 'flowhealth:v1:profile', entries: 'flowhealth:v1:entries', migrated: 'flowhealth:v1:migrated' }

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Storage full or blocked: the queue still lives in memory for this session.
  }
}

function readCache(userId: string): Snapshot | null {
  const cached = read<unknown>(cacheKey(userId), null)
  if (!cached || typeof cached !== 'object') return null
  const { profile, entries } = cached as Snapshot
  return isProfileOrNull(profile) && isEntryList(entries) ? { profile, entries } : null
}

/** Data saved by the earlier, local-only version of the app on this device. */
function readLegacy(): Snapshot | null {
  if (read<string | null>(LEGACY.migrated, null)) return null
  const profile = read<unknown>(LEGACY.profile, null)
  const entries = read<unknown>(LEGACY.entries, [])
  if (!isProfileOrNull(profile) || !isEntryList(entries)) return null
  if (!profile && entries.length === 0) return null
  return { profile, entries }
}

function isNetworkError(error: unknown) {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return true
  const message = error instanceof Error ? error.message : String((error as { message?: string })?.message ?? error)
  return /fetch|network|load failed|timed? ?out/i.test(message)
}

function describe(error: unknown) {
  return error instanceof Error ? error.message : String((error as { message?: string })?.message ?? 'Unknown error')
}

async function runOp(userId: string, op: Op) {
  switch (op.kind) {
    case 'saveProfile':
      return db.saveProfile(userId, op.profile)
    case 'saveEntry':
      return db.saveEntry(userId, op.entry)
    case 'deleteEntry':
      return db.deleteEntry(op.id)
    case 'deleteAll':
      return db.deleteAllData()
  }
}

export function useCloudData(userId: string) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(() => readCache(userId))
  const [loading, setLoading] = useState(snapshot === null)
  const [status, setStatus] = useState<SyncStatus>('synced')
  const [error, setError] = useState<string | null>(null)
  const [imported, setImported] = useState<number | null>(null)

  const queue = useRef<Op[]>(read<Op[]>(queueKey(userId), []))
  const flushing = useRef(false)

  const persistQueue = () => write(queueKey(userId), queue.current)

  /** Apply a change locally and remember it in the cache. */
  const commitLocal = useCallback(
    (update: (s: Snapshot) => Snapshot) => {
      setSnapshot((prev) => {
        const next = update(prev ?? { profile: null, entries: [] })
        write(cacheKey(userId), next)
        return next
      })
    },
    [userId],
  )

  /** Send queued changes to Supabase, oldest first. Returns true when the queue is empty. */
  const flush = useCallback(async () => {
    if (flushing.current) return queue.current.length === 0
    flushing.current = true
    try {
      while (queue.current.length > 0) {
        setStatus('saving')
        const op = queue.current[0]!
        try {
          await runOp(userId, op)
        } catch (e) {
          if (isNetworkError(e)) {
            setStatus('offline')
            return false
          }
          // A rejected change (e.g. invalid value) would block the queue forever: drop it and report.
          setError(`A change could not be saved: ${describe(e)}`)
        }
        queue.current = queue.current.slice(1)
        persistQueue()
      }
      setStatus('synced')
      return true
    } finally {
      flushing.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const enqueue = useCallback(
    (...ops: Op[]) => {
      queue.current = [...queue.current, ...ops]
      persistQueue()
      void flush()
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flush],
  )

  /** Push pending changes, then load the latest data from Supabase. */
  const refresh = useCallback(async () => {
    const empty = await flush()
    if (!empty) {
      setLoading(false)
      return
    }
    try {
      const remote = await db.fetchAll()
      const legacy = !remote.profile && remote.entries.length === 0 ? readLegacy() : null
      if (legacy) {
        // First sign-in on a device that already has local data: upload it.
        commitLocal(() => ({ profile: legacy.profile, entries: sortByDate(legacy.entries) }))
        const ops: Op[] = [
          ...(legacy.profile ? [{ kind: 'saveProfile', profile: legacy.profile } as Op] : []),
          ...legacy.entries.map((entry) => ({ kind: 'saveEntry', entry }) as Op),
        ]
        write(LEGACY.migrated, userId)
        setImported(legacy.entries.length)
        enqueue(...ops)
      } else if (queue.current.length === 0) {
        commitLocal(() => remote)
      }
      setError(null)
    } catch (e) {
      if (isNetworkError(e)) setStatus('offline')
      else setError(`Could not load your data: ${describe(e)}`)
    } finally {
      setLoading(false)
    }
  }, [flush, commitLocal, enqueue, userId])

  useEffect(() => {
    void refresh()
    const onOnline = () => void refresh()
    const onVisible = () => document.visibilityState === 'visible' && void refresh()
    window.addEventListener('online', onOnline)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('online', onOnline)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [refresh])

  // --- Actions used by the UI ---

  const setProfile = useCallback(
    (profile: Profile) => {
      commitLocal((s) => ({ ...s, profile }))
      enqueue({ kind: 'saveProfile', profile })
    },
    [commitLocal, enqueue],
  )

  const upsertEntry = useCallback(
    (entry: WeightEntry) => {
      commitLocal((s) => ({ ...s, entries: sortByDate([...s.entries.filter((e) => e.date !== entry.date), entry]) }))
      enqueue({ kind: 'saveEntry', entry })
    },
    [commitLocal, enqueue],
  )

  const removeEntry = useCallback(
    (id: string) => {
      commitLocal((s) => ({ ...s, entries: s.entries.filter((e) => e.id !== id) }))
      enqueue({ kind: 'deleteEntry', id })
    },
    [commitLocal, enqueue],
  )

  const removeAll = useCallback(() => {
    commitLocal(() => ({ profile: null, entries: [] }))
    // Earlier queued changes are pointless once everything is deleted.
    queue.current = []
    enqueue({ kind: 'deleteAll' })
  }, [commitLocal, enqueue])

  /** Remove this user's cached data from the device (on sign-out). */
  const clearDevice = useCallback(() => {
    try {
      localStorage.removeItem(cacheKey(userId))
      localStorage.removeItem(queueKey(userId))
    } catch {
      // ignore
    }
  }, [userId])

  return {
    profile: snapshot?.profile ?? null,
    entries: snapshot?.entries ?? [],
    loading,
    status,
    pendingChanges: queue.current.length,
    error,
    dismissError: () => setError(null),
    imported,
    dismissImported: () => setImported(null),
    setProfile,
    upsertEntry,
    removeEntry,
    removeAll,
    clearDevice,
  }
}
