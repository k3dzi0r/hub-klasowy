import { Check } from 'lucide-react'
import { useState } from 'react'

const moods = [
  { id: 'good', label: 'Dobrze', symbol: '🙂', tone: 'green' },
  { id: 'calm', label: 'Spokojnie', symbol: '😌', tone: 'amber' },
  { id: 'sad', label: 'Smutno', symbol: '😔', tone: 'blue' },
  { id: 'angry', label: 'Źle / zdenerwowany', symbol: '😠', tone: 'rose' },
]

const breakChoices = [
  { id: 'music', label: 'Muzyka', symbol: '🎧' },
  { id: 'puzzle', label: 'Puzzle', symbol: '🧩' },
  { id: 'walk', label: 'Spacer', symbol: '🚶' },
  { id: 'drawing', label: 'Rysowanie', symbol: '✏️' },
]

export function ChoicesView() {
  const [mood, setMood] = useState<string | null>(null)
  const [choice, setChoice] = useState<string | null>(null)

  return (
    <div className="choices-view">
      <section className="panel choice-section">
        <div className="choice-heading"><span>🙂</span><div><h2>Jak się dziś czujesz?</h2><p>Wybierz swoją odpowiedź.</p></div></div>
        <div className="mood-grid">
          {moods.map((item) => (
            <button key={item.id} className={`${item.tone} ${mood === item.id ? 'selected' : ''}`} onClick={() => setMood((selected) => selected === item.id ? null : item.id)}>
              <span className="choice-check">{mood === item.id && <Check />}</span>
              <span aria-hidden="true">{item.symbol}</span><strong>{item.label}</strong>
            </button>
          ))}
        </div>
      </section>

      <section className="panel choice-section break-choice">
        <div className="choice-heading"><span>☕</span><div><h2>Co chcesz robić na przerwie?</h2><p>Wybierz jedną rzecz.</p></div></div>
        <div className="break-grid">
          {breakChoices.map((item) => (
            <button key={item.id} className={choice === item.id ? 'selected' : ''} onClick={() => setChoice((selected) => selected === item.id ? null : item.id)}>
              <span className="choice-check">{choice === item.id && <Check />}</span>
              <span aria-hidden="true">{item.symbol}</span><strong>{item.label}</strong>
            </button>
          ))}
        </div>
        {choice && <div className="choice-confirmation" role="status"><Check /> Wybrano: {breakChoices.find((item) => item.id === choice)?.label}</div>}
      </section>
    </div>
  )
}
