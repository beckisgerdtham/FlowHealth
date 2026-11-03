import { useEffect, useState } from 'react'
import { parseDecimal } from '../lib/format'

/**
 * Number field that lets the user clear and retype freely.
 * Only valid numbers within [min, max] are passed to onChange.
 */
export function NumberInput({
  value,
  onChange,
  onEmpty,
  min = 0,
  max = Infinity,
  ...rest
}: {
  /** null = no value yet (shows an empty field). */
  value: number | null
  onChange: (value: number) => void
  /** Called when the field is cleared or holds an invalid number. */
  onEmpty?: () => void
  min?: number
  max?: number
  placeholder?: string
  'aria-label'?: string
  id?: string
}) {
  const [text, setText] = useState(value === null ? '' : String(value))

  // Follow changes made elsewhere (e.g. "Estimate BMR").
  useEffect(() => {
    if (value !== null && parseDecimal(text) !== value) setText(String(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  const parsed = parseDecimal(text)
  const invalid = text !== '' && (Number.isNaN(parsed) || parsed < min || parsed > max)

  return (
    <input
      {...rest}
      inputMode="decimal"
      value={text}
      aria-invalid={invalid}
      onChange={(event) => {
        const next = event.target.value
        setText(next)
        const n = parseDecimal(next)
        if (!Number.isNaN(n) && n >= min && n <= max) onChange(n)
        else onEmpty?.()
      }}
      onBlur={() => {
        // Without onEmpty the field is required: restore the last valid value.
        if (!onEmpty && value !== null && (text === '' || invalid)) setText(String(value))
      }}
    />
  )
}
