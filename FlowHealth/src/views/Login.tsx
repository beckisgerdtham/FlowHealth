import { useState } from 'react'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { supabase } from '../lib/supabase'

/**
 * Passwordless sign-in. Supabase emails a sign-in link (and a code, if the email
 * template includes {{ .Token }}). The code is handy on a phone where the link
 * would open in a different browser than the installed app.
 */
export function Login() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function sendEmail() {
    const address = email.trim()
    if (!/^\S+@\S+\.\S+$/.test(address)) return setError('Enter a valid email address.')
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: address,
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) return setError(error.message)
    setSent(true)
  }

  async function verifyCode() {
    const token = code.replace(/\s/g, '')
    if (!/^\d{6,10}$/.test(token)) return setError('Enter the code from the email.')
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token, type: 'email' })
    setBusy(false)
    if (error) setError(error.message)
  }

  return (
    <div className="onboarding-backdrop">
      <section className="onboarding-card" aria-labelledby="login-title">
        <div className="onboarding-top">
          <Brand />
        </div>
        <p className="eyebrow login-eyebrow">WELCOME</p>
        <p className="onboarding-title" id="login-title">
          {sent ? 'Check your email' : 'Sign in to FlowHealth'}
        </p>
        <p className="onboarding-copy">
          {sent
            ? `We sent a sign-in link to ${email.trim()}. Open it on this device, or enter the code from the email.`
            : 'Your weigh-ins are saved to your account, so they follow you between phone and computer.'}
        </p>

        {!sent ? (
          <label className="onboarding-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && sendEmail()}
            />
          </label>
        ) : (
          <label className="onboarding-field">
            <span>Code from the email</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && verifyCode()}
            />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}

        <button className="primary-button" disabled={busy} onClick={sent ? verifyCode : sendEmail}>
          {busy ? 'Please wait…' : sent ? 'Sign in' : 'Email me a sign-in link'} {!busy && <Icon name="arrow" />}
        </button>
        {sent && (
          <button
            className="skip-button"
            onClick={() => {
              setSent(false)
              setCode('')
              setError(null)
            }}
          >
            Use a different email
          </button>
        )}
      </section>
    </div>
  )
}
