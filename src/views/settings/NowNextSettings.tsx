import { BellRing, Timer } from 'lucide-react'
import { playBell } from '../../lib/chime'
import type { AppData, ScheduleItem } from '../../types'

type Props = { data: AppData; todaySchedule: ScheduleItem[]; onChange: (next: AppData) => void }

export function NowNextSettings({ data, todaySchedule, onChange }: Props) {
  return (
    <section className="panel settings-section">
      <div className="settings-title-row"><div><Timer /><h2>Teraz / Potem i timer</h2><span>Automatyczne przełączanie zajęć, dzwonek i domyślny czas timera.</span></div></div>
      <label className="auto-schedule-toggle"><span><strong>Automatycznie według planu</strong><small>Przełącza lekcje, przerwy i timer.</small></span><input type="checkbox" checked={data.autoSchedule} onChange={(event) => onChange({ ...data, autoSchedule: event.target.checked })} /><i /></label>
      <label>TERAZ (dzisiejszy plan)<select disabled={data.autoSchedule} value={data.currentActivityId} onChange={(event) => onChange({ ...data, currentActivityId: event.target.value })}>{todaySchedule.map((item) => <option key={item.id} value={item.id}>{item.time} — {item.title}</option>)}</select></label>
      <label>POTEM (dzisiejszy plan)<select disabled={data.autoSchedule} value={data.nextActivityId} onChange={(event) => onChange({ ...data, nextActivityId: event.target.value })}>{todaySchedule.map((item) => <option key={item.id} value={item.id}>{item.time} — {item.title}</option>)}</select></label>

      <div className="bell-settings">
        <h3><BellRing aria-hidden="true" /> Dzwonek</h3>
        <label className="auto-schedule-toggle"><span><strong>Dźwięk na początek i koniec zajęć</strong><small>Zamiast szkolnego dzwonka. Szybko wyciszysz go przyciskiem z dzwonkiem obok zegara.</small></span><input type="checkbox" checked={data.bellSound} onChange={(event) => onChange({ ...data, bellSound: event.target.checked })} /><i /></label>
        <label className="auto-schedule-toggle"><span><strong>Komunikat na ekranie</strong><small>Np. „Teraz: Przerwa śniadaniowa”. Znika sam po 20 sekundach.</small></span><input type="checkbox" checked={data.bellMessage} onChange={(event) => onChange({ ...data, bellMessage: event.target.checked })} /><i /></label>
        <button type="button" className="bell-test" onClick={playBell}><BellRing aria-hidden="true" /> Posłuchaj dzwonka</button>
        <p className="settings-hint">Przeglądarka pozwala grać dźwięki dopiero po pierwszym dotknięciu ekranu. Po włączeniu komputera dotknij raz tablicy, np. listy obecności.</p>
      </div>

      <label>Domyślny czas timera ręcznego (minuty)<input type="number" min="1" max="180" value={data.timerMinutes} onChange={(event) => onChange({ ...data, timerMinutes: Number(event.target.value) })} /></label>
    </section>
  )
}
