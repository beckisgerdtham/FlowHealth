import { useCallback, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Profile, View } from './types'
import { Brand } from './components/Brand'
import { Icon, type IconName } from './components/Icon'
import { initials, todayIso } from './lib/format'
import { newId } from './lib/storage'
import { supabase } from './lib/supabase'
import { useCloudData, type SyncStatus } from './lib/useCloudData'
import { useSession } from './lib/useSession'
import { Dashboard } from './views/Dashboard'
import { Insights } from './views/Insights'
import { LogSheet } from './views/LogSheet'
import { Login } from './views/Login'
import { Onboarding } from './views/Onboarding'
import { Planner } from './views/Planner'
import { Trends } from './views/Trends'

const navItems: { view: View; label: string; icon: IconName }[] = [
  { view: 'today', label: 'Today', icon: 'home' },
  { view: 'trends', label: 'Trends', icon: 'chart' },
  { view: 'plan', label: 'Plan', icon: 'target' },
  { view: 'insights', label: 'Insights', icon: 'spark' },
]

export const syncLabels: Record<SyncStatus, string> = {
  synced: 'All changes saved',
  saving: 'Saving…',
  offline: 'Offline – changes will sync when you’re back online',
  error: 'Sync problem',
}

/** Signed out → login screen. Signed in → the app, backed by Supabase. */
export default function App() {
  const session = useSession()

  if (session === undefined) {
    return (
      <main className="app-shell">
        <div className="mobile-app splash">
          <Brand />
        </div>
      </main>
    )
  }
  if (session === null) {
    return (
      <main className="app-shell">
        <div className="mobile-app splash">
          <Brand />
        </div>
        <Login />
      </main>
    )
  }
  // key: start fresh if a different user signs in.
  return <SignedInApp key={session.user.id} session={session} />
}

function SignedInApp({ session }: { session: Session }) {
  const data = useCloudData(session.user.id)
  const [view, setView] = useState<View>('today')
  const [logging, setLogging] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)

  // The latest weigh-in is the source of truth for current weight.
  const sorted = data.entries
  const latest = sorted[sorted.length - 1]
  const profile: Profile | null = data.profile && { ...data.profile, currentWeight: latest?.weightKg ?? data.profile.currentWeight }
  const showOnboarding = !data.loading && (profile === null || editingProfile)

  const closeLog = useCallback(() => setLogging(false), [])

  function completeOnboarding(next: Profile) {
    data.setProfile(next)
    setEditingProfile(false)
    // Record the weight entered during onboarding as today's weigh-in if it differs.
    if (!latest || latest.weightKg !== next.currentWeight) {
      data.upsertEntry({ id: newId(), date: todayIso(), weightKg: next.currentWeight, loggedAt: new Date().toISOString() })
    }
  }

  function resetAll() {
    data.removeAll()
    setView('today')
  }

  async function signOut() {
    data.clearDevice()
    await supabase.auth.signOut({ scope: 'local' })
  }

  return (
    <main className="app-shell">
      <div className="mobile-app">
        <header className="app-header">
          <Brand />
          <div className="header-right">
            {data.status !== 'synced' && (
              <span className={`sync-chip ${data.status}`} title={syncLabels[data.status]}>
                {data.status === 'saving' ? 'Saving…' : data.status === 'offline' ? 'Offline' : 'Sync issue'}
              </span>
            )}
            <button className="header-action" aria-label="Edit profile" disabled={!profile} onClick={() => setEditingProfile(true)}>
              {profile ? initials(profile.name) : ''}
            </button>
          </div>
        </header>
        {(data.error || data.imported !== null) && (
          <div className={`app-notice ${data.error ? 'error' : ''}`} role="status">
            <span>
              {data.error ?? `Moved ${data.imported} weigh-in${data.imported === 1 ? '' : 's'} from this device to your account.`}
            </span>
            <button aria-label="Dismiss" onClick={data.error ? data.dismissError : data.dismissImported}>
              <Icon name="close" />
            </button>
          </div>
        )}
        <div key={view} className="view-content">
          {data.loading && <p className="loading-note">Loading your data…</p>}
          {profile && view === 'today' && <Dashboard profile={profile} entries={sorted} onLog={() => setLogging(true)} />}
          {profile && view === 'trends' && <Trends entries={sorted} onDelete={data.removeEntry} />}
          {profile && view === 'plan' && (
            <Planner
              profile={profile}
              entryCount={sorted.length}
              email={session.user.email ?? ''}
              syncLabel={syncLabels[data.status]}
              onChange={data.setProfile}
              onReset={resetAll}
              onSignOut={signOut}
            />
          )}
          {profile && view === 'insights' && <Insights profile={profile} entries={sorted} />}
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
          onCancel={profile && editingProfile ? () => setEditingProfile(false) : undefined}
          onSignOut={signOut}
        />
      )}
      {logging && profile && (
        <LogSheet entries={sorted} lastWeight={profile.currentWeight} onSave={data.upsertEntry} onClose={closeLog} />
      )}
    </main>
  )
}
