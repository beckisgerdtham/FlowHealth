/** Turn Supabase auth errors into plain, helpful messages. */
export function friendlyAuthError(message: string) {
  const m = message.toLowerCase()
  if (m.includes('invalid login credentials')) return 'Wrong email or password.'
  if (m.includes('already registered') || m.includes('already exists'))
    return 'An account with this email already exists. Sign in instead.'
  if (m.includes('email not confirmed')) return 'Your email isn’t confirmed yet. Check your inbox for the confirmation email.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Too many emails have been sent recently. Please wait a while and try again.'
  if (m.includes('password') && (m.includes('short') || m.includes('at least') || m.includes('weak')))
    return 'Choose a longer password (at least 8 characters).'
  if (m.includes('signups not allowed') || m.includes('signup is disabled'))
    return 'New accounts can’t be created right now.'
  if (m.includes('fetch') || m.includes('network')) return 'No connection. Check your internet and try again.'
  return message
}

export const MIN_PASSWORD = 8
