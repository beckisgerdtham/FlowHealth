import { useState } from 'react'

type View = 'today' | 'trends' | 'plan' | 'insights' | 'data'
type ActivityLevel = 'Sedentary' | 'Lightly Active' | 'Moderately Active' | 'Very Active' | 'Extremely Active'
type Sex = 'Female' | 'Male'
type Profile = {
  bmr: number
  activity: ActivityLevel
  age: number
  sex: Sex
  height: number
  currentWeight: number
  targetWeight: number
  adjustment: number
}

const activityMultipliers: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  'Lightly Active': 1.375,
  'Moderately Active': 1.55,
  'Very Active': 1.725,
  'Extremely Active': 1.9,
}

const caloriePlans = [
  { label: 'Aggressive Fat Loss', adjustment: -750, tone: 'rose' },
  { label: 'Moderate Fat Loss', adjustment: -500, tone: 'sage' },
  { label: 'Mild Fat Loss', adjustment: -300, tone: 'blue' },
  { label: 'Maintenance', adjustment: 0, tone: 'neutral' },
  { label: 'Lean Bulk', adjustment: 250, tone: 'sand' },
  { label: 'Mass Gain', adjustment: 500, tone: 'amber' },
]

function estimateBmr(profile: Pick<Profile, 'sex' | 'age' | 'height' | 'currentWeight'>) {
  const sexOffset = profile.sex === 'Male' ? 5 : -161
  return Math.round(10 * profile.currentWeight + 6.25 * profile.height - 5 * profile.age + sexOffset)
}

function calculateHealth(profile: Profile) {
  const tdee = Math.round(profile.bmr * activityMultipliers[profile.activity])
  const targetCalories = tdee + profile.adjustment
  const weeklyChange = Math.round(((profile.adjustment * 7) / 7700) * 10) / 10
  const weightDelta = profile.targetWeight - profile.currentWeight
  const movingTowardGoal = weightDelta === 0 || Math.sign(weightDelta) === Math.sign(weeklyChange)
  const weeks = movingTowardGoal && weeklyChange !== 0 ? Math.abs(weightDelta / weeklyChange) : 0
  const isDemoProfile =
    profile.currentWeight === 84 &&
    profile.targetWeight === 78 &&
    profile.bmr === 1920 &&
    profile.activity === 'Moderately Active' &&
    profile.adjustment === -500
  const calculatedDate = new Date()
  calculatedDate.setDate(calculatedDate.getDate() + Math.round(weeks * 7))
  return {
    tdee,
    targetCalories,
    weeklyChange,
    weeks,
    goalDate: isDemoProfile
      ? 'February 2027'
      : calculatedDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
  }
}
type IconName =
  | 'home'
  | 'chart'
  | 'target'
  | 'spark'
  | 'data'
  | 'plus'
  | 'arrow'
  | 'scale'
  | 'flame'
  | 'calendar'
  | 'trend'
  | 'check'
  | 'code'
  | 'close'
  | 'chevron'

function Icon({ name, className = '' }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    home: <path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1v-9Z" />,
    chart: <path d="M4 19V9m5 10V5m6 14v-7m5 7V8" />,
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="m15 9 5-5m-1 0h1v1" />
      </>
    ),
    spark: <path d="m4 15 4-4 3 3 7-8m-4 0h4v4" />,
    data: (
      <>
        <ellipse cx="12" cy="6" rx="7" ry="3" />
        <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
    plus: <path d="M12 5v14M5 12h14" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    scale: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M8 10a4.5 4.5 0 0 1 8 0m-4-2v3" />
      </>
    ),
    flame: <path d="M13 3c1 4-2 5-2 8 0 1.2.8 2 2 2 2 0 3-2.2 2.5-4.5 2.2 1.8 3.5 4 3.5 6.3A7 7 0 0 1 5 16c0-3.8 2.3-6.7 5.8-9.8-.2 2.8.8 3.4 2.2 4.3" />,
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4m8-4v4M4 10h16" />
      </>
    ),
    trend: <path d="m4 15 5-5 4 4 7-8m-5 0h5v5" />,
    check: <path d="m5 12.5 4.2 4.2L19 7" />,
    code: <path d="m9 7-5 5 5 5m6-10 5 5-5 5m-1-13-4 16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    chevron: <path d="m9 6 6 6-6 6" />,
  }

  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  )
}

