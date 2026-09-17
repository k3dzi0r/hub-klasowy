import { BellPlus, Plus, Trash2 } from 'lucide-react'
import { newId } from '../../lib/images'
import type { Announcement, AppData } from '../../types'

type Props = { data: AppData; onChange: (next: AppData) => void }

export function AnnouncementsSettings({ data, onChange }: Props) {
  const updateAnnouncement = (id: string, patch: Partial<Announcement>) => onChange({ ...data, announcements: data.announcements.map((item) => item.id === id ? { ...item, ...patch } : item) })
  const addAnnouncement = () => onChange({ ...data, announcements: [...data.announcements, { id: newId('announcement'), kind: 'Przypomnienie', title: 'Nowy komunikat', text: 'Wpisz krótką informację.' }] })
  const removeAnnouncement = (id: string) => onChange({ ...data, announcements: data.announcements.filter((item) => item.id !== id) })

  return (
    <section className="panel settings-section span-two">
      <div className="settings-title-row"><div><BellPlus /><h2>Komunikaty</h2><span>Karty w widoku Komunikaty; pierwsze „Przypomnienie” pokazuje się też w Planie dnia.</span></div><button onClick={addAnnouncement}><Plus /> Dodaj komunikat</button></div>
      <div className="editor-card-grid announcements-editor">
        {data.announcements.map((item) => <article key={item.id} className="editor-card">
          <div className="editor-card-top"><select aria-label="Typ komunikatu" value={item.kind} onChange={(event) => updateAnnouncement(item.id, { kind: event.target.value as Announcement['kind'] })}><option>Ważne</option><option>Przypomnienie</option><option>Zmiana planu</option></select><button className="icon-delete" onClick={() => removeAnnouncement(item.id)} aria-label={`Usuń komunikat ${item.title}`}><Trash2 /></button></div>
          <label>Tytuł<input value={item.title} onChange={(event) => updateAnnouncement(item.id, { title: event.target.value })} /></label>
          <label>Treść<textarea value={item.text} onChange={(event) => updateAnnouncement(item.id, { text: event.target.value })} /></label>
        </article>)}
      </div>
      {!data.announcements.length && <p className="settings-hint">Brak komunikatów. Kliknij „Dodaj komunikat”.</p>}
    </section>
  )
}
