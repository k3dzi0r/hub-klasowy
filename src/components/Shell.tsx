import {
  Bell,
  BellOff,
  BellRing,
  CalendarDays,
  ChevronDown,
  CheckSquare2,
  ChevronLeft,
  GalleryHorizontalEnd,
  Hand,
  Home,
  Leaf,
  ListChecks,
  Menu,
  Settings,
  Sprout,
  X,
} from 'lucide-react'
import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { dayKey, seasons } from '../lib/dates'
import type { Classroom } from '../hooks/useClassroom'
import type { ClassInfo, Navigate, NavItem, Season, SettingsTab, ViewId, WeatherLocation } from '../types'
import { ClassSwitcher } from './ClassSwitcher'
import { Clock, QuoteCard, WeatherCard } from './TopWidgets'

const navItems: NavItem[] = [
  { id: 'home', label: 'Strona główna', icon: Home },
  { id: 'schedule', label: 'Plan dnia', icon: CalendarDays },
  { id: 'now-next', label: 'Teraz / Potem', icon: ListChecks },
  { id: 'tasks', label: 'Nasze zadania', icon: CheckSquare2 },
  { id: 'calendar', label: 'Kalendarz', icon: CalendarDays },
  { id: 'gallery', label: 'Galeria', icon: GalleryHorizontalEnd },
  { id: 'choices', label: 'Wybory', icon: Hand },
  { id: 'relax', label: 'Muzyka i relaks', icon: Leaf },
  { id: 'announcements', label: 'Komunikaty', icon: Bell },
  { id: 'settings', label: 'Ustawienia', icon: Settings },
]

type ShellProps = {
  currentView: ViewId
  onNavigate: Navigate
  today: Date
  season: Season
  glassOpacity: number
  classInfo: ClassInfo
  weatherLocation: WeatherLocation | null
  saveFailed: boolean
  classroom: Classroom
  /** Dźwięk dzwonka włączony — przycisk obok ustawień pozwala go szybko wyciszyć. */
  bellSound: boolean
  onToggleBellSound: () => void
  children: ReactNode
}

export function Shell({ currentView, onNavigate, today, season, glassOpacity, classInfo, weatherLocation, saveFailed, classroom, bellSound, onToggleBellSound, children }: ShellProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [switcherOpen, setSwitcherOpen] = useState(false)
  const classCount = classroom.index?.classes.length ?? 1
  const activeLabel = useMemo(() => navItems.find((item) => item.id === currentView)?.label ?? 'Nasza klasa', [currentView])

  const navigate = (view: ViewId, tab?: SettingsTab) => {
    onNavigate(view, tab)
    setMenuOpen(false)
  }

  return (
    <div className="app-shell" data-season={season} style={{ '--glass-alpha': glassOpacity } as CSSProperties}>
      <div className="app-backdrop" style={{ backgroundImage: `url('${seasons[season].background}')` }} aria-hidden="true" />

      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`} aria-label="Główna nawigacja">
        <button className="brand" onClick={() => setSwitcherOpen(true)} aria-label={`Klasa: ${classInfo.name || 'Nasza klasa'}. Zmień klasę`}>
          <div className="brand-mark" aria-hidden="true"><Sprout /></div>
          <div>
            <strong>{classInfo.name || 'Nasza klasa'}{classCount > 1 && <ChevronDown aria-hidden="true" />}</strong>
            {classInfo.tagline && <span>{classInfo.tagline}</span>}
          </div>
        </button>

        <nav>
          {navItems.map(({ id, label, icon: Icon }) => (
            <button key={id} className={currentView === id ? 'active' : ''} onClick={() => navigate(id)} aria-current={currentView === id ? 'page' : undefined}>
              <Icon aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {menuOpen && <button className="menu-backdrop" aria-label="Zamknij menu" onClick={() => setMenuOpen(false)} />}

      <main className={`main-area ${currentView === 'home' ? 'is-home' : ''}`}>
        <header className={`topbar ${currentView === 'home' ? 'topbar-home' : ''}`}>
          <button className="mobile-menu" onClick={() => setMenuOpen((open) => !open)} aria-label={menuOpen ? 'Zamknij menu' : 'Otwórz menu'}>
            {menuOpen ? <X /> : <Menu />}
          </button>
          {currentView === 'home' ? (
            <Clock />
          ) : (
            <div className="page-title">
              <button onClick={() => navigate('home')} aria-label="Wróć na stronę główną"><ChevronLeft /></button>
              <div><span>{classInfo.name || 'Nasza klasa'}</span><h1>{activeLabel}</h1></div>
            </div>
          )}
          {currentView !== 'home' && <Clock compact />}
          <WeatherCard location={weatherLocation} onSetup={() => navigate('settings', 'wyglad')} />
          {currentView === 'home' && <QuoteCard key={dayKey(today)} today={today} />}
          <button className={`bell-toggle ${bellSound ? '' : 'muted'}`} onClick={onToggleBellSound} aria-pressed={!bellSound} aria-label={bellSound ? 'Dzwonek włączony — wycisz' : 'Dzwonek wyciszony — włącz dźwięk'} title={bellSound ? 'Wycisz dzwonek' : 'Włącz dzwonek'}>
            {bellSound ? <BellRing /> : <BellOff />}
          </button>
          <button className="teacher-shortcut" onClick={() => navigate('settings')} aria-label="Otwórz ustawienia nauczyciela">
            <Settings />
          </button>
        </header>

        {saveFailed && <div className="save-warning" role="alert">Brak miejsca na zapis zmian w przeglądarce. Usuń część zdjęć z galerii albo zrób kopię danych w Ustawieniach.</div>}
        <div className="view-stage" key={currentView}>{children}</div>
      </main>

      {switcherOpen && <ClassSwitcher classroom={classroom} onClose={() => setSwitcherOpen(false)} onManage={() => navigate('settings', 'klasa')} />}
    </div>
  )
}
