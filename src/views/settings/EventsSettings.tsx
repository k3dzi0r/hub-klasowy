import { CalendarPlus, PartyPopper, Plus, Trash2 } from 'lucide-react'
import { IconPicker } from '../../components/IconPicker'
import type { DayHighlight } from '../../data/content'
import { dayKey, isoDate } from '../../lib/dates'
import { newId } from '../../lib/images'
import type { AppData, ClassEvent, DayCandidate, HolidayOverride } from '../../types'

const eventIcons = [
  { icon: '🚌', label: 'Wycieczka', color: '#2563eb' },
  { icon: '⭐', label: 'Święto', color: '#7c3aed' },
  { icon: '🎉', label: 'Uroczystość', color: '#db2777' },
  { icon: '🎭', label: 'Teatr / kino', color: '#9333ea' },
  { icon: '⚽', label: 'Sport', color: '#16a34a' },
  { icon: '🍳', label: 'Gotowanie', color: '#ea580c' },
  { icon: '🎨', label: 'Warsztaty', color: '#0891b2' },
  { icon: '👪', label: 'Spotkanie z rodzicami', color: '#0d9488' },
  { icon: '🏫', label: 'Szkoła', color: '#475569' },
  { icon: '🎄', label: 'Święta', color: '#15803d' },
  { icon: '📌', label: 'Inne', color: '#64748b' },
]

type EventsProps = { data: AppData; today: Date; onChange: (next: AppData) => void }

export function EventsSettings({ data, today, onChange }: EventsProps) {
  const todayIso = isoDate(today)
  const sortedEvents = [...data.events].sort((a, b) => a.date.localeCompare(b.date))
  const updateEvent = (id: string, patch: Partial<ClassEvent>) => onChange({ ...data, events: data.events.map((item) => item.id === id ? { ...item, ...patch } : item) })
  const addEvent = () => onChange({ ...data, events: [...data.events, { id: newId('event'), date: todayIso, title: 'Nowe wydarzenie', icon: '📌', color: '#64748b' }] })
  const removeEvent = (id: string) => onChange({ ...data, events: data.events.filter((item) => item.id !== id) })

  return (
    <section className="panel settings-section span-two">
      <div className="settings-title-row"><div><CalendarPlus /><h2>Wydarzenia</h2><span>Wycieczki, uroczystości, dni tematyczne. Urodziny uczniów dodają się same.</span></div><button onClick={addEvent}><Plus /> Dodaj wydarzenie</button></div>
      <div className="event-editor-list">
        {sortedEvents.map((event) => (
          <div key={event.id} className={`event-editor-row ${event.date < todayIso ? 'is-past' : ''}`}>
            <select className="event-icon-select" aria-label={`Ikona: ${event.title}`} value={event.icon} onChange={(input) => updateEvent(event.id, { icon: input.target.value, color: eventIcons.find((option) => option.icon === input.target.value)?.color ?? event.color })}>
              {!eventIcons.some((option) => option.icon === event.icon) && <option value={event.icon}>{event.icon}</option>}
              {eventIcons.map((option) => <option key={option.icon} value={option.icon}>{option.icon} {option.label}</option>)}
            </select>
            <input aria-label="Data wydarzenia" type="date" value={event.date} onChange={(input) => updateEvent(event.id, { date: input.target.value })} />
            <input aria-label="Nazwa wydarzenia" placeholder="Nazwa wydarzenia" value={event.title} onChange={(input) => updateEvent(event.id, { title: input.target.value })} />
            <button className="icon-delete" onClick={() => removeEvent(event.id)} aria-label={`Usuń wydarzenie ${event.title}`}><Trash2 /></button>
          </div>
        ))}
        {!data.events.length && <p className="settings-hint">Brak wydarzeń. Kliknij „Dodaj wydarzenie”.</p>}
      </div>
      {data.events.some((event) => event.date < todayIso) && <p className="settings-hint">Minione wydarzenia są wyszarzone i nie pokazują się na stronie głównej.</p>}
    </section>
  )
}

type HolidayProps = { data: AppData; today: Date; todayCandidates: DayCandidate[]; highlight: DayHighlight | null; onChange: (next: AppData) => void }

export function HolidaySettings({ data, today, todayCandidates, highlight, onChange }: HolidayProps) {
  const todayKey = dayKey(today)
  const override = data.holidayOverride?.date === todayKey ? data.holidayOverride : null

  const chooseHoliday = (candidateId: string) => {
    let next: HolidayOverride | null = null
    if (candidateId === 'custom') next = { date: todayKey, candidateId, custom: { name: highlight?.name ?? '', icon: highlight?.icon ?? '⭐', shortText: highlight?.shortText ?? '' } }
    else if (candidateId !== 'auto') next = { date: todayKey, candidateId }
    onChange({ ...data, holidayOverride: next })
  }
  const updateCustomHoliday = (patch: Partial<NonNullable<HolidayOverride['custom']>>) => {
    if (!override?.custom) return
    onChange({ ...data, holidayOverride: { ...override, custom: { ...override.custom, ...patch } } })
  }

  return (
    <section className="panel settings-section span-two">
      <div className="settings-title-row"><div><PartyPopper /><h2>Nietypowe święto — dziś</h2><span>Co pokazać w karcie „Dziś jest…” na stronie głównej.</span></div></div>
      <label>Święto lub temat dnia
        <select value={override?.candidateId ?? 'auto'} onChange={(event) => chooseHoliday(event.target.value)}>
          <option value="auto">Automatycznie{todayCandidates[0] ? ` (${todayCandidates.find((candidate) => candidate.autoDisplay)?.name ?? todayCandidates[0].name})` : ''}</option>
          {todayCandidates.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.icon} {candidate.name}{candidate.candidateType === 'theme' ? ' (temat dnia)' : ''}</option>)}
          <option value="custom">Własne święto…</option>
        </select>
      </label>
      {override?.custom && (
        <>
          <label>Nazwa<input value={override.custom.name} onChange={(event) => updateCustomHoliday({ name: event.target.value })} /></label>
          <div className="settings-icon-field"><span>Ikona</span><IconPicker value={override.custom.icon} label="Ikona własnego święta" showText onChange={(icon) => updateCustomHoliday({ icon })} /></div>
          <label>Krótki opis<textarea value={override.custom.shortText} onChange={(event) => updateCustomHoliday({ shortText: event.target.value })} /></label>
        </>
      )}
      <p className="settings-hint">Wybór dotyczy tylko dzisiejszego dnia. Jutro święto wybierze się samo z kalendarza.</p>
    </section>
  )
}
