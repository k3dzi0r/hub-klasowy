import { AlertCircle, Bell, CalendarClock, Megaphone } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import type { Announcement, Navigate } from '../types'

type Props = { announcements: Announcement[]; onNavigate: Navigate }

const kindIcons = { Ważne: AlertCircle, Przypomnienie: Bell, 'Zmiana planu': CalendarClock }

export function AnnouncementsView({ announcements, onNavigate }: Props) {
  return (
    <div className="announcements-view">
      <div className="announcements-intro"><Megaphone /><div><h2>Komunikaty</h2><p>Najważniejsze informacje dla naszej klasy.</p></div></div>
      {!announcements.length && <section className="panel"><EmptyState icon="📣" title="Brak komunikatów" text="Dodaj komunikat dla klasy." actionLabel="Dodaj komunikat" onAction={() => onNavigate('settings', 'komunikaty')} /></section>}
      <div className="announcement-grid">
        {announcements.map((announcement) => {
          const Icon = kindIcons[announcement.kind]
          return (
            <article key={announcement.id} className={`announcement-card ${announcement.kind === 'Ważne' ? 'important' : announcement.kind === 'Zmiana planu' ? 'change' : 'reminder'}`}>
              <div className="announcement-kind"><Icon /><span>{announcement.kind}</span></div>
              <h2>{announcement.title}</h2>
              <p>{announcement.text}</p>
            </article>
          )
        })}
      </div>
      <div className="calm-message"><span>☀️</span>Każdy dzień to nowa okazja, żeby zrobić coś dobrego.</div>
    </div>
  )
}
