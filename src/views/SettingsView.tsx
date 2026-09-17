import { Save, ShieldCheck } from 'lucide-react'
import type { DayHighlight } from '../data/content'
import type { Classroom } from '../hooks/useClassroom'
import { isoDate } from '../lib/dates'
import type { AppData, DayCandidate, ScheduleItem, SettingsTab } from '../types'
import { AnnouncementsSettings } from './settings/AnnouncementsSettings'
import { AppearanceSettings } from './settings/AppearanceSettings'
import { BackupSettings } from './settings/BackupSettings'
import { ClassesSettings } from './settings/ClassesSettings'
import { ClassInfoSettings, WeatherSettings } from './settings/ClassSettings'
import { EventsSettings, HolidaySettings } from './settings/EventsSettings'
import { NowNextSettings } from './settings/NowNextSettings'
import { ScheduleSettings } from './settings/ScheduleSettings'
import { StudentsSettings } from './settings/StudentsSettings'
import { settingsTabs } from './settings/tabs'
import { TasksSettings } from './settings/TasksSettings'

type Props = {
  data: AppData
  todaySchedule: ScheduleItem[]
  classroom: Classroom
  tab: SettingsTab
  today: Date
  todayCandidates: DayCandidate[]
  highlight: DayHighlight | null
  onTabChange: (tab: SettingsTab) => void
  onChange: (next: AppData) => void
  onReset: () => void
}

export function SettingsView({ data, todaySchedule, classroom, tab, today, todayCandidates, highlight, onTabChange, onChange, onReset }: Props) {
  const todayIso = isoDate(today)
  const counts: Partial<Record<SettingsTab, number>> = {
    klasa: classroom.index?.classes.length,
    uczniowie: data.students.length,
    wydarzenia: data.events.filter((event) => event.date >= todayIso).length,
    komunikaty: data.announcements.length,
    dyzury: data.tasks.length,
  }

  const content = (() => {
    switch (tab) {
      case 'uczniowie': return <StudentsSettings data={data} onChange={onChange} />
      case 'plan': return <><ScheduleSettings data={data} today={today} onChange={onChange} /><NowNextSettings data={data} todaySchedule={todaySchedule} onChange={onChange} /></>
      case 'wydarzenia': return <><EventsSettings data={data} today={today} onChange={onChange} /><HolidaySettings data={data} today={today} todayCandidates={todayCandidates} highlight={highlight} onChange={onChange} /></>
      case 'komunikaty': return <AnnouncementsSettings data={data} onChange={onChange} />
      case 'dyzury': return <TasksSettings data={data} onChange={onChange} />
      case 'wyglad': return <><AppearanceSettings data={data} today={today} onChange={onChange} /><WeatherSettings data={data} onChange={onChange} /></>
      case 'dane': return <BackupSettings data={data} classroom={classroom} onChange={onChange} onReset={onReset} />
      default: return <><ClassInfoSettings data={data} onChange={onChange} /><ClassesSettings classroom={classroom} /></>
    }
  })()

  return (
    <div className="settings-view">
      <div className="teacher-banner"><ShieldCheck /><div><h2>Tryb nauczyciela — {data.classInfo.name}</h2><p>Zmiany zapisują się automatycznie.</p></div><span><Save /> Zapisano</span></div>

      <nav className="settings-tabs" aria-label="Kategorie ustawień">
        {settingsTabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={tab === id ? 'active' : ''} onClick={() => onTabChange(id)} aria-current={tab === id ? 'page' : undefined}>
            <Icon aria-hidden="true" />
            <span>{label}</span>
            {counts[id] !== undefined && <small>{counts[id]}</small>}
          </button>
        ))}
      </nav>

      <div className="settings-grid" key={tab}>{content}</div>
    </div>
  )
}
