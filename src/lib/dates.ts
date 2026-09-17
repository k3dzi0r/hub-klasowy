import type { Season } from '../types'

const pad = (value: number) => String(value).padStart(2, '0')

/** Klucz dnia w formacie MM-DD (jak w plikach JSON). */
export const dayKey = (date: Date) => `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

/** Data w formacie RRRR-MM-DD w lokalnej strefie czasowej. */
export const isoDate = (date: Date) => `${date.getFullYear()}-${dayKey(date)}`

export const isSameDay = (a: Date, b: Date) => isoDate(a) === isoDate(b)

export function dayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.round((new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() - start.getTime()) / 86_400_000)
}

/** Kalendarzowe pory roku: 21.03, 22.06, 23.09, 22.12. */
export function seasonForDate(date: Date): Season {
  const value = (date.getMonth() + 1) * 100 + date.getDate()
  if (value >= 321 && value < 622) return 'spring'
  if (value >= 622 && value < 923) return 'summer'
  if (value >= 923 && value < 1222) return 'autumn'
  return 'winter'
}

export const seasons: Record<Season, { label: string; background: string }> = {
  spring: { label: 'Wiosna', background: `${import.meta.env.BASE_URL}backgrounds/wiosna.jpg` },
  summer: { label: 'Lato', background: `${import.meta.env.BASE_URL}backgrounds/lato.jpg` },
  autumn: { label: 'Jesień', background: `${import.meta.env.BASE_URL}backgrounds/jesien.jpg` },
  winter: { label: 'Zima', background: `${import.meta.env.BASE_URL}backgrounds/zima.jpg` },
}
