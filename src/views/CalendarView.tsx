import { CalendarHeart, ChevronLeft, ChevronRight, PartyPopper } from 'lucide-react'
import { useState } from 'react'
import { loadHolidays, useLoaded, type DayHighlight } from '../data/content'
import { birthdayOn, genitive, upcomingEvents } from '../lib/birthdays'
import { dayKey, isoDate } from '../lib/dates'
import type { ClassEvent, Student } from '../types'

type Props = {
  events: ClassEvent[]
  students: Student[]
  highlight: DayHighlight | null
  today: Date
}

const weekdays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
const monthNames = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
const monthGenitive = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']

export function CalendarView({ events, students, highlight, today }: Props) {
  const [cursor, setCursor] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState(today.getDate())
  const holidays = useLoaded(loadHolidays)
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const days = new Date(year, month + 1, 0).getDate()
  const leading = (new Date(year, month, 1).getDay() + 6) % 7
  const selectedDate = new Date(year, month, selectedDay)

  const eventsOn = (date: Date) => events.filter((event) => event.date === isoDate(date))
  const selectedEvents = eventsOn(selectedDate)
  const selectedBirthdays = birthdayOn(students, selectedDate)
  const selectedHolidays = (holidays ?? [])
    .filter((holiday) => holiday.date === dayKey(selectedDate) && holiday.enabled && holiday.schoolSuitable)
    .sort((a, b) => b.priority - a.priority)

  const moveMonth = (delta: number) => {
    setCursor(new Date(year, month + delta, 1))
    setSelectedDay(1)
  }

  const goTo = (date: Date) => {
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1))
    setSelectedDay(date.getDate())
  }

  return (
    <div className="calendar-layout">
      <section className="panel calendar-panel">
        <div className="calendar-toolbar">
          <h2>{monthNames[month]} {year}</h2>
          <div>
            <button onClick={() => moveMonth(-1)} aria-label="Poprzedni miesiąc"><ChevronLeft /></button>
            <button className="today-button" onClick={() => goTo(today)}>Dziś</button>
            <button onClick={() => moveMonth(1)} aria-label="Następny miesiąc"><ChevronRight /></button>
          </div>
        </div>
        <div className="calendar-grid weekdays">
          {weekdays.map((day) => <span key={day}>{day}</span>)}
        </div>
        <div className="calendar-grid days">
          {Array.from({ length: leading }, (_, index) => <span key={`empty-${index}`} className="empty" />)}
          {Array.from({ length: days }, (_, index) => {
            const day = index + 1
            const date = new Date(year, month, day)
            const dayEvents = eventsOn(date)
            const birthdays = birthdayOn(students, date)
            const isToday = isoDate(date) === isoDate(today)
            return (
              <button key={day} className={`${selectedDay === day ? 'selected' : ''} ${isToday ? 'today' : ''}`} onClick={() => setSelectedDay(day)}>
                <span>{day}</span>
                <div className="calendar-dots">
                  {birthdays.map((student) => <b key={student.id} title={`Urodziny ${genitive(student.name)}`}>🎂</b>)}
                  {dayEvents.map((event) => <i key={event.id} style={{ background: event.color }} />)}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <aside className="calendar-side">
        <section className="panel selected-date-card">
          <span>Wybrany dzień</span>
          <strong>{selectedDay} {monthGenitive[month]}</strong>
          {selectedBirthdays.map((student) => (
            <div className="selected-event birthday" key={student.id}><span>🎂</span><strong>Urodziny {genitive(student.name)}</strong></div>
          ))}
          {selectedEvents.map((event) => (
            <div className="selected-event" key={event.id}><span>{event.icon}</span><strong>{event.title}</strong></div>
          ))}
          {!selectedEvents.length && !selectedBirthdays.length && <p>W tym dniu nie ma wydarzeń klasowych.</p>}
          {selectedHolidays.length > 0 && (
            <div className="day-holidays">
              <small><PartyPopper aria-hidden="true" /> Nietypowe święta</small>
              {selectedHolidays.map((holiday) => (
                <div key={holiday.id} className={holiday.recommended ? 'recommended' : ''}><span aria-hidden="true">{holiday.icon}</span>{holiday.name}</div>
              ))}
            </div>
          )}
        </section>
        <section className="panel all-events-card">
          <div className="panel-heading"><h2>Najbliższe wydarzenia</h2><CalendarHeart /></div>
          {upcomingEvents(events, students, today).slice(0, 6).map((event) => (
            <button key={event.id} onClick={() => goTo(new Date(`${event.date}T12:00:00`))}>
              <span aria-hidden="true">{event.icon}</span><div><strong>{event.title}</strong><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: event.date.startsWith(String(today.getFullYear())) ? undefined : 'numeric' })}</small></div>
            </button>
          ))}
        </section>
        {highlight && <section className="panel holiday-strip"><span>{highlight.icon}</span><div><small>{highlight.candidateType === 'theme' ? 'Temat dnia' : 'Dziś jest'}</small><strong>{highlight.name}</strong></div></section>}
      </aside>
    </div>
  )
}
