import { useState } from 'react'
import type { ActivityLevel, Profile, Sex } from '../types'
import { Icon } from '../components/Icon'
import { NumberInput } from '../components/NumberInput'
import { formatMonthYear, formatWeeks } from '../lib/format'
import { activityLevels, activityMultipliers, calculateHealth, caloriePlans, estimateBmr, isSafeAdjustment, planLabel, safeAdjustment } from '../lib/health'

export function Planner({
  profile,
  entryCount,
  email,
  syncLabel,
  onChange,
  onReset,
  onSignOut,
}: {
  profile: Profile
  entryCount: number
  email: string
  syncLabel: string
  onChange: (profile: Profile) => void
  onReset: () => void
  onSignOut: () => void
}) {
  const health = calculateHealth(profile)
  const [confirmReset, setConfirmReset] = useState(false)
  const set = <K extends keyof Profile>(key: K, value: Profile[K]) => onChange({ ...profile, [key]: value })
  const suggested = safeAdjustment(profile)

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

      {health.belowMinimum && (
        <div className="safety-warning" role="alert">
          <strong>Your daily target is too low</strong>
          <p>
            {health.targetCalories.toLocaleString('en-GB')} kcal is below your safe minimum of {health.minimum.toLocaleString('en-GB')} kcal
            (your BMR, and never under {profile.sex === 'Male' ? '1,500' : '1,200'} kcal). Eating this little can cost muscle and
            energy and is hard to sustain.
          </p>
          <button onClick={() => set('adjustment', suggested)}>Switch to {planLabel(suggested)}</button>
        </div>
      )}

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
      <p className="section-note">Plans below {health.minimum.toLocaleString('en-GB')} kcal/day are locked to keep your target at or above your BMR.</p>
      <section className="calorie-options">
        {!caloriePlans.some((plan) => plan.adjustment === profile.adjustment) && (
          <button className="sage selected" onClick={() => undefined}>
            <span className="calorie-plan-dot" />
            <span>
              <strong>{planLabel(profile.adjustment)}</strong>
              <small>{profile.adjustment} kcal · sized to your minimum</small>
            </span>
            <b>{health.targetCalories.toLocaleString('en-GB')}</b>
            <Icon name="check" />
          </button>
        )}
        {caloriePlans.map((plan) => {
          const selected = profile.adjustment === plan.adjustment
          const safe = isSafeAdjustment(profile, plan.adjustment)
          return (
            <button
              className={`${plan.tone} ${selected ? 'selected' : ''} ${safe ? '' : 'unsafe'}`}
              key={plan.label}
              disabled={!safe && !selected}
              title={safe ? undefined : 'Below your safe minimum'}
              onClick={() => set('adjustment', plan.adjustment)}
            >
              <span className="calorie-plan-dot" />
              <span>
                <strong>{plan.label}</strong>
                <small>
                  {safe ? `${plan.adjustment > 0 ? '+' : ''}${plan.adjustment} kcal` : 'Below your safe minimum'}
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
              <NumberInput value={profile.height} min={50} max={250} placeholder="—" onChange={(v) => set('height', v)} onEmpty={() => set('height', null)} />
              <small>cm</small>
            </div>
          </label>
          <label>
            <span>Age</span>
            <div>
              <NumberInput value={profile.age} min={10} max={120} placeholder="—" onChange={(v) => set('age', Math.round(v))} onEmpty={() => set('age', null)} />
              <small>years</small>
            </div>
          </label>
          <label>
            <span>Sex</span>
            <select value={profile.sex ?? ''} onChange={(event) => set('sex', (event.target.value || null) as Sex | null)}>
              <option value="">Select</option>
              <option>Female</option>
              <option>Male</option>
            </select>
          </label>
        </div>
        {(() => {
          const estimate = estimateBmr(profile)
          return (
            <button className="estimate-button" disabled={estimate === null} onClick={() => estimate !== null && set('bmr', estimate)}>
              {estimate === null ? 'Add height, age and sex to estimate BMR' : `Estimate BMR from my details (${estimate.toLocaleString('en-GB')} kcal)`}
            </button>
          )
        })()}
      </section>

      <section className="content-card data-card">
        <div className="card-heading">
          <div>
            <p className="card-title">Your account</p>
            <p className="card-subtitle">
              {email} · {entryCount} weigh-in{entryCount === 1 ? '' : 's'}
            </p>
          </div>
        </div>
        <p className="sync-line">{syncLabel}</p>
        <button className="estimate-button" onClick={onSignOut}>
          Sign out
        </button>
        <button
          className={`danger-button ${confirmReset ? 'confirm' : ''}`}
          onClick={() => {
            if (confirmReset) onReset()
            else setConfirmReset(true)
          }}
          onBlur={() => setConfirmReset(false)}
        >
          {confirmReset ? 'Tap again to permanently delete all your data' : 'Delete all my data'}
        </button>
      </section>
      <p className="medical-note">Estimates are for general wellness and are not medical advice.</p>
    </>
  )
}
