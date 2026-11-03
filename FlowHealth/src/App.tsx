import { useCallback, useState } from 'react'
import type { Profile, View, WeightEntry } from './types'
import { Brand } from './components/Brand'
import { Icon, type IconName } from './components/Icon'
import { initials, todayIso } from './lib/format'
import { makeSampleEntries } from './lib/sampleData'
import { isEntryList, isProfileOrNull, newId, usePersistentState } from './lib/storage'
import { sortByDate } from './lib/trends'
import { Dashboard } from './views/Dashboard'
import { Explorer } from './views/Explorer'
import { Insights } from './views/Insights'
import { LogSheet } from './views/LogSheet'
import { Onboarding } from './views/Onboarding'
import { Planner } from './views/Planner'
import { Trends } from './views/Trends'

const STORAGE_KEYS = {
  profile: 'flowhealth:v1:profile',
  entries: 'flowhealth:v1:entries',
}

/** Starting values shown in onboarding for a new user. */
const defaultProfile: Profile = {
  name: '',
  bmr: 1920,
  activity: 'Moderately Active',
  age: 32,
  sex: 'Female',
  height: 178,
  currentWeight: 84,
  targetWeight: 78,
  adjustment: -500,
}

const navItems: { view: View; label: string; icon: IconName }[] = [
  { view: 'today', label: 'Today', icon: 'home' },
  { view: 'trends', label: 'Trends', icon: 'chart' },
  { view: 'plan', label: 'Plan', icon: 'target' },
  { view: 'insights', label: 'Insights', icon: 'spark' },
  { view: 'data', label: 'Data', icon: 'data' },
]

/** Insert an entry, replacing any existing entry on the same date. */
const upsert = (entries: WeightEntry[], entry: WeightEntry) => sortByDate([...entries.filter((e) => e.date !== entry.date), entry])

export default function App() {
  const [view, setView] = useState<View>('today')
  const [logging, setLogging] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [savedProfile, setSavedProfile] = usePersistentState<Profile | null>(STORAGE_KEYS.profile, null, isProfileOrNull)
  const [entries, setEntries] = usePersistentState<WeightEntry[]>(STORAGE_KEYS.entries, [], isEntryList)

  // The latest weigh-in is the source of truth for current weight.
  const sorted = sortByDate(entries)
  const latest = sorted[sorted.length - 1]
  const base = savedProfile ?? defaultProfile
  const profile: Profile = { ...base, currentWeight: latest?.weightKg ?? base.currentWeight }
  const showOnboarding = savedProfile === null || editingProfile

  const closeLog = useCallback(() => setLogging(false), [])

  function completeOnboarding(next: Profile) {
    setSavedProfile(next)
    setEditingProfile(false)
    // Record the weight entered during onboarding as today's weigh-in if it differs.
    if (!latest || latest.weightKg !== next.currentWeight) {
      setEntries((prev) =>
        upsert(prev, { id: newId(), date: todayIso(), weightKg: next.currentWeight, loggedAt: new Date().toISOString() }),
      )
    }
  }

  function resetAll() {
    setEntries([])
    setSavedProfile(null)
    setView('today')
  }

  return (
    <main className="app-shell">
      <div className="mobile-app">
        <header className="app-header">
          <Brand />
          <button className="header-action" aria-label="Edit profile" onClick={() => setEditingProfile(true)}>
            {initials(profile.name)}
          </button>
        </header>
        <div key={view} className={`view-content ${view === 'data' ? 'data-view' : ''}`}>
          {view === 'today' && <Dashboard profile={profile} entries={sorted} onLog={() => setLogging(true)} />}
          {view === 'trends' && (
            <Trends
              entries={sorted}
              onDelete={(id) => setEntries((prev) => prev.filter((e) => e.id !== id))}
              onLoadSample={() => setEntries(makeSampleEntries(profile.currentWeight, profile.targetWeight))}
            />
          )}
          {view === 'plan' && (
            <Planner
              profile={profile}
              entryCount={sorted.length}
              onChange={(next) => setSavedProfile(next)}
              onLoadSample={() => setEntries(makeSampleEntries(profile.currentWeight, profile.targetWeight))}
              onReset={resetAll}
            />
          )}
          {view === 'insights' && <Insights profile={profile} entries={sorted} />}
          {view === 'data' && <Explorer latestWeight={profile.currentWeight} />}
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
      {showOnboarding && (
        <Onboarding
          key={editingProfile ? 'edit' : 'new'}
          profile={profile}
          onComplete={completeOnboarding}
          onCancel={savedProfile && editingProfile ? () => setEditingProfile(false) : undefined}
        />
      )}
      {logging && (
        <LogSheet
          entries={sorted}
          lastWeight={profile.currentWeight}
          onSave={(entry) => setEntries((prev) => upsert(prev, entry))}
          onClose={closeLog}
        />
      )}
    </main>
  )
}
