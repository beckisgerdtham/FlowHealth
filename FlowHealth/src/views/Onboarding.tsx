import { useState } from 'react'
import type { ActivityLevel, Profile, Sex } from '../types'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { NumberInput } from '../components/NumberInput'
import { formatMonthYearShort, formatWeeks } from '../lib/format'
import {
  activityLevels,
  activityMultipliers,
  calculateHealth,
  defaultAdjustment,
  safeAdjustment,
  estimateBmr,
  goalDirection,
  planLabel,
} from '../lib/health'

const titles = ['Set your weight goal', 'Add your metabolism', 'Choose your activity', 'Your calorie plan']
const descriptions = [
  'Tell us where you are today and where you want to go.',
  'Use a measured BMR for the most personalized starting point, or let FlowHealth estimate it.',
  'Select the option that best reflects a typical week.',
  'Review your science-based starting targets before continuing.',
]

/** Like Profile, but every field can still be empty while the user fills it in. */
type Draft = {
  name: string
  currentWeight: number | null
  targetWeight: number | null
  bmr: number | null
  age: number | null
  sex: Sex | null
  height: number | null
  activity: ActivityLevel | null
  adjustment: number
}

const emptyDraft: Draft = {
  name: '',
  currentWeight: null,
  targetWeight: null,
  bmr: null,
  age: null,
  sex: null,
  height: null,
  activity: null,
  adjustment: 0,
}

