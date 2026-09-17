import { useEffect, useState } from 'react'
import { isSameDay } from '../lib/dates'

/** Aktualna data, odświeżana po północy (ekran może działać przez kilka dni). */
export function useToday() {
  const [today, setToday] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => {
      setToday((current) => {
        const now = new Date()
        return isSameDay(current, now) ? current : now
      })
    }, 60_000)
    return () => window.clearInterval(timer)
  }, [])

  return today
}
