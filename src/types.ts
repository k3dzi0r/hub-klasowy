import type { LucideIcon } from 'lucide-react'

export type ViewId =
  | 'home'
  | 'schedule'
  | 'now-next'
  | 'calendar'
  | 'tasks'
  | 'gallery'
  | 'relax'
  | 'announcements'
  | 'choices'
  | 'settings'

export type SettingsTab = 'klasa' | 'uczniowie' | 'plan' | 'wydarzenia' | 'komunikaty' | 'dyzury' | 'wyglad' | 'dane'

/** Przejście do widoku; dla Ustawień można wskazać zakładkę. */
export type Navigate = (view: ViewId, tab?: SettingsTab) => void

export type Student = {
  id: number
  name: string
  fullName: string
  /** Adres lub zdjęcie zapisane jako data URL; pusty = inicjały. */
  photo: string
  present: boolean
  /** Dzień urodzin w formacie MM-DD. */
  birthday?: string
}

export type ScheduleItem = {
  id: string
  time: string
  endTime: string
  title: string
  shortTitle: string
  icon: string
  instruction?: string
  color: 'blue' | 'green' | 'amber' | 'rose' | 'violet' | 'cyan'
}

/** Dzień nauki jak w Date.getDay(): 1 = poniedziałek … 5 = piątek. */
export type Weekday = 1 | 2 | 3 | 4 | 5

/** Osobny plan na każdy dzień tygodnia. */
export type WeekSchedule = Record<Weekday, ScheduleItem[]>

export type ClassEvent = {
  id: string
  date: string
  title: string
  icon: string
  color: string
}

/** Kandydat na „Dziś jest…” z plików JSON (święto albo temat zastępczy). */
export type DayCandidate = {
  id: string
  date: string
  month: number
  day: number
  name: string
  sourceType: string
  category: string
  icon: string
  shortText: string
  activity: string
  candidateType: 'holiday' | 'theme'
  isHoliday: boolean
  priority: number
  recommended: boolean
  schoolSuitable: boolean
  autoDisplay: boolean
  enabled: boolean
}

export type CalendarDay = {
  date: string
  month: number
  day: number
  defaultCandidateId: string
  candidates: DayCandidate[]
}

export type Quote = {
  id: string
  text: string
  author: string | null
  category: string
  tone: string
  enabled: boolean
  schoolSuitable: boolean
  priority: number
}

/** Ręczny wybór nauczyciela na konkretny dzień (MM-DD). Następnego dnia wraca wybór automatyczny. */
export type HolidayOverride = {
  date: string
  candidateId: string
  custom?: { name: string; icon: string; shortText: string }
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter'

export type WeatherLocation = {
  name: string
  latitude: number
  longitude: number
}

export type Announcement = {
  id: string
  kind: 'Ważne' | 'Przypomnienie' | 'Zmiana planu'
  title: string
  text: string
}

export type ClassTask = {
  id: string
  title: string
  icon: string
  assigneeIds: number[]
  done: boolean
}

/**
 * Zdjęcie w galerii. Przy zapisie do folderu „dane” zdjęcie to plik `file` w dane/galeria/<klasa>/,
 * a tutaj zostaje tylko podpis i kategoria. `src` (data URL) — gdy aplikacja działa bez serwera albo w pliku kopii.
 */
export type GalleryItem = {
  id: string
  file?: string
  src?: string
  title: string
  category: string
  addedAt?: string
  uploaded?: boolean
}

export type ClassInfo = {
  name: string
  tagline: string
}

export type AppData = {
  classInfo: ClassInfo
  /** Miejscowość do pogody; null = jeszcze nie ustawiona. */
  weatherLocation: WeatherLocation | null
  students: Student[]
  weekSchedule: WeekSchedule
  events: ClassEvent[]
  holidayOverride: HolidayOverride | null
  announcements: Announcement[]
  tasks: ClassTask[]
  gallery: GalleryItem[]
  /** Kategorie galerii (bez „Wszystkie” i „Uczniowie”, które są stałe). */
  galleryCategories: string[]
  currentActivityId: string
  nextActivityId: string
  timerMinutes: number
  autoSchedule: boolean
  /** Dźwięk zamiast szkolnego dzwonka — na początek i koniec zajęć z planu. */
  bellSound: boolean
  /** Komunikat na ekranie przy zmianie zajęć („Teraz: Przerwa”). */
  bellMessage: boolean
  /** Pora roku sterująca tłem i kolorami; 'auto' = według daty. */
  seasonMode: 'auto' | Season
  /** Krycie kart od 0.35 (bardzo przezroczyste) do 0.95. */
  glassOpacity: number
}

export type NavItem = {
  id: ViewId
  label: string
  icon: LucideIcon
}
