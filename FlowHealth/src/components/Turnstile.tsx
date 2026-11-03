import { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile: a privacy-friendly CAPTCHA that usually runs invisibly.
 * Supabase verifies the token server-side once CAPTCHA protection is switched on
 * (Authentication → Attack Protection). The site key is public; the secret key
 * belongs only in Supabase.
 *
 * Leave the site key empty to switch the widget off.
 */
export const TURNSTILE_SITE_KEY: string = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ''

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null

function loadTurnstile() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  scriptPromise ??= new Promise<TurnstileApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error('Turnstile unavailable')))
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('Could not load the human check. Check your connection.'))
    }
    document.head.appendChild(script)
  })
  return scriptPromise
}

/**
 * Renders the check and reports a token (or null when it expires or fails).
 * Tokens are single-use: remount the component (change its `key`) to get a new one.
 */
export function Turnstile({ onToken, onError }: { onToken: (token: string | null) => void; onError?: (message: string) => void }) {
  const container = useRef<HTMLDivElement>(null)
  const callbacks = useRef({ onToken, onError })
  callbacks.current = { onToken, onError }

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return
    let widgetId: string | null = null
    let cancelled = false
    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return
        widgetId = api.render(container.current, {
          sitekey: TURNSTILE_SITE_KEY,
          appearance: 'interaction-only',
          theme: 'light',
          callback: (token: string) => callbacks.current.onToken(token),
          'expired-callback': () => callbacks.current.onToken(null),
          'error-callback': () => {
            callbacks.current.onToken(null)
            callbacks.current.onError?.('The human check failed. Please try again.')
          },
        })
      })
      .catch((e: Error) => callbacks.current.onError?.(e.message))
    return () => {
      cancelled = true
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId)
    }
  }, [])

  if (!TURNSTILE_SITE_KEY) return null
  return <div className="turnstile" ref={container} />
}
