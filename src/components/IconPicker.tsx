import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Emoji z Unicode ≤ 12 — wyświetlają się też na starszym Windows 10.
const iconGroups: { label: string; icons: string[] }[] = [
  { label: 'Dyżury i porządek', icons: ['🧹', '🧽', '🧼', '🗑️', '♻️', '🌱', '🌻', '💧', '🐟', '🐢', '💡', '🚪', '📋', '🗓️', '☀️', '🧺', '🍽️', '🔔', '🔑', '✅'] },
  { label: 'Szkoła i zajęcia', icons: ['📘', '📚', '📖', '✏️', '📝', '🖍️', '✂️', '📏', '🔢', '🔤', '🎨', '🎵', '💻', '🔬', '🌍', '🧩', '🎲', '🗣️', '👂', '🏫'] },
  { label: 'Jedzenie', icons: ['🍎', '🍌', '🥕', '🥪', '🍞', '🥗', '🍕', '🍪', '🥛', '🧃', '🍳', '🍴'] },
  { label: 'Ruch i odpoczynek', icons: ['🚶', '🏃', '🤸', '🧘', '⚽', '🏀', '🚴', '🏊', '🎈', '🌳', '🚌', '😴'] },
  { label: 'Uczucia i nagrody', icons: ['⭐', '🌟', '🏆', '🎉', '🎁', '🎂', '❤️', '😊', '🙂', '😌', '🤗', '👍', '👏', '💪'] },
  { label: 'Przyroda i pogoda', icons: ['🌸', '🍂', '❄️', '🌈', '🌧️', '⛄', '🐶', '🐱', '🐦', '🦋', '🐞', '🐝'] },
]

type Props = {
  value: string
  onChange: (icon: string) => void
  /** Opis dla czytnika ekranu i podpowiedzi, np. „Ikona: Lekcja 1”. */
  label: string
  /** Pokazuje napis „Zmień” obok ikony. */
  showText?: boolean
}

/** Przycisk z ikoną (emoji). Kliknięcie otwiera panel z gotowymi ikonami do wyboru. */
export function IconPicker({ value, onChange, label, showText = false }: Props) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = () => {
    setOpen(false)
    buttonRef.current?.focus()
  }

  return (
    <>
      <button ref={buttonRef} type="button" className={`icon-pick ${showText ? 'with-text' : ''}`} onClick={() => setOpen(true)} aria-label={`${label} — zmień`} title="Zmień ikonę">
        <span aria-hidden="true">{value || '＋'}</span>
        {showText && <small>Zmień</small>}
      </button>
      {open && <IconDialog value={value} label={label} onPick={(icon) => { onChange(icon); close() }} onClose={close} />}
    </>
  )
}

function IconDialog({ value, label, onPick, onClose }: { value: string; label: string; onPick: (icon: string) => void; onClose: () => void }) {
  const [custom, setCustom] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const selected = dialog?.querySelector<HTMLButtonElement>('.icon-option.selected') ?? dialog?.querySelector<HTMLButtonElement>('.icon-option')
    selected?.focus()
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const submitCustom = () => {
    const icon = custom.trim()
    if (icon) onPick(icon)
  }

  return createPortal(
    <div className="dialog-backdrop" onClick={onClose}>
      <div ref={dialogRef} className="icon-dialog panel" role="dialog" aria-modal="true" aria-labelledby="icon-dialog-title" onClick={(event) => event.stopPropagation()}>
        <div className="category-manager-head">
          <div><h2 id="icon-dialog-title">Wybierz ikonę</h2><span>{label}</span></div>
          <button type="button" onClick={onClose} aria-label="Zamknij"><X /></button>
        </div>
        <div className="icon-dialog-groups">
          {iconGroups.map((group) => (
            <section key={group.label} aria-label={group.label}>
              <h3>{group.label}</h3>
              <div className="icon-dialog-grid">
                {group.icons.map((icon) => (
                  <button key={icon} type="button" className={`icon-option ${icon === value ? 'selected' : ''}`} onClick={() => onPick(icon)} aria-pressed={icon === value}>{icon}</button>
                ))}
              </div>
            </section>
          ))}
        </div>
        <form className="icon-dialog-custom" onSubmit={(event) => { event.preventDefault(); submitCustom() }}>
          <label htmlFor="icon-dialog-custom">Inna ikona</label>
          <input id="icon-dialog-custom" value={custom} maxLength={16} placeholder="Wklej emoji albo Win + kropka" onChange={(event) => setCustom(event.target.value)} />
          <button type="submit" disabled={!custom.trim()}>Ustaw</button>
        </form>
      </div>
    </div>,
    // Poza panelem (jego backdrop-filter psuje position: fixed), ale w .app-shell, gdzie są kolory pory roku.
    document.querySelector('.app-shell') ?? document.body,
  )
}
