import type { ActivityLevel, Profile, Sex, WeightEntry } from '../types'
import { supabase } from './supabase'

/** Database rows use snake_case; the app uses camelCase. These map between them. */
type ProfileRow = {
  name: string
  bmr: number
  activity: ActivityLevel
  age: number | null
  sex: Sex | null
  height: number | null
  current_weight: number
  target_weight: number
  adjustment: number
}

type EntryRow = {
  id: string
  date: string
  weight_kg: number
  note: string | null
  logged_at: string
}

const toProfile = (r: ProfileRow): Profile => ({
  name: r.name,
  bmr: Number(r.bmr),
  activity: r.activity,
  age: r.age === null ? null : Number(r.age),
  sex: r.sex,
  height: r.height === null ? null : Number(r.height),
  currentWeight: Number(r.current_weight),
  targetWeight: Number(r.target_weight),
  adjustment: Number(r.adjustment),
})

const fromProfile = (p: Profile): ProfileRow => ({
  name: p.name,
  bmr: p.bmr,
  activity: p.activity,
  age: p.age,
  sex: p.sex,
  height: p.height,
  current_weight: p.currentWeight,
  target_weight: p.targetWeight,
  adjustment: p.adjustment,
})

const toEntry = (r: EntryRow): WeightEntry => ({
  id: r.id,
  date: r.date,
  weightKg: Number(r.weight_kg),
  note: r.note ?? undefined,
  loggedAt: r.logged_at,
})

const fromEntry = (e: WeightEntry): EntryRow => ({
  id: e.id,
  date: e.date,
  weight_kg: e.weightKg,
  note: e.note ?? null,
  logged_at: e.loggedAt,
})

/** Row Level Security makes every query return only the signed-in user's rows. */
export async function fetchAll() {
  const [profileRes, entriesRes] = await Promise.all([
    supabase.from('profiles').select('*').maybeSingle(),
    supabase.from('weight_entries').select('id, date, weight_kg, note, logged_at').order('date'),
  ])
  if (profileRes.error) throw profileRes.error
  if (entriesRes.error) throw entriesRes.error
  return {
    profile: profileRes.data ? toProfile(profileRes.data as ProfileRow) : null,
    entries: (entriesRes.data as EntryRow[]).map(toEntry),
  }
}

export async function saveProfile(userId: string, profile: Profile) {
  const { error } = await supabase
    .from('profiles')
    .upsert({ user_id: userId, ...fromProfile(profile), updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  if (error) throw error
}

export async function saveEntry(userId: string, entry: WeightEntry) {
  // One weigh-in per date: a new entry on an existing date replaces it.
  const { error } = await supabase
    .from('weight_entries')
    .upsert({ user_id: userId, ...fromEntry(entry) }, { onConflict: 'user_id,date' })
  if (error) throw error
}

export async function deleteEntry(id: string) {
  const { error } = await supabase.from('weight_entries').delete().eq('id', id)
  if (error) throw error
}

export async function deleteAllData() {
  const entries = await supabase.from('weight_entries').delete().not('id', 'is', null)
  if (entries.error) throw entries.error
  const profile = await supabase.from('profiles').delete().not('user_id', 'is', null)
  if (profile.error) throw profile.error
}
