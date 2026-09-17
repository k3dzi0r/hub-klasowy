import { EmptyState } from '../components/EmptyState'
import { NowNext } from '../components/NowNext'
import { Timer } from '../components/Timer'
import type { Navigate, ScheduleItem } from '../types'

type Props = {
  current: ScheduleItem | null
  next: ScheduleItem | null
  /** Weekend — brak zajęć. */
  dayOff: boolean
  timerMinutes: number
  onNavigate: Navigate
}

export function NowNextView({ current, next, dayOff, timerMinutes, onNavigate }: Props) {
  if (!current || !next) {
    if (dayOff) return <section className="panel"><EmptyState icon="🌤️" title="Dziś nie ma zajęć" text="Weekend — Teraz i Potem wrócą w poniedziałek." actionLabel="Zobacz plan tygodnia" onAction={() => onNavigate('schedule')} /></section>
    return <section className="panel"><EmptyState icon="🗓️" title="Brak planu na dziś" text="Dodaj zajęcia na ten dzień tygodnia w Ustawieniach, a tutaj pojawi się Teraz i Potem." actionLabel="Dodaj plan dnia" onAction={() => onNavigate('settings', 'plan')} /></section>
  }

  return (
    <div className="now-next-view">
      <NowNext current={current} next={next} fullscreen />
      <div className="now-next-progress">
        <span className="progress-dot" />
        <div><strong>Najpierw {current.shortTitle.toLowerCase()}, potem {next.shortTitle.toLowerCase()}.</strong><span>Spokojnie, krok po kroku.</span></div>
      </div>
      <Timer minutes={timerMinutes} startTime={current.time} endTime={current.endTime} activityTitle={current.title} />
    </div>
  )
}
