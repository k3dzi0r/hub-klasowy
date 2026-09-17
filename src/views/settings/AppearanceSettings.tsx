import { Palette } from 'lucide-react'
import { seasonForDate, seasons } from '../../lib/dates'
import type { AppData, Season } from '../../types'

type Props = { data: AppData; today: Date; onChange: (next: AppData) => void }

const seasonChoices: ('auto' | Season)[] = ['auto', 'spring', 'summer', 'autumn', 'winter']

export function AppearanceSettings({ data, today, onChange }: Props) {
  const autoSeason = seasonForDate(today)
  return (
    <section className="panel settings-section span-two">
      <div className="settings-title-row"><div><Palette /><h2>Wygląd ekranu</h2><span>Tło i kolory według pory roku oraz przezroczystość kart.</span></div></div>
      <div className="season-picker" role="radiogroup" aria-label="Pora roku: tło i kolory">
        {seasonChoices.map((choice) => {
          const season = choice === 'auto' ? autoSeason : choice
          return (
            <button key={choice} role="radio" aria-checked={data.seasonMode === choice} className={data.seasonMode === choice ? 'selected' : ''} onClick={() => onChange({ ...data, seasonMode: choice })}>
              <span className="season-thumb" style={{ backgroundImage: `url('${seasons[season].background}')` }} />
              <strong>{choice === 'auto' ? 'Automatycznie' : seasons[choice].label}</strong>
              <small>{choice === 'auto' ? `Według daty — teraz: ${seasons[autoSeason].label.toLowerCase()}` : 'Tło i kolory na stałe'}</small>
            </button>
          )
        })}
      </div>
      <label className="range-field">
        <span>Przezroczystość kart <b>{Math.round((1 - data.glassOpacity) * 100)}%</b></span>
        <input type="range" min="0.35" max="0.95" step="0.01" value={data.glassOpacity} onChange={(event) => onChange({ ...data, glassOpacity: Number(event.target.value) })} />
        <small><span>Więcej tła</span><span>Lepsza czytelność</span></small>
      </label>
    </section>
  )
}
