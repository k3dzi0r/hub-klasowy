import { useEffect, useRef } from 'react'
import type { ScheduleItem } from '../types'

/** Zmiana zajęć o danej godzinie: co się zaczyna, co się kończy i — gdy jest przerwa w planie — co będzie dalej. */
export type BellEvent = { time: string; started?: ScheduleItem; ended?: ScheduleItem; next?: ScheduleItem }

const currentMinute = () => {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function bellEventAt(schedule: ScheduleItem[], time: string): BellEvent | null {
  const started = schedule.find((item) => item.time === time)
  const ended = schedule.find((item) => item.endTime === time)
  if (!started && !ended) return null
  return { time, started, ended, next: started ? undefined : schedule.find((item) => item.time > time) }
}

/**
 * Dzwonek według planu: gdy zegar wejdzie w minutę, w której zajęcia się zaczynają albo kończą.
 * Po uruchomieniu i po wybudzeniu komputera nie dzwoni za minione godziny.
 */
export function useBell(schedule: ScheduleItem[], onBell: (event: BellEvent) => void) {
  const scheduleRef = useRef(schedule)
  const onBellRef = useRef(onBell)
  useEffect(() => {
    scheduleRef.current = schedule
    onBellRef.current = onBell
  })

  useEffect(() => {
    let lastMinute = currentMinute()
    const timer = window.setInterval(() => {
      const minute = currentMinute()
      if (minute === lastMinute) return
      lastMinute = minute
      const event = bellEventAt(scheduleRef.current, minute)
      if (event) onBellRef.current(event)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])
}