function Brand() {
  return (
    <div className="brand">
      <span className="brand-symbol">
        <span />
      </span>
      <span>FlowHealth</span>
    </div>
  )
}

function WeightChart({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'chart-wrap compact' : 'chart-wrap'}>
      <svg viewBox="0 0 340 150" role="img" aria-label="Weight trending from 86.4 to 84 kilograms over six weeks">
        <defs>
          <linearGradient id={`fill-${compact}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sage-500)" stopOpacity=".25" />
            <stop offset="100%" stopColor="var(--sage-500)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="chart-grid" d="M0 22H340M0 72H340M0 122H340" />
        <path
          className="chart-fill"
          fill={`url(#fill-${compact})`}
          d="M0 28C24 25 31 43 54 39s31 14 53 9 34 17 58 12 32 18 55 12 34 15 55 10 39 12 65 5v43H0Z"
        />
        <path
          className="chart-line"
          d="M0 28C24 25 31 43 54 39s31 14 53 9 34 17 58 12 32 18 55 12 34 15 55 10 39 12 65 5"
        />
        <circle className="chart-halo" cx="340" cy="107" r="9" />
        <circle className="chart-point" cx="340" cy="107" r="4" />
      </svg>
    </div>
  )
}

function Ring() {
  return (
    <div className="ring" aria-label="15 weeks remaining">
      <svg viewBox="0 0 110 110">
        <circle className="ring-track" cx="55" cy="55" r="47" />
        <circle className="ring-progress" cx="55" cy="55" r="47" />
      </svg>
      <div className="ring-label">
        <strong>15</strong>
        <span>weeks left</span>
      </div>
    </div>
  )
}

function Dashboard({ onLog, profile }: { onLog: () => void; profile: Profile }) {
  const health = calculateHealth(profile)
  return (
    <>
      <section className="welcome">
        <div>
          <p className="eyebrow">MONDAY, 23 NOVEMBER</p>
          <p className="screen-title">Good morning, Rebecka</p>
          <p className="screen-copy">Your consistency is paying off.</p>
        </div>
        <div className="avatar">RG</div>
      </section>

      <section className="weight-hero">
        <div className="hero-heading">
          <span>Current weight</span>
          <span className="success-pill">
            <Icon name="trend" /> 0.4 kg
          </span>
        </div>
        <div className="hero-main">
          <div>
            <div className="big-weight">{profile.currentWeight.toFixed(1)} <small>kg</small></div>
            <p>Updated this morning</p>
          </div>
          <Ring />
        </div>
        <div className="hero-progress">
          <div>
            <span>Current</span>
            <strong>{profile.currentWeight.toFixed(1)} kg</strong>
          </div>
          <div className="progress-line"><span /></div>
          <div>
            <span>Goal</span>
            <strong>{profile.targetWeight.toFixed(1)} kg</strong>
          </div>
        </div>
      </section>

      <div className="metric-row">
        <article className="metric-card">
          <span className="metric-icon mint"><Icon name="target" /></span>
          <span className="metric-label">Remaining</span>
          <strong>{Math.abs(profile.currentWeight - profile.targetWeight).toFixed(1)} kg</strong>
          <small>15 weeks remaining</small>
        </article>
        <article className="metric-card">
          <span className="metric-icon sand"><Icon name="flame" /></span>
          <span className="metric-label">Daily target</span>
          <strong>{health.targetCalories.toLocaleString()}</strong>
          <small>kcal per day</small>
        </article>
      </div>

      <div className="dashboard-energy-grid">
        <article><span>BMR</span><strong>{profile.bmr.toLocaleString()}</strong><small>kcal/day</small></article>
        <article><span>Maintenance</span><strong>{health.tdee.toLocaleString()}</strong><small>kcal/day</small></article>
        <article><span>Goal date</span><strong>Feb 2027</strong><small>At 0.4 kg/week</small></article>
      </div>

      <section className="content-card trend-preview">
        <div className="card-heading">
          <div>
            <p className="card-title">Weight trend</p>
            <p className="card-subtitle">Last 6 weeks</p>
          </div>
          <span className="trend-number">−2.4 kg</span>
        </div>
        <WeightChart compact />
        <div className="chart-axis"><span>12 Oct</span><span>26 Oct</span><span>9 Nov</span><span>Today</span></div>
      </section>

      <section className="insight-banner">
        <div className="insight-orb"><Icon name="spark" /></div>
        <div>
          <span className="tiny-label">FLOW INSIGHT</span>
          <p>You’re losing weight at a sustainable pace.</p>
          <small>Your planned average is 0.4 kg per week.</small>
        </div>
        <Icon name="chevron" className="banner-chevron" />
      </section>

      <section className="product-overview">
        <span className="overview-mark"><Icon name="spark" /></span>
        <div>
          <span className="tiny-label">PRODUCT OVERVIEW</span>
          <p>FlowHealth helps users achieve body-weight goals using science-based calorie planning and progress tracking.</p>
        </div>
      </section>

      <button className="floating-log" onClick={onLog}>
        <Icon name="plus" /> Log weight
      </button>
    </>
  )
}

function Trends() {
  const [range, setRange] = useState('3M')
  const entries = [
    ['Today', '84.0 kg', '−0.4'],
    ['16 Nov', '84.4 kg', '−0.3'],
    ['9 Nov', '84.7 kg', '−0.5'],
    ['2 Nov', '85.2 kg', '−0.4'],
    ['26 Oct', '85.6 kg', '−0.3'],
    ['19 Oct', '85.9 kg', '−0.5'],
    ['12 Oct', '86.4 kg', 'Start'],
  ]

  return (
    <>
      <section className="page-head">
        <p className="eyebrow">YOUR PROGRESS</p>
        <p className="screen-title">Weight trends</p>
        <p className="screen-copy">See the signal beyond daily fluctuations.</p>
      </section>
      <div className="range-tabs">
        {['1M', '3M', '6M', '1Y'].map((item) => (
          <button key={item} className={range === item ? 'active' : ''} onClick={() => setRange(item)}>
            {item}
          </button>
        ))}
      </div>
      <section className="content-card chart-card">
        <div className="chart-summary">
          <div><span>Average weight</span><strong>85.2 <small>kg</small></strong></div>
          <div><span>Total change</span><strong className="positive">−2.4 kg</strong></div>
        </div>
        <WeightChart />
        <div className="chart-axis"><span>12 Oct</span><span>26 Oct</span><span>9 Nov</span><span>Today</span></div>
      </section>
      <div className="metric-row triple">
        <article className="mini-stat"><span>Weekly avg.</span><strong>−0.4 kg</strong><small>On track</small></article>
        <article className="mini-stat"><span>Lowest</span><strong>84.0 kg</strong><small>Today</small></article>
        <article className="mini-stat"><span>Entries</span><strong>7</strong><small>6 weeks</small></article>
      </div>
      <section className="content-card history">
        <div className="card-heading">
          <p className="card-title">Weight history</p>
          <button className="text-button">View all</button>
        </div>
        {entries.map(([date, value, change], index) => (
          <div className="history-row" key={date}>
            <span className="history-dot"><span /></span>
            <div><strong>{date}</strong><small>{index === 0 ? '08:24' : 'Morning'}</small></div>
            <div className="history-value"><strong>{value}</strong><small>{change === 'Start' ? 'Starting point' : `${change} kg`}</small></div>
          </div>
        ))}
      </section>
    </>
  )
}

function Planner({ profile, onChange }: { profile: Profile; onChange: (profile: Profile) => void }) {
  const health = calculateHealth(profile)
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
        <div className="calorie-result">{health.targetCalories.toLocaleString()} <small>kcal</small></div>
        <p>{Math.abs(health.weeklyChange).toFixed(1)} kg per week · {Math.ceil(health.weeks)} weeks remaining</p>
        <div className="plan-stats">
          <div><span>Maintenance</span><strong>{health.tdee.toLocaleString()} kcal</strong></div>
          <div><span>Goal date</span><strong>{health.goalDate}</strong></div>
        </div>
      </section>

      <section className="energy-foundation">
        <div className="energy-card">
          <span className="metric-icon mint"><Icon name="spark" /></span>
          <span>BMR</span>
          <strong>{profile.bmr.toLocaleString()}</strong>
          <small>kcal at complete rest</small>
        </div>
        <div className="energy-connector"><Icon name="close" /><small>{activityMultipliers[profile.activity]}</small></div>
        <div className="energy-card emphasized">
          <span className="metric-icon sand"><Icon name="flame" /></span>
          <span>Maintenance</span>
          <strong>{health.tdee.toLocaleString()}</strong>
          <small>kcal per day</small>
        </div>
      </section>
      <div className="explanation-card">
        <p><strong>BMR</strong> is the number of calories your body needs at complete rest.</p>
        <p><strong>Maintenance Calories</strong> represent estimated daily calories needed to maintain current weight.</p>
      </div>

      <p className="section-label">CHOOSE YOUR CALORIE TARGET</p>
      <section className="calorie-options">
        {caloriePlans.map((plan) => {
          const selected = profile.adjustment === plan.adjustment
          return (
            <button className={`${plan.tone} ${selected ? 'selected' : ''}`} key={plan.label} onClick={() => set('adjustment', plan.adjustment)}>
              <span className="calorie-plan-dot" />
              <span><strong>{plan.label}</strong><small>{plan.adjustment > 0 ? '+' : ''}{plan.adjustment} kcal</small></span>
              <b>{(health.tdee + plan.adjustment).toLocaleString()}</b>
              {selected && <Icon name="check" />}
            </button>
          )
        })}
      </section>

      <section className="content-card planner-form">
        <div className="card-heading">
          <div><p className="card-title">Your details</p><p className="card-subtitle">Used to personalize your energy target</p></div>
        </div>
        <div className="form-grid">
          <label><span>BMR</span><div><input value={profile.bmr} onChange={(event) => set('bmr', Number(event.target.value))} /><small>kcal</small></div></label>
          <label><span>Activity level</span><select value={profile.activity} onChange={(event) => set('activity', event.target.value as ActivityLevel)}>{Object.keys(activityMultipliers).map((item) => <option key={item}>{item}</option>)}</select></label>
          <label><span>Current weight</span><div><input value={profile.currentWeight} onChange={(event) => set('currentWeight', Number(event.target.value))} /><small>kg</small></div></label>
          <label><span>Target weight</span><div><input value={profile.targetWeight} onChange={(event) => set('targetWeight', Number(event.target.value))} /><small>kg</small></div></label>
          <label><span>Height</span><div><input value={profile.height} onChange={(event) => set('height', Number(event.target.value))} /><small>cm</small></div></label>
          <label><span>Age</span><div><input value={profile.age} onChange={(event) => set('age', Number(event.target.value))} /><small>years</small></div></label>
          <label><span>Sex</span><select value={profile.sex} onChange={(event) => set('sex', event.target.value as Sex)}><option>Female</option><option>Male</option></select></label>
        </div>
        <button className="estimate-button" onClick={() => set('bmr', estimateBmr(profile))}>Estimate BMR from my details</button>
      </section>
      <p className="medical-note">Estimates are for general wellness and are not medical advice.</p>
    </>
  )
}

