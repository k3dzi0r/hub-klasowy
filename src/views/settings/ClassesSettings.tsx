import { Check, Plus, Trash2, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Classroom } from '../../hooks/useClassroom'

type Props = { classroom: Classroom }

export function ClassesSettings({ classroom }: Props) {
  const [name, setName] = useState('')
  const { index } = classroom
  if (!index) return null

  const add = async (event: FormEvent) => {
    event.preventDefault()
    await classroom.addClass(name || 'Nowa klasa')
    setName('')
  }

  const remove = async (id: string, className: string) => {
    if (!window.confirm(`Usunąć klasę „${className}” razem z uczniami, planem i galerią? Tej operacji nie da się cofnąć (chyba że masz kopię danych).`)) return
    await classroom.deleteClass(id)
  }

  return (
    <section className="panel settings-section">
      <div className="settings-title-row"><div><Users /><h2>Klasy w tej sali</h2><span>Każda klasa ma własnych uczniów, plan, komunikaty i galerię. Klasę zmienisz też, klikając jej nazwę w lewym górnym rogu.</span></div></div>
      <div className="classes-list">
        {index.classes.map((item) => (
          <div key={item.id} className={`classes-row ${item.id === index.activeId ? 'active' : ''}`}>
            <strong>{item.name || 'Bez nazwy'}</strong>
            {item.id === index.activeId
              ? <span className="classes-active"><Check aria-hidden="true" /> Aktywna</span>
              : <button onClick={() => void classroom.switchClass(item.id)}>Przełącz</button>}
            <button className="icon-delete" disabled={index.classes.length < 2} onClick={() => void remove(item.id, item.name)} aria-label={`Usuń klasę ${item.name}`}><Trash2 /></button>
          </div>
        ))}
      </div>
      <form className="place-search classes-add" onSubmit={add}>
        <input aria-label="Nazwa nowej klasy" placeholder="Nazwa nowej klasy, np. Klasa 8A" value={name} onChange={(event) => setName(event.target.value)} />
        <button type="submit"><Plus aria-hidden="true" /> Dodaj klasę</button>
      </form>
      <p className="settings-hint">Nowa klasa dostaje przykładowy plan dnia oraz ustawienia sali (pogoda, wygląd) z obecnej klasy.</p>
    </section>
  )
}
