export type View = 'today' | 'trends' | 'plan' | 'insights'

export type ActivityLevel = 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extremely Active'

export type Sex = 'Female' | 'Male'

export type Profile = {
  name: string
  bmr: number
  activity: ActivityLevel
  /** Optional when BMR is measured (e.g. InBody) rather than estimated. */
  age: number | null
  sex: Sex | null
  height: number | null
  /** Weight entered during onboarding. The latest weigh-in takes precedence once one exists. */
  currentWeight: number
  targetWeight: number
  /** Daily kcal adjustment relative to maintenance (e.g. -500). */
  adjustment: number
}

/** One body-weight measurement. This is the record that later maps to openEHR and FHIR. */
export type WeightEntry = {
  id: string
  /** Local calendar date, YYYY-MM-DD. One entry per date. */
  date: string
  weightKg: number
  note?: string
  /** ISO timestamp of when the entry was saved. */
  loggedAt: string
}
