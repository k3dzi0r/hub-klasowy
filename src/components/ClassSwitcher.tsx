import { Check, Plus, Settings, X } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Classroom } from '../hooks/useClassroom'

type Props = {
  classroom: Classroom
  onClose: () => void
  onManage: () => void
}

/** Wysuwany panel z listą klas: szybka zmiana klasy przy tablicy i dodanie nowej. */
export function ClassSwitcher({ classroom, onClose, onManage }: Props) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const { index } = classroom
  if (!index) return null

  const add = async (event: FormEvent) => {
    event.preventDefault()
    await classroom.addClass(name || 'Nowa klasa')
    onClose()
  }

  return (
    <div className="class-switcher-backdrop" onClick={onClose}>
      <div className="class-switcher glass" role="dialog" aria-label="Wybierz klasę" onClick={(event) => event.stopPropagation()}>
        <div className="class-switcher-head">
          <strong>Wybierz klasę</strong>
          <button onClick={onClose} aria-label="Zamknij"><X /></button>
        </div>
        <div className="class-switcher-list">
          {index.classes.map((item) => (
            <button key={item.id} className={item.id === index.activeId ? 'active' : ''} onClick={async () => { await classroom.switchClass(item.id); onClose() }}>
              <span>{item.name || 'Bez nazwy'}</span>
              {item.id === index.activeId && <Check aria-label="Aktywna" />}
            </button>
          ))}
        </div>
        {adding ? (
          <form className="class-switcher-add" onSubmit={add}>
            <input autoFocus placeholder="Nazwa nowej klasy" value={name} onChange={(event) => setName(event.target.value)} />
            <button type="submit" className="primary">Utwórz</button>
          </form>
        ) : (
          <div className="class-switcher-actions">
            <button onClick={() => setAdding(true)}><Plus /> Nowa klasa</button>
            <button onClick={() => { onManage(); onClose() }}><Settings /> Zarządzaj</button>
          </div>
        )}
      </div>
    </div>
  )
}