export function Onboarding({
  profile,
  onComplete,
  onCancel,
  onSignOut,
}: {
  /** null for a new user (empty form); a profile when editing. */
  profile: Profile | null
  onComplete: (profile: Profile) => void
  onCancel?: () => void
  onSignOut?: () => void
}) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'measured' | 'estimated'>('measured')
  const [draft, setDraft] = useState<Draft>(profile ? { ...profile } : emptyDraft)
  /** Set when the plan was made milder to stay above the safe minimum. */
  const [adjustedFrom, setAdjustedFrom] = useState<number | null>(null)
  const update = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }))

  const calculatedBmr = estimateBmr(draft)
  const effectiveBmr = mode === 'measured' ? draft.bmr : calculatedBmr

  // A complete profile exists once every required step is filled in.
  const complete: Profile | null =
    draft.name.trim() && draft.currentWeight !== null && draft.targetWeight !== null && effectiveBmr !== null && draft.activity
      ? {
          ...draft,
          name: draft.name.trim(),
          currentWeight: draft.currentWeight,
          targetWeight: draft.targetWeight,
          bmr: effectiveBmr,
          activity: draft.activity,
        }
      : null
  const preview = complete ? calculateHealth(complete) : null

  const stepValid = [
    draft.name.trim().length > 0 && draft.currentWeight !== null && draft.targetWeight !== null,
    effectiveBmr !== null,
    draft.activity !== null,
    complete !== null,
  ][step - 1]
  const missingHint = [
    'Fill in your name, current weight and target weight.',
    mode === 'measured' ? 'Enter your BMR, or switch to Calculate BMR.' : 'Fill in age, sex, height and weight.',
    'Choose an activity level.',
    '',
  ][step - 1]

  function next() {
    if (!stepValid) return
    if (step === 1 && draft.currentWeight !== null && draft.targetWeight !== null) {
      // Make sure the plan points in the same direction as the goal.
      const dir = goalDirection(draft.currentWeight, draft.targetWeight)
      if (Math.sign(draft.adjustment) !== dir) update('adjustment', defaultAdjustment(draft.currentWeight, draft.targetWeight))
    }
    if (step === 3 && complete) {
      const safe = safeAdjustment(complete)
      setAdjustedFrom(safe !== complete.adjustment ? complete.adjustment : null)
      if (safe !== complete.adjustment) update('adjustment', safe)
    }
    if (step < 4) setStep(step + 1)
    else if (complete) onComplete(complete)
  }

  return (
    <div className="onboarding-backdrop">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="onboarding-top">
          <Brand />
          <span>Step {step} of 4</span>
        </div>
        <div className="onboarding-progress" aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map((item) => (
            <span className={item <= step ? 'active' : ''} key={item} />
          ))}
        </div>
        <p className="eyebrow">PERSONALIZE FLOWHEALTH</p>
        <p className="onboarding-title" id="onboarding-title">
          {titles[step - 1]}
        </p>
        <p className="onboarding-copy">{descriptions[step - 1]}</p>

        {step === 1 && (
          <>
            <label className="onboarding-field">
              <span>Your name</span>
              <input value={draft.name} placeholder="First name" onChange={(event) => update('name', event.target.value)} />
            </label>
            <div className="onboarding-weight-fields">
              <label className="onboarding-field">
                <span>Current weight</span>
                <div>
                  <NumberInput
                    value={draft.currentWeight}
                    min={20}
                    max={400}
                    placeholder="e.g. 72.5"
                    onChange={(v) => update('currentWeight', v)}
                    onEmpty={() => update('currentWeight', null)}
                  />
                  <small>kg</small>
                </div>
              </label>
              <span className="weight-direction">
                <Icon name="arrow" />
              </span>
              <label className="onboarding-field">
                <span>Target weight</span>
                <div>
                  <NumberInput
                    value={draft.targetWeight}
                    min={20}
                    max={400}
                    placeholder="e.g. 68"
                    onChange={(v) => update('targetWeight', v)}
                    onEmpty={() => update('targetWeight', null)}
                  />
                  <small>kg</small>
                </div>
              </label>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="source-tabs">
              <button className={mode === 'measured' ? 'active' : ''} onClick={() => setMode('measured')}>
                <Icon name="data" />
                <span>
                  <strong>Enter BMR</strong>
                  <small>InBody or body scan</small>
                </span>
              </button>
              <button className={mode === 'estimated' ? 'active' : ''} onClick={() => setMode('estimated')}>
                <Icon name="spark" />
                <span>
                  <strong>Calculate BMR</strong>
                  <small>From your details</small>
                </span>
              </button>
            </div>
            {mode === 'measured' ? (
              <label className="onboarding-field">
                <span>
                  BMR <small>kcal/day</small>
                </span>
                <div>
                  <NumberInput
                    value={draft.bmr}
                    min={500}
                    max={6000}
                    placeholder="e.g. 1500"
                    onChange={(v) => update('bmr', Math.round(v))}
                    onEmpty={() => update('bmr', null)}
                  />
                  <small>kcal</small>
                </div>
              </label>
            ) : (
              <div className="onboarding-grid">
                <label>
                  <span>Age</span>
                  <NumberInput
                    value={draft.age}
                    min={10}
                    max={120}
                    placeholder="Years"
                    onChange={(v) => update('age', Math.round(v))}
                    onEmpty={() => update('age', null)}
                  />
                </label>
                <label>
                  <span>Sex</span>
                  <select value={draft.sex ?? ''} onChange={(event) => update('sex', (event.target.value || null) as Sex | null)}>
                    <option value="" disabled>
                      Select
                    </option>
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </label>
                <label>
                  <span>Height</span>
                  <div>
                    <NumberInput
                      value={draft.height}
                      min={50}
                      max={250}
                      placeholder="—"
                      onChange={(v) => update('height', v)}
                      onEmpty={() => update('height', null)}
                    />
                    <small>cm</small>
                  </div>
                </label>
                <label>
                  <span>Weight</span>
                  <div>
                    <NumberInput
                      value={draft.currentWeight}
                      min={20}
                      max={400}
                      placeholder="—"
                      onChange={(v) => update('currentWeight', v)}
                      onEmpty={() => update('currentWeight', null)}
                    />
                    <small>kg</small>
                  </div>
                </label>
              </div>
            )}
            <div className="bmr-result">
              <span>Baseline metabolism</span>
              <strong>{effectiveBmr !== null ? `${effectiveBmr.toLocaleString('en-GB')} kcal/day` : '—'}</strong>
            </div>
            <p className="bmr-explainer">BMR is the number of calories your body needs at complete rest.</p>
          </>
        )}

        {step === 3 && (
          <div className="activity-list">
            {activityLevels.map((item) => (
              <button className={draft.activity === item ? 'active' : ''} onClick={() => update('activity', item)} key={item}>
                <span className="radio-dot">
                  <i />
                </span>
                <span>
                  <strong>{item}</strong>
                  <small>
                    {item === 'Moderately Active' ? 'Training 3–5 days per week' : `${activityMultipliers[item]} activity multiplier`}
                  </small>
                </span>
                <b>× {activityMultipliers[item]}</b>
              </button>
            ))}
          </div>
        )}

        {step === 4 && complete && preview && (
          <>
            <div className="review-hero">
              <span>Recommended target</span>
              <strong>
                {preview.targetCalories.toLocaleString('en-GB')} <small>kcal/day</small>
              </strong>
              <p>
                {planLabel(complete.adjustment)} · {Math.abs(preview.weeklyChange).toFixed(1)} kg per week
              </p>
            </div>
            <div className="review-grid">
              <div>
                <span>Current</span>
                <strong>{complete.currentWeight} kg</strong>
              </div>
              <div>
                <span>Goal</span>
                <strong>{complete.targetWeight} kg</strong>
              </div>
              <div>
                <span>BMR</span>
                <strong>{complete.bmr.toLocaleString('en-GB')}</strong>
              </div>
              <div>
                <span>Maintenance</span>
                <strong>{preview.tdee.toLocaleString('en-GB')}</strong>
              </div>
              <div>
                <span>Time remaining</span>
                <strong>{formatWeeks(preview.weeks)}</strong>
              </div>
              <div>
                <span>Goal date</span>
                <strong>{formatMonthYearShort(preview.goalDate)}</strong>
              </div>
            </div>
            {adjustedFrom !== null && (
              <p className="safety-note">
                We chose {planLabel(complete.adjustment)} instead of {planLabel(adjustedFrom)} so your target stays at or above your
                safe minimum of {preview.minimum.toLocaleString('en-GB')} kcal/day.
              </p>
            )}
            <p className="bmr-explainer">
              Maintenance Calories represent estimated daily calories needed to maintain current weight. You can change your plan
              any time under Plan.
            </p>
          </>
        )}

        {!stepValid && missingHint && <p className="onboarding-hint">{missingHint}</p>}

        <div className="onboarding-actions">
          {step > 1 && (
            <button className="back-button" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button className="primary-button onboarding-continue" disabled={!stepValid} onClick={next}>
            {step === 4 ? (onCancel ? 'Save changes' : 'Start using FlowHealth') : 'Continue'} <Icon name="arrow" />
          </button>
        </div>
        {onCancel && (
          <button className="skip-button" onClick={onCancel}>
            Cancel
          </button>
        )}
        {!onCancel && onSignOut && (
          <button className="skip-button" onClick={onSignOut}>
            Sign out
          </button>
        )}
      </section>
    </div>
  )
}
