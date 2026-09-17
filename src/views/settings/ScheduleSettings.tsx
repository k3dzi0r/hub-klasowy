import { CalendarClock, Copy, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { DayTabs } from '../../components/DayTabs'
import { IconPicker } from '../../components/IconPicker'
import { newId } from '../../lib/images'
import { sortSchedule, WEEKDAYS, weekdayOf } from '../../lib/appData'
import type { AppData, ScheduleItem, Weekday } from '../../types'

type Props = { data: AppData; today: Date; onChange: (next: AppData) => void }

const addMinutes = (time: string, minutes: number) => {
  const [hours, mins] = time.split(':').map(Number)
  const total = Math.min(23 * 60 + 59, hours * 60 + mins + minutes)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function ScheduleSettings({ data, today, onChange }: Props) {
  const todayWeekday = weekdayOf(today)
  const [day, setDay] = useState<Weekday>(todayWeekday ?? 1)
  const schedule = data.weekSchedule[day]
  const dayInfo = WEEKDAYS.find((item) => item.day === day)!
  const counts = Object.fromEntries(WEEKDAYS.map((item) => [item.day, data.weekSchedule[item.day].length])) as Record<Weekday, number>

  const setSchedule = (next: ScheduleItem[]) => onChange({ ...data, weekSchedule: { ...data.weekSchedule, [day]: next } })
  const update = (id: string, patch: Partial<ScheduleItem>, resort = false) => {
    const next = schedule.map((item) => item.id === id ? { ...item, ...patch } : item)
    setSchedule(resort ? sortSchedule(next) : next)
  }

  const addActivity = () => {
    const last = schedule.at(-1)
    const time = last?.endTime ?? '08:00'
    setSchedule([...schedule, { id: newId('activity'), time, endTime: addMinutes(time, 45), title: 'Nowe zajęcia', shortTitle: 'Nowe zajęcia', icon: '📘', instruction: '', color: 'blue' }])
  }

  const copyFrom = (source: Weekday) => {
    const sourceInfo = WEEKDAYS.find((item) => item.day === source)!
    if (schedule.length && !window.confirm(`Zastąpić plan na ${dayInfo.accusative} planem z ${sourceInfo.genitive}?`)) return
    setSchedule(data.weekSchedule[source].map((item) => ({ ...item, id: newId('activity') })))
  }
  const copySources = WEEKDAYS.filter((item) => item.day !== day && counts[item.day] > 0)

  return (
    <section className="panel settings-section span-two">
      <div className="settings-title-row"><div><CalendarClock /><h2>Plan dnia</h2><span>Każdy dzień tygodnia ma własny plan. Wybierz dzień i ustaw godziny, ikony i nazwy zajęć.</span></div><button onClick={addActivity}><Plus /> Dodaj zajęcia</button></div>
      <DayTabs value={day} onChange={setDay} today={todayWeekday} counts={counts} />
      {copySources.length > 0 && (
        <div className="schedule-copy-row">
          <span><Copy aria-hidden="true" /> {schedule.length ? `Zastąp plan na ${dayInfo.accusative} planem z:` : `Skopiuj plan na ${dayInfo.accusative} z:`}</span>
          {copySources.map((item) => <button key={item.day} type="button" onClick={() => copyFrom(item.day)} title={`Skopiuj plan z ${item.genitive}`}>{item.name}</button>)}
        </div>
      )}
      <div className="schedule-editor" key={day}>
        {schedule.map((item) => (
          <div key={item.id} className="schedule-editor-row">
            <input aria-label={`Początek: ${item.title}`} type="time" value={item.time} onChange={(event) => update(item.id, { time: event.target.value }, true)} />
            <input aria-label={`Koniec: ${item.title}`} type="time" value={item.endTime} onChange={(event) => update(item.id, { endTime: event.target.value })} />
            <IconPicker value={item.icon} label={`Ikona: ${item.title}`} onChange={(icon) => update(item.id, { icon })} />
            <input aria-label="Nazwa zajęć" value={item.title} onChange={(event) => update(item.id, { title: event.target.value, shortTitle: event.target.value })} />
            <input aria-label={`Wskazówka: ${item.title}`} placeholder="Wskazówka, np. „Jemy i odpoczywamy.”" value={item.instruction ?? ''} onChange={(event) => update(item.id, { instruction: event.target.value })} />
            <button className="icon-delete" onClick={() => setSchedule(schedule.filter((entry) => entry.id !== item.id))} aria-label={`Usuń zajęcia: ${item.title}`}><Trash2 /></button>
          </div>
        ))}
        {!schedule.length && <p className="settings-hint">Plan na {dayInfo.accusative} jest pusty. Kliknij „Dodaj zajęcia”{copySources.length ? ' albo skopiuj plan z innego dnia' : ''}.</p>}
      </div>
      <p className="settings-hint">Kolejność ustawia się sama według godziny rozpoczęcia. Kliknij ikonę, żeby wybrać inną.</p>
    </section>
  )
}
