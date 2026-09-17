import { Bell, CalendarDays, CalendarHeart, Database, ListChecks, Palette, School, Users, type LucideIcon } from 'lucide-react'
import type { SettingsTab } from '../../types'

export const settingsTabs: { id: SettingsTab; label: string; icon: LucideIcon }[] = [
  { id: 'klasa', label: 'Klasa', icon: School },
  { id: 'uczniowie', label: 'Uczniowie', icon: Users },
  { id: 'plan', label: 'Plan dnia', icon: CalendarDays },
  { id: 'wydarzenia', label: 'Wydarzenia', icon: CalendarHeart },
  { id: 'komunikaty', label: 'Komunikaty', icon: Bell },
  { id: 'dyzury', label: 'Dyżury', icon: ListChecks },
  { id: 'wyglad', label: 'Wygląd i pogoda', icon: Palette },
  { id: 'dane', label: 'Dane i kopia', icon: Database },
]
