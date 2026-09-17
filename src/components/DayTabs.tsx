import { WEEKDAYS } from '../lib/appData'
import type { Weekday } from '../types'

type Props = {
  value: Weekday
  onChange: (day: Weekday) => void
  /** Dzisiejszy dzień (null w weekend) — dostaje dopisek „dziś”. */
  today: Weekday | null
  /** Liczba zajęć przy każdym dniu (w ustawieniach). */
  counts?: Record<Weekday, number>
}

/** Przełącznik dni tygodnia Pn–Pt. */
export function DayTabs({ value, onChange, today, counts }: Props) {
  return (
    <div className="day-tabs" role="tablist" aria-label="Dzień tygodnia">
      {WEEKDAYS.map(({ day, short, name }) => (
        <button key={day} type="button" role="tab" aria-selected={value === day} className={value === day ? 'active' : ''} onClick={() => onChange(day)} title={name}>
          <strong><span className="day-tabs-short">{short}</span><span className="day-tabs-name">{name}</span></strong>
          {(today === day || counts) && (
            <span className="day-tabs-meta">
              {today === day && <small>dziś</small>}
              {counts && <em className={counts[day] ? '' : 'empty'} aria-label={`Zajęć: ${counts[day]}`}>{counts[day] || 'pusty'}</em>}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
