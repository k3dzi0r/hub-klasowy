import { CalendarClock, Hourglass, Minus, Pause, Play, Plus, RotateCcw, TimerReset } from 'lucide-react'
import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { playTimerEnd } from '../lib/chime'

type TimerMode = 'schedule' | 'manual'

type TimerProps = {
  minutes: number
  startTime: string
  endTime: string
  activityTitle: string
  compact?: boolean
}

const MAX_MANUAL_SECONDS = 180 * 60
const PRESET_MINUTES = [1, 3, 5, 10, 15, 30]
const pad = (value: number) => String(value).padStart(2, '0')

function timeToSeconds(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 3600 + minutes * 60
}

function secondsUntil(time: string) {
  const now = new Date()
  const target = new Date(now)
  const [hours, minutes] = time.split(':').map(Number)
  target.setHours(hours, minutes, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000))
}

/** Pole minut albo sekund na tarczy: dotknij, wpisz liczbę, zatwierdź Enterem lub dotknięciem obok. */
function TimeField({ value, max, label, onCommit }: { value: number; max: number; label: string; onCommit: (value: number) => void }) {
  const [draft, setDraft] = useState<string | null>(null)
  const commit = () => {
    if (draft !== null) onCommit(Math.min(max, Number(draft || 0)))
    setDraft(null)
  }
  return (
    <input
      className="timer-field"
      inputMode="numeric"
      aria-label={label}
      value={draft ?? pad(value)}
      style={{ width: `${Math.max(2, (draft ?? pad(value)).length) + 0.3}ch` }}
      onFocus={(event) => { setDraft(pad(value)); event.currentTarget.select() }}
      onChange={(event) => setDraft(event.target.value.replace(/\D/g, '').slice(0, max > 99 ? 3 : 2))}
      onBlur={commit}
      onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }}
    />
  )
}

export function Timer({ minutes, startTime, endTime, activityTitle, compact = false }: TimerProps) {
  const [mode, setMode] = useState<TimerMode>('schedule')
  const [secondsLeft, setSecondsLeft] = useState(() => secondsUntil(endTime))
  const [running, setRunning] = useState(true)
  // Ostatnio ustawiony czas ręczny — do paska postępu i przycisku Reset.
  const [manualTotal, setManualTotal] = useState(minutes * 60)
  const endsAt = useRef(0)
  const isBreak = /przerwa|śniadanie|obiad/i.test(activityTitle)
  const scheduleDuration = Math.max(1, timeToSeconds(endTime) - timeToSeconds(startTime))
  const totalSeconds = mode === 'schedule' ? scheduleDuration : manualTotal

  useEffect(() => {
    if (!running) return
    const interval = window.setInterval(() => {
      if (mode === 'schedule') {
        setSecondsLeft(secondsUntil(endTime))
        return
      }
      // Liczymy od zapamiętanej chwili końca, więc timer się nie spóźnia, gdy karta jest w tle.
      const remaining = Math.max(0, Math.ceil((endsAt.current - Date.now()) / 1000))
      setSecondsLeft(remaining)
      if (remaining === 0) {
        setRunning(false)
        playTimerEnd()
      }
    }, 250)
    return () => window.clearInterval(interval)
  }, [endTime, mode, running])

  const progress = Math.max(0, Math.min(1, secondsLeft / Math.max(1, totalSeconds)))

  const setManualSeconds = (seconds: number) => {
    const next = Math.min(MAX_MANUAL_SECONDS, Math.max(0, seconds))
    setSecondsLeft(next)
    if (running) endsAt.current = Date.now() + next * 1000
    setManualTotal((total) => (running ? Math.max(total, next) : Math.max(1, next)))
  }

  const changeMode = (nextMode: TimerMode) => {
    setMode(nextMode)
    setSecondsLeft(nextMode === 'schedule' ? secondsUntil(endTime) : minutes * 60)
    setManualTotal(minutes * 60)
    setRunning(nextMode === 'schedule')
  }

  const toggleManual = () => {
    if (running) {
      setRunning(false)
      return
    }
    if (secondsLeft === 0) return
    endsAt.current = Date.now() + secondsLeft * 1000
    setRunning(true)
  }

  const resetManual = () => {
    setRunning(false)
    setSecondsLeft(manualTotal)
  }

  const setPreset = (presetMinutes: number) => {
    setRunning(false)
    setSecondsLeft(presetMinutes * 60)
    setManualTotal(presetMinutes * 60)
  }

  const editable = mode === 'manual' && !running
  const minutesPart = Math.floor(secondsLeft / 60)
  const secondsPart = secondsLeft % 60

  return (
    <section className={`panel timer-panel ${compact ? 'compact' : ''}`} aria-labelledby="timer-title">
      <div className="timer-tabs" role="group" aria-label="Rodzaj timera">
        <button className={mode === 'schedule' ? 'active' : ''} onClick={() => changeMode('schedule')}><CalendarClock />Plan</button>
        <button className={mode === 'manual' ? 'active' : ''} onClick={() => changeMode('manual')}><TimerReset />Ręczny</button>
      </div>
      <div className="panel-heading"><Hourglass aria-hidden="true" /><h2 id="timer-title">{mode === 'schedule' ? (isBreak ? 'Do końca przerwy' : 'Do końca zajęć') : 'Timer ręczny'}</h2></div>
      <div className={`timer-ring ${mode === 'manual' && secondsLeft === 0 ? 'is-finished' : ''}`} style={{ '--timer-progress': `${progress * 360}deg` } as CSSProperties}>
        <div>
          {editable ? (
            <strong className="timer-edit">
              <TimeField value={minutesPart} max={180} label="Minuty" onCommit={(value) => setManualSeconds(value * 60 + secondsPart)} />
              :
              <TimeField value={secondsPart} max={59} label="Sekundy" onCommit={(value) => setManualSeconds(minutesPart * 60 + value)} />
            </strong>
          ) : (
            <strong>{pad(minutesPart)}:{pad(secondsPart)}</strong>
          )}
          <span>{mode === 'schedule' ? `do ${endTime}` : running ? 'Czas płynie' : secondsLeft === 0 ? 'Koniec czasu' : 'Dotknij, aby wpisać'}</span>
        </div>
      </div>
      {mode === 'schedule' ? (
        <div className="schedule-timer-status"><span className="live-dot" /> Według planu</div>
      ) : (
        <>
          <div className="timer-actions">
            <button className="primary" onClick={toggleManual} disabled={secondsLeft === 0 && !running}>{running ? <Pause /> : <Play />}<span>{running ? 'Pauza' : 'Start'}</span></button>
            <button onClick={() => setManualSeconds(secondsLeft - 60)} aria-label="Odejmij minutę"><Minus /></button>
            <button onClick={() => setManualSeconds(secondsLeft + 60)} aria-label="Dodaj minutę"><Plus /></button>
            <button onClick={resetManual} aria-label="Reset"><RotateCcw /><span className="timer-reset-label">Reset</span></button>
          </div>
          {!compact && (
            <div className="timer-presets" role="group" aria-label="Szybkie ustawienie czasu">
              {PRESET_MINUTES.map((preset) => (
                <button key={preset} className={!running && secondsLeft === preset * 60 ? 'active' : ''} onClick={() => setPreset(preset)}>{preset} min</button>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