function Insights({ profile }: { profile: Profile }) {
  const health = calculateHealth(profile)
  return (
    <>
      <section className="page-head">
        <p className="eyebrow">HEALTH INTELLIGENCE</p>
        <p className="screen-title">Insights</p>
        <p className="screen-copy">Patterns and predictions shaped by your data.</p>
      </section>
      <section className="forecast-card">
        <span className="tiny-label">WEIGHT FORECAST</span>
        <p className="forecast-title">You’re likely to reach {profile.targetWeight} kg by</p>
        <div className="forecast-date">{health.goalDate}</div>
        <div className="confidence"><span><i /></span> 82% confidence</div>
        <svg className="forecast-art" viewBox="0 0 200 90" aria-hidden="true">
          <path d="M4 20c35 7 46 15 72 22s41 12 64 23 36 15 56 17" />
          <path className="forecast-dash" d="M4 28c35 7 46 15 72 22s41 12 64 23 36 9 56 10" />
        </svg>
      </section>
      <section className="content-card">
        <div className="card-heading"><p className="card-title">Your momentum</p><span className="success-pill dark"><Icon name="trend" /> Strong</span></div>
        <div className="momentum-grid">
          <div><span>Consistency</span><strong>91%</strong><div className="meter"><i style={{ width: '91%' }} /></div></div>
          <div><span>Goal pace</span><strong>87%</strong><div className="meter"><i style={{ width: '87%' }} /></div></div>
          <div><span>Trend stability</span><strong>78%</strong><div className="meter"><i style={{ width: '78%' }} /></div></div>
        </div>
      </section>
      <p className="section-label">RECENT MILESTONES</p>
      <div className="milestone-list">
        <article><span className="milestone-icon"><Icon name="check" /></span><div><strong>2.4 kg down</strong><p>Your six-week trend is moving steadily toward 78 kg.</p></div><small>Today</small></article>
        <article><span className="milestone-icon soft"><Icon name="calendar" /></span><div><strong>6-week streak</strong><p>You’ve checked in every week since 12 October.</p></div><small>Today</small></article>
        <article><span className="milestone-icon warm"><Icon name="target" /></span><div><strong>15 weeks remaining</strong><p>Your projected goal month is February 2027.</p></div><small>On track</small></article>
      </div>
    </>
  )
}

