import { useEffect, useState } from 'react'
import type { WeightEntry } from '../types'
import { Icon } from '../components/Icon'
import { parseDecimal, todayIso } from '../lib/format'
import { newId } from '../lib/storage'

export function LogSheet({
  entries,
  lastWeight,
  onSave,
  onClose,
}: {
  entries: WeightEntry[]
  lastWeight: number
  onSave: (entry: WeightEntry) => void
  onClose: () => void
}) {
  const today = todayIso()
  const [date, setDate] = useState(today)
  const [weight, setWeight] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const replaces = entries.some((e) => e.date === date)

  useEffect(() => {
    if (!saved) return
    const timer = setTimeout(onClose, 900)
    return () => clearTimeout(timer)
  }, [saved, onClose])

  function save() {
    const kg = parseDecimal(weight)
    if (Number.isNaN(kg)) return setError('Enter your weight, e.g. 84.2')
    if (kg < 20 || kg > 400) return setError('Weight should be between 20 and 400 kg')
    if (!date || date > today) return setError('Choose today or an earlier date')
    setError(null)
    onSave({
      id: newId(),
      date,
      weightKg: Math.round(kg * 10) / 10,
      note: note.trim() || undefined,
      loggedAt: new Date().toISOString(),
    })
    setSaved(true)
  }

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="log-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="log-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" />
        <div className="sheet-heading">
          <div>
            <p className="eyebrow">DAILY CHECK-IN</p>
            <p className="sheet-title" id="log-title">
              Log your weight
            </p>
          </div>
          <button className="circle-button" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </div>
        <label className="sheet-field">
          <span>Date</span>
          <div>
            <Icon name="calendar" />
            <input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} />
          </div>
          {replaces && <small className="form-hint">This replaces your existing entry for that date.</small>}
        </label>
        <label className="sheet-field">
          <span>Weight</span>
          <div className="large-input">
            <input
              autoFocus
              inputMode="decimal"
              placeholder={lastWeight.toFixed(1)}
              value={weight}
              onChange={(event) => setWeight(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && save()}
            />
            <small>kg</small>
          </div>
        </label>
        <label className="sheet-field">
          <span>
            Notes <small>Optional</small>
          </span>
          <textarea placeholder="How are you feeling today?" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
        </label>
        {error && <p className="form-error">{error}</p>}
        {saved && (
          <div className="saved-message">
            <Icon name="check" /> Weight saved
          </div>
        )}
        <button className="primary-button sheet-save" onClick={save} disabled={saved}>
          {saved ? 'Saved' : 'Save weight'} {saved && <Icon name="check" />}
        </button>
      </section>
    </div>
  )
}
