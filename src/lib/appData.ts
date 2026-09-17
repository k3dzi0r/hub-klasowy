import { announcements } from '../data/announcements'
import { demoEvents, demoGallery, demoStudents, demoTasks } from '../data/demo'
import { events } from '../data/events'
import { galleryItems } from '../data/gallery'
import { schedule } from '../data/schedule'
import { students } from '../data/students'
import { tasks } from '../data/tasks'

// Wersja demo (GitHub Pages, `vite build --mode demo`) startuje z przykładową klasą zamiast pustej.
const isDemo = import.meta.env.MODE === 'demo'
import { titleFromFileName } from '../data/relaxMedia'
import type { AppData, ScheduleItem, WeekSchedule, Weekday } from '../types'
import { inlineGallery } from './galleryFiles'
import { getStorageInfo } from './storage'

export const STORAGE_KEY = 'hub-klasowy-data-v8'

export const DEFAULT_GALLERY_CATEGORIES = ['Zajęcia', 'Wycieczki', 'Kuchnia', 'Urodziny', 'Projekty', 'Inne']
export const FALLBACK_CATEGORY = 'Inne'

const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export const sortSchedule = (items: ScheduleItem[]) => [...items].sort((a, b) => toMinutes(a.time) - toMinutes(b.time))

/** Indeks trwających zajęć, a poza nimi — najbliższych (albo ostatnich po zakończeniu dnia). -1 gdy plan jest pusty. */
export function findCurrentScheduleIndex(items: ScheduleItem[]) {
  if (!items.length) return -1
  const now = new Date()
  const minutesNow = now.getHours() * 60 + now.getMinutes()
  const index = items.findIndex((item) => minutesNow >= toMinutes(item.time) && minutesNow < toMinutes(item.endTime))
  if (index >= 0) return index
  const nextIndex = items.findIndex((item) => minutesNow < toMinutes(item.time))
  return nextIndex >= 0 ? nextIndex : items.length - 1
}

/** Dni nauki z formami do zdań: „plan na środę”, „kopiuj ze środy”. */
export const WEEKDAYS: { day: Weekday; short: string; name: string; accusative: string; genitive: string }[] = [
  { day: 1, short: 'Pn', name: 'Poniedziałek', accusative: 'poniedziałek', genitive: 'poniedziałku' },
  { day: 2, short: 'Wt', name: 'Wtorek', accusative: 'wtorek', genitive: 'wtorku' },
  { day: 3, short: 'Śr', name: 'Środa', accusative: 'środę', genitive: 'środy' },
  { day: 4, short: 'Cz', name: 'Czwartek', accusative: 'czwartek', genitive: 'czwartku' },
  { day: 5, short: 'Pt', name: 'Piątek', accusative: 'piątek', genitive: 'piątku' },
]

/** Dzień nauki dla daty; null w sobotę i niedzielę. */
export function weekdayOf(date: Date): Weekday | null {
  const day = date.getDay()
  return day >= 1 && day <= 5 ? day as Weekday : null
}

/** Plan na dany dzień — w weekend pusty. */
export function scheduleForDate(data: Pick<AppData, 'weekSchedule'>, date: Date): ScheduleItem[] {
  const day = weekdayOf(date)
  return day ? data.weekSchedule[day] : []
}

/** Które zajęcia są TERAZ i POTEM według godziny. */
export function activityIdsFor(schedule: ScheduleItem[]) {
  const index = findCurrentScheduleIndex(schedule)
  const currentActivityId = schedule[index]?.id ?? ''
  return { currentActivityId, nextActivityId: schedule[Math.min(index + 1, schedule.length - 1)]?.id ?? currentActivityId }
}

export function withScheduleActivity(data: AppData): AppData {
  return { ...data, ...activityIdsFor(scheduleForDate(data, new Date())) }
}

const sameForWholeWeek = (items: ScheduleItem[]): WeekSchedule => ({ 1: items, 2: items, 3: items, 4: items, 5: items })

/** Plan tygodnia z zapisanych danych. Starsze wersje miały jeden plan na wszystkie dni — kopiujemy go na każdy dzień. */
function normalizeWeekSchedule(saved: Partial<Record<Weekday, ScheduleItem[]>> | undefined, legacy: ScheduleItem[] | undefined, fallback: WeekSchedule): WeekSchedule {
  if (saved && typeof saved === 'object') {
    return Object.fromEntries(WEEKDAYS.map(({ day }) => [day, sortSchedule(Array.isArray(saved[day]) ? saved[day] : [])])) as WeekSchedule
  }
  if (Array.isArray(legacy)) return sameForWholeWeek(sortSchedule(legacy))
  return fallback
}

