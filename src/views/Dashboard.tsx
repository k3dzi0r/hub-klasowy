import { CalendarDays, ChevronRight, Lightbulb } from 'lucide-react'
import type { CSSProperties } from 'react'
import { EmptyState } from '../components/EmptyState'
import { NowNext } from '../components/NowNext'
import { Presence } from '../components/Presence'
import { Timer } from '../components/Timer'
import type { DayHighlight } from '../data/content'
import { BOARD_4_3_QUERY, useMediaQuery } from '../hooks/useMediaQuery'
import { weekdayOf } from '../lib/appData'
import { upcomingEvents } from '../lib/birthdays'
import { isoDate } from '../lib/dates'
import type { AppData, Navigate, ScheduleItem } from '../types'

type DashboardProps = {
  data: AppData
  /** Plan na dziś. */
  schedule: ScheduleItem[]
  today: Date
  highlight: DayHighlight | null
  current: ScheduleItem | null
  next: ScheduleItem | null
  onNavigate: Navigate
  onTogglePresence: (id: number) => void
}

const MAX_PLAN_ROWS = 12
const MAX_PLAN_ROWS_BOARD = 9

export function Dashboard({ data, schedule, today, highlight, current, next, onNavigate, onTogglePresence }: DashboardProps) {
  const todayIso = isoDate(today)
  const events = upcomingEvents(data.events, data.students, today).slice(0, 5)
  // Na tablicy 4:3 plan pokazuje mniej wierszy, a timer przechodzi do dolnego rzędu, żeby karty Teraz / Potem były szersze.
  const board = useMediaQuery(BOARD_4_3_QUERY)
  const planRows = board ? MAX_PLAN_ROWS_BOARD : MAX_PLAN_ROWS
  const currentIndex = Math.max(0, schedule.findIndex((item) => item.id === current?.id))
  const planStart = Math.max(0, Math.min(currentIndex - 2, schedule.length - planRows))
  const plan = schedule.slice(planStart, planStart + planRows)
  const dayOff = weekdayOf(today) === null
  const timer = current && <Timer minutes={data.timerMinutes} startTime={current.time} endTime={current.endTime} activityTitle={current.title} compact />

  return (
    <div className="dashboard">
      <div className="dashboard-primary">
        <Presence students={data.students} onToggle={onTogglePresence} today={today} compact onAddStudents={() => onNavigate('settings', 'uczniowie')} />

        <div className="dashboard-focus-row">
          {current && next ? <NowNext current={current} next={next} onOpen={() => onNavigate('now-next')} /> : <section className="panel now-next-empty">{dayOff ? <EmptyState icon="🌤️" title="Dziś nie ma zajęć" text="Weekend — plan wróci w poniedziałek." actionLabel="Zobacz plan tygodnia" onAction={() => onNavigate('schedule')} /> : <EmptyState icon="🗓️" title="Brak planu na dziś" text="Dodaj zajęcia na ten dzień tygodnia, a tutaj pojawi się Teraz i Potem." actionLabel="Dodaj plan dnia" onAction={() => onNavigate('settings', 'plan')} />}</section>}
          {!board && timer}
        </div>
      </div>

      <section className="panel schedule-preview" aria-labelledby="schedule-preview-title">
        <div className="panel-heading">
          <h2 id="schedule-preview-title">Plan dnia</h2>
          <button className="text-link" onClick={() => onNavigate('schedule')}>Pełny plan <ChevronRight /></button>
        </div>
        <div className="schedule-list compact-list" style={{ '--rows': plan.length } as CSSProperties}>
          {plan.map((item, index) => {
            const state = item.id === current?.id ? 'current' : planStart + index < currentIndex ? 'past' : ''
            return (
              <button key={item.id} className={state} onClick={() => onNavigate('schedule')}>
                <time>{item.time}</time>
                <span className="schedule-icon" aria-hidden="true">{item.icon}</span>
                <strong>{item.shortTitle}</strong>
                {state === 'current' && <span className="now-chip">TERAZ</span>}
              </button>
            )
          })}
        </div>
      </section>

      <div className="dashboard-side">
        <section className="panel holiday-card" aria-labelledby="holiday-title">
          <div className="panel-kicker">{highlight?.candidateType === 'theme' ? 'Temat dnia' : 'Dziś jest…'}</div>
          {highlight ? (
            <>
              <div className="holiday-body">
                <span className="holiday-icon" aria-hidden="true">{highlight.icon}</span>
                <div><h2 id="holiday-title">{highlight.name}</h2><p>{highlight.shortText}</p></div>
              </div>
              {highlight.activity && <p className="holiday-activity"><Lightbulb aria-hidden="true" />{highlight.activity}</p>}
            </>
          ) : (
            <div className="holiday-body"><span className="holiday-icon" aria-hidden="true">📅</span><h2 id="holiday-title">Wczytuję święto dnia…</h2></div>
          )}
        </section>

        <section className="panel events-card" aria-labelledby="events-title">
          <div className="panel-heading"><h2 id="events-title">Ważne wydarzenia</h2><CalendarDays aria-hidden="true" /></div>
          {!events.length && <p className="event-list-empty">Brak zaplanowanych wydarzeń. Dodasz je w Ustawieniach.</p>}
          <div className="event-list">
            {events.map((event) => (
              <button key={event.id} className={event.date === todayIso ? 'is-today' : ''} onClick={() => onNavigate('calendar')}>
                <time>{event.date === todayIso ? 'DZIŚ' : new Date(`${event.date}T12:00:00`).toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit' })}</time>
                <span aria-hidden="true">{event.icon}</span>
                <strong>{event.title}</strong>
                <ChevronRight />
              </button>
            ))}
          </div>
        </section>

        <section className="panel mood-mini" aria-labelledby="mood-mini-title">
          <div className="panel-heading"><h2 id="mood-mini-title">Jak się dziś czujesz?</h2></div>
          <button onClick={() => onNavigate('choices')}><span>😊</span>Dobrze</button>
          <button onClick={() => onNavigate('choices')}><span>😌</span>Spokojnie</button>
          <button onClick={() => onNavigate('choices')}><span>😔</span>Smutno</button>
          <button onClick={() => onNavigate('choices')}><span>😠</span>Źle</button>
        </section>

        {board && timer}
      </div>
    </div>
  )
}
