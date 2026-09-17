import { Pause, Play, RotateCcw } from 'lucide-react'
import { useEffect, useState, type CSSProperties } from 'react'

const PHASE_MS = 3000
const MIN_SCALE = 0.85
const MAX_SCALE = 1.2

/**
 * Ćwiczenie oddechowe: 3 s wdechu, 3 s wydechu (krócej niż u dorosłych — mniejsze płuca dzieci).
 * Wielkość kółka liczy się z upływającego czasu, więc pauza zatrzymuje je dokładnie w miejscu, a „Wznów” rusza dalej.
 */
export function BreathingExercise() {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const started = running || elapsed > 0

  useEffect(() => {
    if (!running) return
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      setElapsed((value) => value + (now - last))
      last = now
      frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [running])

  const cycle = elapsed % (PHASE_MS * 2)
  const inhale = cycle < PHASE_MS
  const phaseProgress = (inhale ? cycle : cycle - PHASE_MS) / PHASE_MS
  const eased = (1 - Math.cos(Math.PI * phaseProgress)) / 2
  const size = inhale ? eased : 1 - eased
  const secondsLeft = Math.ceil((PHASE_MS - (inhale ? cycle : cycle - PHASE_MS)) / 1000)

  const orbStyle = {
    transform: `scale(${MIN_SCALE + (MAX_SCALE - MIN_SCALE) * size})`,
    boxShadow: `0 0 0 ${18 + 30 * size}px rgba(74, 148, 221, ${0.16 - 0.06 * size}), 0 24px 60px rgba(38, 102, 167, .22)`,
  } as CSSProperties

  const label = !started ? 'GOTOWY?' : !running ? 'PAUZA' : inhale ? 'WDECH' : 'WYDECH'
  const hint = !started
    ? 'Naciśnij Start i oddychaj razem z kółkiem'
    : !running
      ? 'Ćwiczenie zatrzymane. Naciśnij Wznów, aby oddychać dalej'
      : inhale ? 'Powoli nabierz powietrza, kółko rośnie' : 'Powoli wypuść powietrze, kółko maleje'

  return (
    <div className={`breathing-stage ${running ? 'is-running' : ''}`}>
      <div className="breathing-orb-wrap">
        <div className="breathing-orb" style={orbStyle}>
          <span>{label}</span>
          {running && <small aria-hidden="true">{secondsLeft}</small>}
        </div>
      </div>
      <p aria-live="polite">{hint}</p>
      <div className="breathing-actions">
        <button className="relax-control" onClick={() => setRunning((value) => !value)}>
          {running ? <Pause /> : <Play />}
          {running ? 'Pauza' : started ? 'Wznów' : 'Start'}
        </button>
        {started && !running && (
          <button className="relax-control secondary" onClick={() => setElapsed(0)}><RotateCcw /> Od nowa</button>
        )}
      </div>
    </div>
  )
}