/** Pusta aplikacja: bez uczniów i danych osobowych, z przykładowym planem dnia. */
export function createDefaultData(): AppData {
  return withScheduleActivity({
    classInfo: { name: 'Nasza klasa', tagline: 'Małe kroki, wielkie możliwości!' },
    weatherLocation: null,
    students: isDemo ? demoStudents : students,
    weekSchedule: sameForWholeWeek(schedule),
    events: isDemo ? demoEvents : events,
    holidayOverride: null,
    announcements,
    tasks: isDemo ? demoTasks : tasks,
    gallery: isDemo ? demoGallery : galleryItems,
    galleryCategories: DEFAULT_GALLERY_CATEGORIES,
    currentActivityId: '',
    nextActivityId: '',
    timerMinutes: 25,
    autoSchedule: true,
    bellSound: true,
    bellMessage: true,
    seasonMode: 'auto',
    glassOpacity: 0.68,
  })
}

/** Uzupełnia dane zapisane przez starszą wersję aplikacji (albo wczytane z pliku) o brakujące pola. */
export function normalizeData(saved: unknown): AppData {
  const defaults = createDefaultData()
  if (!saved || typeof saved !== 'object') return defaults
  const { holiday, schedule: legacySchedule, ...rest } = saved as Partial<AppData> & { holiday?: unknown; schedule?: ScheduleItem[] }
  void holiday // stare, ręcznie wpisane święto — teraz święta pochodzą z plików JSON
  const data: AppData = { ...defaults, ...rest, classInfo: { ...defaults.classInfo, ...rest.classInfo } }
  const usedCategories = (data.gallery ?? []).map((item) => item.category).filter(Boolean)
  const galleryCategories = [...new Set([...(data.galleryCategories ?? DEFAULT_GALLERY_CATEGORIES), ...usedCategories, FALLBACK_CATEGORY])].filter((name) => name !== 'Uczniowie')
  return {
    ...data,
    weatherLocation: data.weatherLocation ?? null,
    galleryCategories,
    // Zdjęcia z pierwszej wersji leżały w /students/ — tych plików już nie ma, więc pokazujemy inicjały.
    students: (data.students ?? []).map((student) => student.photo?.startsWith('/students/') ? { ...student, photo: '' } : student),
    // Przykładowe zdjęcia galerii z pierwszej wersji wskazywały usunięte pliki /students/ — dodane przez nauczyciela zostają.
    gallery: (data.gallery ?? []).filter((item) => !item.src?.startsWith('/students/')),
    weekSchedule: normalizeWeekSchedule(rest.weekSchedule, legacySchedule, defaults.weekSchedule),
    // Przykładowe urodziny z pierwszej wersji miały złą datę; urodziny liczą się teraz z danych uczniów.
    events: (data.events ?? []).filter((event) => !(event.id === 'event-1' && event.title.startsWith('Urodziny '))),
  }
}

type ExportFile = { app: 'hub-klasowy'; version: 1; exportedAt: string; data: AppData }

/** Plik kopii jednej klasy. Zdjęcia galerii z folderu są w nim spakowane, żeby kopia była kompletna. */
export async function exportDataFile(data: AppData, classId: string) {
  const gallery = (await getStorageInfo()).kind === 'folder' ? await inlineGallery(classId, data.gallery, titleFromFileName) : data.gallery
  const file: ExportFile = { app: 'hub-klasowy', version: 1, exportedAt: new Date().toISOString(), data: { ...data, gallery } }
  const blob = new Blob([JSON.stringify(file)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const safeName = data.classInfo.name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ł/g, 'l').replace(/Ł/g, 'L').replace(/[^\w-]+/g, '-').replace(/^-|-$/g, '').toLowerCase()
  link.href = url
  link.download = `hub-klasowy-${safeName || 'klasa'}-${new Date().toISOString().slice(0, 10)}.json`
  document.body.append(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function readDataFile(file: File): Promise<AppData> {
  const parsed = JSON.parse(await file.text()) as Partial<ExportFile>
  if (parsed?.app !== 'hub-klasowy' || !parsed.data) throw new Error('To nie jest plik z danymi huba klasowego.')
  return withScheduleActivity(normalizeData(parsed.data))
}
