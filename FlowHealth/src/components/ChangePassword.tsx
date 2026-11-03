import { useState } from 'react'
import { friendlyAuthError, MIN_PASSWORD } from '../lib/authErrors'
import { supabase } from '../lib/supabase'

/** Set or change the signed-in user's password. */
export function ChangePassword({ onDone, submitLabel = 'Save password' }: { onDone?: () => void; submitLabel?: string }) {
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save() {
    if (password.length < MIN_PASSWORD) return setError(`Use at least ${MIN_PASSWORD} characters.`)
    if (password !== repeat) return setError('The passwords don’t match.')
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) return setError(friendlyAuthError(error.message))
    setSaved(true)
    setPassword('')
    setRepeat('')
    onDone?.()
  }

  return (
    <div className="change-password">
      <label className="onboarding-field">
        <span>New password</span>
        <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      <label className="onboarding-field">
        <span>Repeat password</span>
        <input
          type="password"
          autoComplete="new-password"
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && save()}
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      {saved && !error && <p className="form-info">Password saved. Use it next time you sign in.</p>}
      <button className="primary-button" disabled={busy} onClick={save}>
        {busy ? 'Saving…' : submitLabel}
      </button>
    </div>
  )
}
