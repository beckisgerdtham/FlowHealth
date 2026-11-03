import { useEffect, useState } from 'react'
import type { Profile, WeightEntry } from '../types'

/**
 * State that is saved in the browser's localStorage, so it survives a reload.
 * Note: localStorage only lives in this browser on this device. It is a stand-in
 * until the app has a real backend (e.g. an openEHR server).
 */
export function usePersistentState<T>(key: string, initial: T, validate: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        const parsed: unknown = JSON.parse(raw)
        if (validate(parsed)) return parsed
      }
    } catch {
      // Storage unavailable or corrupt — fall back to the initial value.
    }
    return initial
  })

  useEffect(() => {
    try {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore write errors (private mode, quota, etc.).
    }
  }, [key, value])

  return [value, setValue] as const
}

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null

export function isProfileOrNull(v: unknown): v is Profile | null {
  if (v === null) return true
  return (
    isObject(v) &&
    typeof v.name === 'string' &&
    typeof v.bmr === 'number' &&
    typeof v.currentWeight === 'number' &&
    typeof v.targetWeight === 'number' &&
    typeof v.adjustment === 'number'
  )
}

export function isEntryList(v: unknown): v is WeightEntry[] {
  return (
    Array.isArray(v) &&
    v.every((e) => isObject(e) && typeof e.id === 'string' && typeof e.date === 'string' && typeof e.weightKg === 'number')
  )
}

export function newId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  }
}