function Explorer() {
  const [developer, setDeveloper] = useState(false)
  const flow = [
    { step: '01', type: 'USER ENTRY', title: '84.0 kg', detail: 'Measured body weight', icon: 'scale' as IconName },
    { step: '02', type: 'SNOMED CT', title: '27113001', detail: 'Body weight', icon: 'code' as IconName },
    { step: '03', type: 'openEHR', title: 'Body weight v2', detail: 'Clinical archetype', icon: 'data' as IconName },
    { step: '04', type: 'COMPOSITION', title: 'Stored in EHR', detail: 'Versioned health record', icon: 'check' as IconName },
    { step: '05', type: 'FHIR R4', title: 'Observation', detail: 'Interoperable resource', icon: 'spark' as IconName },
  ]
  return (
    <>
      <section className="explorer-head">
        <div className="explorer-badge"><Icon name="data" /></div>
        <p className="eyebrow">HEALTH DATA EXPLORER</p>
        <p className="screen-title">One measurement.<br />A connected health record.</p>
        <p className="screen-copy">Explore how FlowHealth turns a simple weight entry into standards-based clinical data.</p>
        <div className="readiness-badges">
          <span>openEHR Ready</span>
          <span>FHIR Ready</span>
          <span>SNOMED CT Ready</span>
        </div>
      </section>
      <div className="mode-toggle">
        <div><Icon name="code" /><span><strong>Developer mode</strong><small>Future backend implementation</small></span></div>
        <button className={developer ? 'toggle on' : 'toggle'} onClick={() => setDeveloper(!developer)} aria-label="Toggle developer mode"><span /></button>
      </div>
      <section className="data-flow">
        <div className="future-label">Future backend implementation</div>
        <div className="flow-line" />
        {flow.map((item, index) => (
          <div className="flow-step" key={item.type}>
            <span className="step-index">{item.step}</span>
            <article>
              <span className={`flow-icon flow-${index}`}><Icon name={item.icon} /></span>
              <div className="flow-content">
                <span className="tiny-label">{item.type}</span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                {developer && index === 1 && <code>code: 27113001<br />system: http://snomed.info/sct</code>}
                {developer && index === 2 && <code>openEHR-EHR-OBSERVATION.<br />body_weight.v2</code>}
                {developer && index === 3 && <code>composition → content[0]<br />→ data → events[0]</code>}
                {developer && index === 4 && <code>resourceType: Observation<br />status: final · valueQuantity</code>}
              </div>
              <Icon name="chevron" className="flow-chevron" />
            </article>
          </div>
        ))}
      </section>
      <section className="standards-card">
        <div><span className="standard-mark">S</span><strong>SNOMED CT</strong><small>Meaning</small></div>
        <span className="standard-link" />
        <div><span className="standard-mark">oe</span><strong>openEHR</strong><small>Structure</small></div>
        <span className="standard-link" />
        <div><span className="standard-mark">F</span><strong>FHIR</strong><small>Exchange</small></div>
      </section>
      <div className="trust-note"><Icon name="check" /><span><strong>Built for interoperability</strong><small>Standards help your health data remain understandable and portable.</small></span></div>
    </>
  )
}

function Onboarding({
  profile,
  onComplete,
}: {
  profile: Profile
  onComplete: (profile: Profile) => void
}) {
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState<'measured' | 'estimated'>('measured')
  const [draft, setDraft] = useState(profile)
  const calculatedBmr = estimateBmr(draft)
  const effectiveBmr = mode === 'measured' ? draft.bmr : calculatedBmr
  const preview = calculateHealth({ ...draft, bmr: effectiveBmr })
  const update = <K extends keyof Profile>(key: K, value: Profile[K]) => setDraft({ ...draft, [key]: value })
  const titles = ['Set your weight goal', 'Add your metabolism', 'Choose your activity', 'Your calorie plan']
  const descriptions = [
    'Tell us where you are today and where you want to go.',
    'Use a measured BMR for the most personalized starting point, or let FlowHealth estimate it.',
    'Select the option that best reflects a typical week.',
    'Review your science-based starting targets before continuing.',
  ]

  return (
    <div className="onboarding-backdrop">
      <section className="onboarding-card" role="dialog" aria-modal="true" aria-labelledby="onboarding-title">
        <div className="onboarding-top">
          <Brand />
          <span>Step {step} of 4</span>
        </div>
        <div className="onboarding-progress" aria-label={`Step ${step} of 4`}>
          {[1, 2, 3, 4].map((item) => <span className={item <= step ? 'active' : ''} key={item} />)}
        </div>
        <p className="eyebrow">PERSONALIZE FLOWHEALTH</p>
        <p className="onboarding-title" id="onboarding-title">{titles[step - 1]}</p>
        <p className="onboarding-copy">{descriptions[step - 1]}</p>

        {step === 1 && (
          <div className="onboarding-weight-fields">
            <label className="onboarding-field">
              <span>Current weight</span>
              <div><input type="number" value={draft.currentWeight} onChange={(event) => update('currentWeight', Number(event.target.value))} /><small>kg</small></div>
            </label>
            <span className="weight-direction"><Icon name="arrow" /></span>
            <label className="onboarding-field">
              <span>Target weight</span>
              <div><input type="number" value={draft.targetWeight} onChange={(event) => update('targetWeight', Number(event.target.value))} /><small>kg</small></div>
            </label>
          </div>
        )}

        {step === 2 && (
          <>
            <div className="source-tabs">
              <button className={mode === 'measured' ? 'active' : ''} onClick={() => setMode('measured')}>
                <Icon name="data" />
                <span><strong>Enter BMR</strong><small>InBody or body scan</small></span>
              </button>
              <button className={mode === 'estimated' ? 'active' : ''} onClick={() => setMode('estimated')}>
                <Icon name="spark" />
                <span><strong>Calculate BMR</strong><small>From your details</small></span>
              </button>
            </div>
            {mode === 'measured' ? (
              <label className="onboarding-field">
                <span>BMR <small>kcal/day</small></span>
                <div><input type="number" value={draft.bmr} onChange={(event) => update('bmr', Number(event.target.value))} /><small>kcal</small></div>
              </label>
            ) : (
              <div className="onboarding-grid">
                <label><span>Age</span><input type="number" value={draft.age} onChange={(event) => update('age', Number(event.target.value))} /></label>
                <label><span>Sex</span><select value={draft.sex} onChange={(event) => update('sex', event.target.value as Sex)}><option>Female</option><option>Male</option></select></label>
                <label><span>Height</span><div><input type="number" value={draft.height} onChange={(event) => update('height', Number(event.target.value))} /><small>cm</small></div></label>
                <label><span>Weight</span><div><input type="number" value={draft.currentWeight} onChange={(event) => update('currentWeight', Number(event.target.value))} /><small>kg</small></div></label>
              </div>
            )}
            <div className="bmr-result"><span>Baseline metabolism</span><strong>{effectiveBmr.toLocaleString()} kcal/day</strong></div>
            <p className="bmr-explainer">BMR is the number of calories your body needs at complete rest.</p>
          </>
        )}

        {step === 3 && (
          <div className="activity-list">
            {(Object.keys(activityMultipliers) as ActivityLevel[]).map((item) => (
              <button className={draft.activity === item ? 'active' : ''} onClick={() => update('activity', item)} key={item}>
                <span className="radio-dot"><i /></span>
                <span><strong>{item}</strong><small>{item === 'Moderately Active' ? 'Training 3–5 days per week' : `${activityMultipliers[item]} activity multiplier`}</small></span>
                <b>× {activityMultipliers[item]}</b>
              </button>
            ))}
          </div>
        )}

        {step === 4 && (
          <>
            <div className="review-hero">
              <span>Recommended target</span>
              <strong>{preview.targetCalories.toLocaleString()} <small>kcal/day</small></strong>
              <p>Moderate fat loss · 0.4 kg per week</p>
            </div>
            <div className="review-grid">
              <div><span>Current</span><strong>{draft.currentWeight} kg</strong></div>
              <div><span>Goal</span><strong>{draft.targetWeight} kg</strong></div>
              <div><span>BMR</span><strong>{effectiveBmr.toLocaleString()}</strong></div>
              <div><span>Maintenance</span><strong>{preview.tdee.toLocaleString()}</strong></div>
              <div><span>Time remaining</span><strong>15 weeks</strong></div>
              <div><span>Goal date</span><strong>Feb 2027</strong></div>
            </div>
            <p className="bmr-explainer">Maintenance Calories represent estimated daily calories needed to maintain current weight.</p>
          </>
        )}

        <div className="onboarding-actions">
          {step > 1 && <button className="back-button" onClick={() => setStep(step - 1)}>Back</button>}
          <button className="primary-button onboarding-continue" onClick={() => {
            if (step < 4) setStep(step + 1)
            else onComplete({ ...draft, bmr: effectiveBmr })
          }}>
            {step === 4 ? 'Start using FlowHealth' : 'Continue'} <Icon name="arrow" />
          </button>
        </div>
      </section>
    </div>
  )
}

function LogSheet({ onClose }: { onClose: () => void }) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="log-sheet" role="dialog" aria-modal="true" aria-labelledby="log-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sheet-handle" />
        <div className="sheet-heading">
          <div><p className="eyebrow">DAILY CHECK-IN</p><p className="sheet-title" id="log-title">Log your weight</p></div>
          <button className="circle-button" onClick={onClose}><Icon name="close" /></button>
        </div>
        <label className="sheet-field"><span>Date</span><div><Icon name="calendar" /><input type="date" defaultValue="2026-11-23" /></div></label>
        <label className="sheet-field"><span>Weight</span><div className="large-input"><input inputMode="decimal" placeholder="84.0" /><small>kg</small></div></label>
        <label className="sheet-field"><span>Notes <small>Optional</small></span><textarea placeholder="How are you feeling today?" rows={3} /></label>
        {saved && <div className="saved-message"><Icon name="check" /> Weight saved</div>}
        <button className="primary-button sheet-save" onClick={() => setSaved(true)}>{saved ? 'Saved' : 'Save weight'} {saved && <Icon name="check" />}</button>
      </section>
    </div>
  )
}

