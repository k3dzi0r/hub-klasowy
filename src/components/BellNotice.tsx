import { BellRing } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { BellEvent } from '../hooks/useBell'

const AUTO_CLOSE_MS = 20_000

type Props = {
  event: BellEvent
  /** Dźwięk był włączony, ale przeglądarka go zablokowała. */
  soundBlocked: boolean
  onClose: () => void
}

/** Komunikat „dzwonka” na środku ekranu: co się zaczyna albo co się skończyło. Znika sam po 20 sekundach. */
export function BellNotice({ event, soundBlocked, onClose }: Props) {
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    const timer = window.setTimeout(() => closeRef.current(), AUTO_CLOSE_MS)
    const onKey = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key === 'Escape' || keyEvent.key === 'Enter') closeRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [event])

  const { started, ended, next } = event
  const main = started ?? next
  const label = started ? (ended ? `Koniec: ${ended.title}` : 'Zaczynamy') : `Koniec: ${ended?.title ?? ''}`

  return createPortal(
    <div className="dialog-backdrop bell-backdrop" onClick={onClose}>
      <div className={`bell-notice panel tone-${main?.color ?? 'violet'}`} role="alertdialog" aria-modal="true" aria-labelledby="bell-notice-title" onClick={onClose}>
        <span className="bell-notice-label"><BellRing aria-hidden="true" /> {label}</span>
        {main ? (
          <>
            <div className="bell-notice-icon" aria-hidden="true">{main.icon}</div>
            <span className="bell-notice-chip">{started ? 'Teraz' : `Za chwilę · ${main.time}`}</span>
            <h2 id="bell-notice-title">{main.title}</h2>
            {main.instruction && <p>{main.instruction}</p>}
          </>
        ) : (
          <>
            <div className="bell-notice-icon" aria-hidden="true">👋</div>
            <h2 id="bell-notice-title">Koniec zajęć na dziś</h2>
            <p>Do zobaczenia!</p>
          </>
        )}
        <button className="primary" onClick={onClose}>OK</button>
        {soundBlocked && <small className="bell-notice-hint">Dźwięk był wyłączony przez przeglądarkę — po uruchomieniu huba dotknij raz ekranu.</small>}
      </div>
    </div>,
    document.querySelector('.app-shell') ?? document.body,
  )
}
