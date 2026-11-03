import { useState, type KeyboardEvent } from 'react'
import { Brand } from '../components/Brand'
import { Icon } from '../components/Icon'
import { friendlyAuthError, MIN_PASSWORD } from '../lib/authErrors'
import { supabase } from '../lib/supabase'

type Mode = 'signin' | 'signup' | 'forgot' | 'code'

const titles: Record<Mode, string> = {
  signin: 'Sign in to FlowHealth',
  signup: 'Create your account',
  forgot: 'Reset your password',
  code: 'Sign in with a code',
}

/**
 * Email + password sign-in. Emails are only sent for "forgot password"
 * (and the optional one-time code), which keeps well within Supabase's email limits.
 */
export function Login() {
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const address = email.trim()

  function switchTo(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
    setCodeSent(false)
    setCode('')
  }

  async function run(action: () => Promise<{ error: { message: string } | null } | void>) {
    if (!/^\S+@\S+\.\S+$/.test(address)) return setError('Enter a valid email address.')
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const result = await action()
      if (result && result.error) setError(friendlyAuthError(result.error.message))
    } catch (e) {
      setError(friendlyAuthError(e instanceof Error ? e.message : String(e)))
    } finally {
      setBusy(false)
    }
  }

  const submit = () => {
    if (mode === 'signin') {
      if (!password) return setError('Enter your password.')
      return run(() => supabase.auth.signInWithPassword({ email: address, password }))
    }
    if (mode === 'signup') {
      if (password.length < MIN_PASSWORD) return setError(`Choose a password with at least ${MIN_PASSWORD} characters.`)
      return run(async () => {
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        // If email confirmation is switched on in Supabase, there is no session yet.
        if (!error && !data.session) setInfo('Check your email to confirm your account, then sign in here.')
        return { error }
      })
    }
    if (mode === 'forgot') {
      return run(async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(address, { redirectTo: window.location.origin })
        if (!error) setInfo(`If ${address} has an account, we’ve sent a link to choose a new password.`)
        return { error }
      })
    }
    // mode === 'code'
    if (!codeSent) {
      return run(async () => {
        const { error } = await supabase.auth.signInWithOtp({
          email: address,
          options: { emailRedirectTo: window.location.origin, shouldCreateUser: false },
        })
        if (!error) setCodeSent(true)
        return { error }
      })
    }
    const token = code.replace(/\s/g, '')
    if (!/^\d{6,10}$/.test(token)) return setError('Enter the code from the email.')
    return run(() => supabase.auth.verifyOtp({ email: address, token, type: 'email' }))
  }

  const buttonLabel = {
    signin: 'Sign in',
    signup: 'Create account',
    forgot: 'Send reset link',
    code: codeSent ? 'Sign in' : 'Email me a code',
  }[mode]

  const onEnter = (event: KeyboardEvent) => event.key === 'Enter' && submit()

  return (
    <div className="onboarding-backdrop">
      <section className="onboarding-card" aria-labelledby="login-title">
        <div className="onboarding-top">
          <Brand />
        </div>
        <p className="eyebrow login-eyebrow">WELCOME</p>
        <p className="onboarding-title" id="login-title">
          {titles[mode]}
        </p>
        <p className="onboarding-copy">
          {mode === 'forgot'
            ? 'Enter your email and we’ll send you a link to choose a new password.'
            : mode === 'code'
              ? 'We’ll email you a one-time code. Handy if you haven’t set a password yet.'
              : 'Your weigh-ins are saved to your account, so they follow you between phone and computer.'}
        </p>

        {(mode === 'signin' || mode === 'signup') && (
          <div className="auth-tabs" role="tablist">
            <button role="tab" aria-selected={mode === 'signin'} className={mode === 'signin' ? 'active' : ''} onClick={() => switchTo('signin')}>
              Sign in
            </button>
            <button role="tab" aria-selected={mode === 'signup'} className={mode === 'signup' ? 'active' : ''} onClick={() => switchTo('signup')}>
              Create account
            </button>
          </div>
        )}

        <label className="onboarding-field">
          <span>Email</span>
          <input
            type="email"
            autoComplete={mode === 'signup' ? 'email' : 'username'}
            placeholder="you@example.com"
            value={email}
            disabled={mode === 'code' && codeSent}
            onChange={(event) => {
              setEmail(event.target.value)
              setError(null)
            }}
            onKeyDown={onEnter}
          />
        </label>

        {(mode === 'signin' || mode === 'signup') && (
          <label className="onboarding-field">
            <span>
              Password {mode === 'signup' && <small>at least {MIN_PASSWORD} characters</small>}
            </span>
            <input
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
              onKeyDown={onEnter}
            />
          </label>
        )}

        {mode === 'code' && codeSent && (
          <label className="onboarding-field">
            <span>Code from the email</span>
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              onKeyDown={onEnter}
            />
          </label>
        )}

        {error && <p className="form-error">{error}</p>}
        {info && <p className="form-info">{info}</p>}

        <button className="primary-button" disabled={busy} onClick={submit}>
          {busy ? 'Please wait…' : buttonLabel} {!busy && <Icon name="arrow" />}
        </button>

        <div className="auth-links">
          {mode === 'signin' && <button onClick={() => switchTo('forgot')}>Forgot password?</button>}
          {mode === 'signin' && <button onClick={() => switchTo('code')}>Sign in with an email code</button>}
          {(mode === 'forgot' || mode === 'code') && <button onClick={() => switchTo('signin')}>Back to sign in</button>}
        </div>
      </section>
    </div>
  )
}
