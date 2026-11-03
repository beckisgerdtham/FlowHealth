import { useState } from 'react'
import type { ActivityLevel, Profile, Sex } from '../types'
import { Icon } from '../components/Icon'
import { NumberInput } from '../components/NumberInput'
import { formatMonthYear, formatWeeks } from '../lib/format'
import { activityLevels, activityMultipliers, calculateHealth, caloriePlans, estimateBmr } from '../lib/health'

export function Planner({
  profile,
  entryCount,
  onChange,
  onLoadSample,
  onReset,
}: {
  profile: Profile
  entryCount: number
  onChange: (profile: Profile) => void
  onLoadSample: () => void
  onReset: () => void
}) {
  const health = calculateHealth(profile)
  const [confirmReset, setConfirmReset] = useState(false)
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => onChange({ ...profile, [key]: value })

  return (
    <>
      <section className="page-head">
        <p className="eyebrow">PERSONAL PLAN</p>
        <p className="screen-title">Goal planner</p>
        <p className="screen-copy">A healthy plan, calculated around you.</p>
      </section>
      <section className="plan-result">
        <span className="tiny-label">YOUR DAILY TARGET</span>
        <div className="calorie-result">
          {health.targetCalories.toLocaleString('en-GB')} <small>kcal</small>
        </div>
        <p>
          {health.atGoal
            ? 'You’re at your goal weight'
            : health.movingTowardGoal
              ? `${Math.abs(health.weeklyChange).toFixed(1)} kg per week · ${formatWeeks(health.weeks)} remaining`
              : `This plan won’t move you toward ${profile.targetWeight} kg`}
        </p>
        <div className="plan-stats">
          <div>
            <span>Maintenance</span>
            <strong>{health.tdee.toLocaleString('en-GB')} kcal</strong>
          </div>
          <div>
            <span>Goal date</span>
            <strong>{formatMonthYear(health.goalDate)}</strong>
          </div>
        </div>
      </section>

      <section className="energy-foundation">
        <div className="energy-card">
          <span className="metric-icon mint">
            <Icon name="spark" />
          </span>
          <span>BMR</span>
          <strong>{profile.bmr.toLocaleString('en-GB')}</strong>
          <small>kcal at complete rest</small>
        </div>
        <div className="energy-connector">
          <Icon name="close" />
          <small>{activityMultipliers[profile.activity]}</small>
        </div>
        <div className="energy-card emphasized">
          <span className="metric-icon sand">
            <Icon name="flame" />
          </span>
          <span>Maintenance</span>
          <strong>{health.tdee.toLocaleString('en-GB')}</strong>
          <small>kcal per day</small>
        </div>
      </section>
      <div className="explanation-card">
        <p>
          <strong>BMR</strong> is the number of calories your body needs at complete rest.
        </p>
        <p>
          <strong>Maintenance Calories</strong> represent estimated daily calories needed to maintain current weight.
        </p>
      </div>

      <p className="section-label">CHOOSE YOUR CALORIE TARGET</p>
      <section className="calorie-options">
        {caloriePlans.map((plan) => {
          const selected = profile.adjustment === plan.adjustment
          return (
            <button
              className={`${plan.tone} ${selected ? 'selected' : ''}`}
              key={plan.label}
              onClick={() => set('adjustment', plan.adjustment)}
            >
              <span className="calorie-plan-dot" />
              <span>
                <strong>{plan.label}</strong>
                <small>
                  {plan.adjustment > 0 ? '+' : ''}
                  {plan.adjustment} kcal
                </small>
              </span>
              <b>{(health.tdee + plan.adjustment).toLocaleString('en-GB')}</b>
              {selected && <Icon name="check" />}
            </button>
          )
        })}
      </section>

      <section className="content-card planner-form">
        <div className="card-heading">
          <div>
            <p className="card-title">Your details</p>
            <p className="card-subtitle">Used to personalize your energy target</p>
          </div>
        </div>
        <div className="form-grid">
          <label>
            <span>BMR</span>
            <div>
              <NumberInput value={profile.bmr} min={500} max={6000} onChange={(v) => set('bmr', Math.round(v))} />
              <small>kcal</small>
            </div>
          </label>
          <label>
            <span>Activity level</span>
            <select value={profile.activity} onChange={(event) => set('activity', event.target.value as ActivityLevel)}>
              {activityLevels.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            <span>Current weight</span>
            <div className="static-field">
              <strong>{profile.currentWeight.toFixed(1)}</strong>
              <small>kg · latest log</small>
            </div>
          </label>
          <label>
            <span>Target weight</span>
            <div>
              <NumberInput value={profile.targetWeight} min={20} max={400} onChange={(v) => set('targetWeight', v)} />
              <small>kg</small>
            </div>
          </label>
          <label>
            <span>Height</span>
            <div>
              <NumberInput value={profile.height} min={50} max={250} onChange={(v) => set('height', v)} />
              <small>cm</small>
            </div>
          </label>
          <label>
            <span>Age</span>
            <div>
              <NumberInput value={profile.age} min={10} max={120} onChange={(v) => set('age', Math.round(v))} />
              <small>years</small>
            </div>
          </label>
          <label>
            <span>Sex</span>
            <select value={profile.sex} onChange={(event) => set('sex', event.target.value as Sex)}>
              <option>Female</option>
              <option>Male</option>
            </select>
          </label>
        </div>
        <button className="estimate-button" onClick={() => set('bmr', estimateBmr(profile))}>
          Estimate BMR from my details
        </button>
      </section>

      <section className="content-card data-card">
        <div className="card-heading">
          <div>
            <p className="card-title">Your data</p>
            <p className="card-subtitle">
              {entryCount} weigh-in{entryCount === 1 ? '' : 's'} · stored only in this browser
            </p>
          </div>
        </div>
        <button className="estimate-button" onClick={onLoadSample}>
          Load sample data (replaces weigh-ins)
        </button>
        <button
          className={`danger-button ${confirmReset ? 'confirm' : ''}`}
          onClick={() => {
            if (confirmReset) onReset()
            else setConfirmReset(true)
          }}
          onBlur={() => setConfirmReset(false)}
        >
          {confirmReset ? 'Tap again to delete everything' : 'Reset all data'}
        </button>
      </section>
      <p className="medical-note">Estimates are for general wellness and are not medical advice.</p>
    </>
  )
}
