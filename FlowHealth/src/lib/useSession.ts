import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { openedFromRecoveryLink, supabase } from './supabase'

/**
 * The current Supabase session: undefined while checking, null when signed out.
 * `recovery` is true after the user opened a "reset password" link, so the app
 * can ask for a new password.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [recovery, setRecovery] = useState(openedFromRecoveryLink)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(next)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  return { session, recovery, clearRecovery: () => setRecovery(false) }
}
