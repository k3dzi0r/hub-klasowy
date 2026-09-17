import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { DayTabs } from '../components/DayTabs'
import { EmptyState } from '../components/EmptyState'
import { WEEKDAYS, weekdayOf } from '../lib/appData'
import type { Announcement, Navigate, WeekSchedule, Weekday } from '../types'

type Props = {
  weekSchedule: WeekSchedule
  today: Date
  announcements: Announcement[]
  currentId: string
  nextId: string
  onCurrentChange: (id: string) => void
  onNavigate: Navigate
}

export function ScheduleView({ weekSchedule, today, announcements, currentId, nextId, onCurrentChange, onNavigate }: Props) {
  const todayWeekday = weekdayOf(today)
  // Domyślnie dzisiejszy plan; w weekend — plan na poniedziałek.
  const [day, setDay] = useState<Weekday>(todayWeekday ?? 1)
  const [selectedId, setSelectedId] = useState(currentId)
  const isToday = day === todayWeekday
  const schedule = weekSchedule[day]
  const selected = schedule.find((item) => item.id === selectedId) ?? (isToday ? schedule.find((item) => item.id === currentId) : undefined) ?? schedule[0]
  const next = isToday ? schedule.find((item) => item.id === nextId) ?? schedule[1] : undefined
  const reminder = announcements.find((item) => item.kind === 'Przypomnienie')
  const dayName = WEEKDAYS.find((item) => item.day === day)!.name
  const currentIndex = isToday ? schedule.findIndex((entry) => entry.id === currentId) : -1
  // Najbliższa data wybranego dnia: dziś, jutro albo w kolejnych dniach.
  const daysAhead = (day - today.getDay() + 7) % 7
  const dayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + daysAhead)
  const dateLabel = dayDate.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', ...(daysAhead === 0 ? { year: 'numeric' } : {}) })

  return (
    <div className="two-column-view schedule-view">
      <section className="panel large-schedule" aria-label="Plan dnia">
        <DayTabs value={day} onChange={setDay} today={todayWeekday} />
        <div className="date-strip">
          <span>{dayName}</span>
          <strong>{daysAhead === 1 ? `jutro · ${dateLabel}` : dateLabel}</strong>
        </div>
        {schedule.length ? (
          <div className="schedule-list">
            {schedule.map((item, index) => {
              const isCurrent = isToday && item.id === currentId
              return (
                <button key={item.id} className={`${isCurrent ? 'current' : ''} ${selected?.id === item.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)}>
                  <time>{item.time}</time>
                  <span className="schedule-icon" aria-hidden="true">{item.icon}</span>
                  <strong>{item.title}</strong>
                  {currentIndex > index && <CheckCircle2 className="done-icon" aria-label="Zakończone" />}
                  {isCurrent && <span className="now-chip">TERAZ</span>}
                </button>
              )
            })}
          </div>
        ) : (
          <EmptyState icon="🗓️" title={`Brak planu — ${dayName.toLowerCase()}`} text="Dodaj zajęcia na ten dzień w Ustawieniach." actionLabel="Dodaj plan dnia" onAction={() => onNavigate('settings', 'plan')} />
        )}
      </section>

      <aside className="schedule-detail">
        {selected && (
          <section className={`panel detail-card tone-${selected.color}`}>
            <span className="detail-label">{isToday ? 'Wybrana aktywność' : dayName}</span>
            <div className="detail-icon" aria-hidden="true">{selected.icon}</div>
            <h2>{selected.title}</h2>
            {selected.instruction && <p>{selected.instruction}</p>}
            <div className="time-range">{selected.time}–{selected.endTime}</div>
            {isToday && selected.id !== currentId && <button className="primary wide" onClick={() => onCurrentChange(selected.id)}>Ustaw jako TERAZ</button>}
          </section>
        )}

        {next && (
          <section className="panel next-mini">
            <span className="detail-label">Potem</span>
            <div><span aria-hidden="true">{next.icon}</span><strong>{next.shortTitle}</strong><ArrowRight /></div>
          </section>
        )}

        {reminder && (
          <section className="panel remember-card">
            <span aria-hidden="true">🎒</span>
            <div><strong>{reminder.title}</strong><p>{reminder.text}</p></div>
          </section>
        )}
      </aside>
    </div>
  )
}