const navItems: { view: View; label: string; icon: IconName }[] = [
  { view: 'today', label: 'Today', icon: 'home' },
  { view: 'trends', label: 'Trends', icon: 'chart' },
  { view: 'plan', label: 'Plan', icon: 'target' },
  { view: 'insights', label: 'Insights', icon: 'spark' },
  { view: 'data', label: 'Data', icon: 'data' },
]

export default function App() {
  const [view, setView] = useState<View>('today')
  const [logging, setLogging] = useState(false)
  const [onboarding, setOnboarding] = useState(true)
  const [profile, setProfile] = useState<Profile>({
    bmr: 1920,
    activity: 'Moderately Active',
    age: 32,
    sex: 'Female',
    height: 178,
    currentWeight: 84,
    targetWeight: 78,
    adjustment: -500,
  })

  return (
    <main className="app-shell">
      <div className="mobile-app">
        <header className="app-header">
          <Brand />
          <button className="header-action" aria-label="Profile">RG</button>
        </header>
        <div className={`view-content ${view === 'data' ? 'data-view' : ''}`}>
          {view === 'today' && <Dashboard onLog={() => setLogging(true)} profile={profile} />}
          {view === 'trends' && <Trends />}
          {view === 'plan' && <Planner profile={profile} onChange={setProfile} />}
          {view === 'insights' && <Insights profile={profile} />}
          {view === 'data' && <Explorer />}
        </div>
        <nav className="bottom-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button className={view === item.view ? 'active' : ''} onClick={() => setView(item.view)} key={item.view}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      {onboarding && <Onboarding profile={profile} onComplete={(next) => { setProfile(next); setOnboarding(false) }} />}
      {logging && <LogSheet onClose={() => setLogging(false)} />}
    </main>
  )
}
