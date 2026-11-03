import { useEffect, useState } from 'react'
import { parseDecimal } from '../lib/format'

/**
 * Number field that lets the user clear and retype freely.
 * Only valid numbers within [min, max] are passed to onChange.
 */
export function NumberInput({
  value,
  onChange,
  min = 0,
  max = Infinity,
  ...rest
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  'aria-label'?: string
  id?: string
}) {
  const [text, setText] = useState(String(value))

  // Follow changes made elsewhere (e.g. "Estimate BMR").
  useEffect(() => {
    if (parseDecimal(text) !== value) setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const parsed = parseDecimal(text)
  const invalid = text !== '' && (Number.isNaN(parsed) || parsed < min || parsed > max)

  return (
    <input
      {...rest}
      inputMode="decimal"
      value={text}
      aria-invalid={invalid || text === ''}
      onChange={(event) => {
        const next = event.target.value
        setText(next)
        const n = parseDecimal(next)
        if (!Number.isNaN(n) && n >= min && n <= max) onChange(n)
      }}
      onBlur={() => {
        if (text === '' || invalid) setText(String(value))
      }}
    />
  )
}
