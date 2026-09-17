import type { ClassEvent, Student } from '../types'
import { dayKey, isoDate } from './dates'

/** Dopełniacz imienia do napisu „Urodziny …” (Ivan → Ivana, Bartek → Bartka, Ola → Oli). */
export function genitive(name: string) {
  if (/ek$/i.test(name)) return `${name.slice(0, -2)}ka`
  if (/ia$/i.test(name)) return `${name.slice(0, -1)}`
  if (/[kglj]a$/i.test(name)) return `${name.slice(0, -1)}i`
  if (/a$/i.test(name)) return `${name.slice(0, -1)}y`
  if (/[yi]$/i.test(name)) return `${name}ego`
  return `${name}a`
}

export const isBirthdayToday = (student: Student, today: Date) => student.birthday === dayKey(today)

export const birthdayOn = (students: Student[], date: Date) => students.filter((student) => student.birthday === dayKey(date))

/** Najbliższe (dzisiejsze lub przyszłe) urodziny każdego ucznia jako wydarzenia. */
export function birthdayEvents(students: Student[], today: Date): ClassEvent[] {
  const todayIso = isoDate(today)
  return students.flatMap((student) => {
    if (!student.birthday) return []
    const [month, day] = student.birthday.split('-').map(Number)
    let date = new Date(today.getFullYear(), month - 1, day)
    if (isoDate(date) < todayIso) date = new Date(today.getFullYear() + 1, month - 1, day)
    return [{ id: `birthday-${student.id}`, date: isoDate(date), title: `Urodziny ${genitive(student.name)}`, icon: '🎂', color: '#f59e0b' }]
  })
}

/** Wydarzenia klasowe od dziś w górę razem z urodzinami, posortowane po dacie. */
export function upcomingEvents(events: ClassEvent[], students: Student[], today: Date) {
  const todayIso = isoDate(today)
  return [...events.filter((event) => event.date >= todayIso), ...birthdayEvents(students, today)]
    .sort((a, b) => a.date.localeCompare(b.date))
}
