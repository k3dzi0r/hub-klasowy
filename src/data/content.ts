import { useEffect, useState } from 'react'
import { dayOfYear } from '../lib/dates'
import type { CalendarDay, DayCandidate, HolidayOverride, Quote } from '../types'
import quotesFile from './content/cytaty_hub_klasowy.json'
import dailyCalendarUrl from './content/kalendarz_dzienny_hub_v2.json?url'
import holidaysUrl from './content/nietypowe_swieta_hub_v2.json?url'

export type DayHighlight = Pick<DayCandidate, 'id' | 'name' | 'icon' | 'shortText' | 'activity' | 'candidateType'>

export const quotes = (quotesFile.quotes as Quote[]).filter((quote) => quote.enabled && quote.schoolSuitable)

// Duże pliki świąt są ładowane osobno, żeby nie powiększać głównego pakietu aplikacji.
const jsonCache = new Map<string, Promise<unknown>>()

function loadJson<T>(url: string) {
  let request = jsonCache.get(url)
  if (!request) {
    request = fetch(url).then((response) => {
      if (!response.ok) throw new Error(`Nie udało się wczytać ${url}`)
      return response.json()
    })
    request.catch(() => jsonCache.delete(url))
    jsonCache.set(url, request)
  }
  return request as Promise<T>
}

export const loadDailyCalendar = () => loadJson<{ days: CalendarDay[] }>(dailyCalendarUrl).then((file) => file.days)
export const loadHolidays = () => loadJson<DayCandidate[]>(holidaysUrl)

export function useLoaded<T>(load: () => Promise<T>) {
  const [value, setValue] = useState<T | null>(null)

  useEffect(() => {
    let active = true
    load()
      .then((result) => { if (active) setValue(result) })
      .catch((error: unknown) => console.warn('Nie udało się wczytać danych.', error))
    return () => { active = false }
  }, [load])

  return value
}

const bySuggestion = (a: DayCandidate, b: DayCandidate) => Number(b.autoDisplay) - Number(a.autoDisplay) || b.priority - a.priority

export function usableCandidates(day: CalendarDay | undefined) {
  return (day?.candidates ?? []).filter((candidate) => candidate.enabled && candidate.schoolSuitable).sort(bySuggestion)
}

/** Wybór „Dziś jest…”: ręczny wybór nauczyciela na ten dzień, a jeśli go nie ma — domyślny kandydat z pliku. */
export function pickDayHighlight(day: CalendarDay | undefined, override: HolidayOverride | null, key: string): DayHighlight | null {
  const activeOverride = override?.date === key ? override : null
  if (activeOverride?.custom) {
    return { id: 'custom', candidateType: 'holiday', activity: '', ...activeOverride.custom }
  }
  const candidates = usableCandidates(day)
  return candidates.find((candidate) => candidate.id === activeOverride?.candidateId)
    ?? candidates.find((candidate) => candidate.id === day?.defaultCandidateId)
    ?? candidates[0]
    ?? null
}

// Stała, pseudolosowa kolejność cytatów na dany rok — każdy dzień ma inny cytat, bez powtórek przez ~pół roku.
function seededOrder(length: number, seed: number) {
  let state = seed
  const random = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const order = Array.from({ length }, (_, index) => index)
  for (let index = length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1))
    ;[order[index], order[swap]] = [order[swap], order[index]]
  }
  return order
}

export function quoteForDate(date: Date, offset = 0) {
  const order = seededOrder(quotes.length, date.getFullYear())
  return quotes[order[(dayOfYear(date) + offset) % quotes.length]]
}
