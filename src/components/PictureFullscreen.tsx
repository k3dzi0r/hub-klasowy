import { ChevronLeft, ChevronRight, Pause, Play, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MediaItem } from '../data/relaxMedia'

type Props = {
  pictures: MediaItem[]
  index: number
  slideshow: boolean
  paused: boolean
  onMove: (delta: number) => void
  onTogglePause: () => void
  onClose: () => void
}

/** Obraz na cały ekran. Sterowanie chowa się po chwili bezruchu; Esc, strzałki i spacja działają z klawiatury i pilota. */
export function PictureFullscreen({ pictures, index, slideshow, paused, onMove, onTogglePause, onClose }: Props) {
  const [controlsVisible, setControlsVisible] = useState(true)
  const hideTimer = useRef<number | undefined>(undefined)
  const picture = pictures[index]

  const showControls = () => {
    setControlsVisible(true)
    window.clearTimeout(hideTimer.current)
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000)
  }

  const close = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => onClose())
    else onClose()
  }

  const handlers = useRef({ onMove, onTogglePause, onClose, close, showControls })
  useEffect(() => {
    handlers.current = { onMove, onTogglePause, onClose, close, showControls }
  })

  useEffect(() => {
    hideTimer.current = window.setTimeout(() => setControlsVisible(false), 3000)
    const onFullscreenChange = () => { if (!document.fullscreenElement) handlers.current.onClose() }
    const onKey = (event: KeyboardEvent) => {
      const { onMove: move, onTogglePause: togglePause, close: closeView, showControls: show } = handlers.current
      if (event.key === 'ArrowRight') move(1)
      else if (event.key === 'ArrowLeft') move(-1)
      else if (event.key === ' ') { event.preventDefault(); togglePause() }
      else if (event.key === 'Escape') closeView()
      else return
      show()
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    window.addEventListener('keydown', onKey)
    return () => {
      window.clearTimeout(hideTimer.current)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  if (!picture) return null

  return createPortal(
    <div className={`picture-fullscreen ${controlsVisible ? '' : 'controls-hidden'}`} onMouseMove={showControls} onTouchStart={showControls} role="dialog" aria-label={`Obraz: ${picture.title}`}>
      <div className="picture-fullscreen-blur" style={{ backgroundImage: `url("${picture.src}")` }} aria-hidden="true" />
      <img key={picture.src} src={picture.src} alt={picture.title} />
      <div className="picture-fullscreen-caption">{picture.title}</div>
      <div className="picture-fullscreen-controls">
        <button onClick={() => onMove(-1)} aria-label="Poprzedni obraz"><ChevronLeft /></button>
        {slideshow && <button onClick={onTogglePause} aria-label={paused ? 'Wznów pokaz slajdów' : 'Wstrzymaj pokaz slajdów'}>{paused ? <Play /> : <Pause />}</button>}
        <span>{index + 1} / {pictures.length}</span>
        <button onClick={() => onMove(1)} aria-label="Następny obraz"><ChevronRight /></button>
        <button className="picture-fullscreen-close" onClick={close} aria-label="Zamknij pełny ekran"><X /></button>
      </div>
    </div>,
    document.body,
  )
}
