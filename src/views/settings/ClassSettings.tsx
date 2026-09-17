import { MapPin, School, Search } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { searchPlaces, type GeocodingResult } from '../../hooks/useWeather'
import type { AppData } from '../../types'

type Props = { data: AppData; onChange: (next: AppData) => void }

export function ClassInfoSettings({ data, onChange }: Props) {
  return (
    <section className="panel settings-section">
      <div className="settings-title-row"><div><School /><h2>Klasa</h2><span>Nazwa i hasło w lewym górnym rogu.</span></div></div>
      <label>Nazwa klasy<input value={data.classInfo.name} placeholder="np. Klasa 7B" onChange={(event) => onChange({ ...data, classInfo: { ...data.classInfo, name: event.target.value } })} /></label>
      <label>Hasło klasy<input value={data.classInfo.tagline} placeholder="np. Razem możemy więcej" onChange={(event) => onChange({ ...data, classInfo: { ...data.classInfo, tagline: event.target.value } })} /></label>
    </section>
  )
}

export function WeatherSettings({ data, onChange }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodingResult[]>([])
  const [message, setMessage] = useState('')

  const search = async (event: FormEvent) => {
    event.preventDefault()
    if (query.trim().length < 2) return
    setMessage('Szukam…')
    try {
      const found = await searchPlaces(query.trim())
      setResults(found)
      setMessage(found.length ? '' : 'Nie znaleziono takiej miejscowości.')
    } catch {
      setMessage('Brak połączenia z wyszukiwarką.')
    }
  }

  return (
    <section className="panel settings-section">
      <div className="settings-title-row"><div><MapPin /><h2>Pogoda</h2><span>Dane: Open-Meteo, odświeżanie co 15 minut.</span></div></div>
      <p className="settings-current"><MapPin aria-hidden="true" /> {data.weatherLocation ? <>Teraz: <strong>{data.weatherLocation.name}</strong></> : 'Miejscowość nie jest ustawiona.'}</p>
      <form className="place-search" onSubmit={search}>
        <input aria-label="Nazwa miejscowości" placeholder="Wpisz miejscowość szkoły" value={query} onChange={(event) => setQuery(event.target.value)} />
        <button type="submit"><Search aria-hidden="true" /> Szukaj</button>
      </form>
      {message && <p className="settings-hint">{message}</p>}
      {results.length > 0 && (
        <div className="place-results">
          {results.map((place) => (
            <button key={place.id} onClick={() => { onChange({ ...data, weatherLocation: { name: place.name, latitude: place.latitude, longitude: place.longitude } }); setResults([]); setQuery('') }}>
              <strong>{place.name}</strong><span>{[place.admin1, place.country].filter(Boolean).join(', ')}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
