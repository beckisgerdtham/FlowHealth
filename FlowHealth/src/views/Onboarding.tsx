import { useState } from 'react'
import type { Profile, Sex } from '../types'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { NumberInput } from '../components/NumberInput'
import { formatMonthYearShort, formatWeeks } from '../lib/format'
import {
  activityLevels,
  activityMultipliers,
  calculateHealth,
  defaultAdjustment,
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

export function Onboarding({
  profile,
  onComplete,
  onCancel,
}: {
  profile: Profile
  onComplete: (profile: Profile) => void
  /** Present when editing an existing profile. */
  onCancel?: () => void
}) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'measured' | 'estimated'>('measured')
  const [draft, setDraft] = useState(profile)
  const calculatedBmr = estimateBmr(draft)
  const effectiveBmr = mode === 'measured' ? draft.bmr : calculatedBmr
  const preview = calculateHealth({ ...draft, bmr: effectiveBmr })
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft({ ...draft, [key]: value })
  const canContinue = step !== 1 || draft.name.trim().length > 0

  function next() {
    if (step === 1) {
      // Make sure the plan points in the same direction as the goal.
      const dir = goalDirection(draft.currentWeight, draft.targetWeight)
      if (Math.sign(draft.adjustment) !== dir) {
        setDraft({ ...draft, adjustment: defaultAdjustment(draft.currentWeight, draft.targetWeight) })
      }
    }
    if (step < 4) setStep(step + 1)
    else onComplete({ ...draft, name: draft.name.trim(), bmr: effectiveBmr })
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
                  <NumberInput value={draft.currentWeight} min={20} max={400} onChange={(v) => update('currentWeight', v)} />
                  <small>kg</small>
                </div>
              </label>
              <span className="weight-direction">
                <Icon name="arrow" />
              </span>
              <label className="onboarding-field">
                <span>Target weight</span>
                <div>
                  <NumberInput value={draft.targetWeight} min={20} max={400} onChange={(v) => update('targetWeight', v)} />
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
                  <NumberInput value={draft.bmr} min={500} max={6000} onChange={(v) => update('bmr', Math.round(v))} />
                  <small>kcal</small>
                </div>
              </label>
            ) : (
              <div className="onboarding-grid">
                <label>
                  <span>Age</span>
                  <NumberInput value={draft.age} min={10} max={120} onChange={(v) => update('age', Math.round(v))} />
                </label>
                <label>
                  <span>Sex</span>
                  <select value={draft.sex} onChange={(event) => update('sex', event.target.value as Sex)}>
                    <option>Female</option>
                    <option>Male</option>
                  </select>
                </label>
                <label>
                  <span>Height</span>
                  <div>
                    <NumberInput value={draft.height} min={50} max={250} onChange={(v) => update('height', v)} />
                    <small>cm</small>
                  </div>
                </label>
                <label>
                  <span>Weight</span>
                  <div>
                    <NumberInput value={draft.currentWeight} min={20} max={400} onChange={(v) => update('currentWeight', v)} />
                    <small>kg</small>
                  </div>
                </label>
              </div>
            )}
            <div className="bmr-result">
              <span>Baseline metabolism</span>
              <strong>{effectiveBmr.toLocaleString('en-GB')} kcal/day</strong>
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

        {step === 4 && (
          <>
            <div className="review-hero">
              <span>Recommended target</span>
              <strong>
                {preview.targetCalories.toLocaleString('en-GB')} <small>kcal/day</small>
              </strong>
              <p>
                {planLabel(draft.adjustment)} · {Math.abs(preview.weeklyChange).toFixed(1)} kg per week
              </p>
            </div>
            <div className="review-grid">
              <div>
                <span>Current</span>
                <strong>{draft.currentWeight} kg</strong>
              </div>
              <div>
                <span>Goal</span>
                <strong>{draft.targetWeight} kg</strong>
              </div>
              <div>
                <span>BMR</span>
                <strong>{effectiveBmr.toLocaleString('en-GB')}</strong>
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
            <p className="bmr-explainer">
              Maintenance Calories represent estimated daily calories needed to maintain current weight. You can change your plan
              any time under Plan.
            </p>
          </>
        )}

        <div className="onboarding-actions">
          {step > 1 && (
            <button className="back-button" onClick={() => setStep(step - 1)}>
              Back
            </button>
          )}
          <button className="primary-button onboarding-continue" disabled={!canContinue} onClick={next}>
            {step === 4 ? (onCancel ? 'Save changes' : 'Start using FlowHealth') : 'Continue'} <Icon name="arrow" />
          </button>
        </div>
        {onCancel && (
          <button className="skip-button" onClick={onCancel}>
            Cancel
          </button>
        )}
      </section>
    </div>
  )
}
