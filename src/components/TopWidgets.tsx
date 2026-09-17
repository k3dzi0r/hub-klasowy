import { MapPin, Umbrella, Wind } from 'lucide-react'
import { useEffect, useState } from 'react'
import { quoteForDate } from '../data/content'
import { describeWeather, useWeather } from '../hooks/useWeather'
import type { WeatherLocation } from '../types'

const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
const weekdays = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']

export function Clock({ compact = false }: { compact?: boolean }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const time = now.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })
  const date = `${weekdays[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`

  if (compact) {
    return (
      <div className="clock-compact glass" aria-label={`Jest godzina ${time}. ${date}`}>
        <strong>{time}</strong>
        <span>{weekdays[now.getDay()]}, {now.getDate()} {months[now.getMonth()]}</span>
      </div>
    )
  }

  return (
    <div className="clock" aria-label={`Jest godzina ${time}. ${date}`}>
      <strong>{time}</strong>
      <span>{date}</span>
    </div>
  )
}

export function WeatherCard({ location, onSetup }: { location: WeatherLocation | null; onSetup: () => void }) {
  if (!location) {
    return (
      <button className="weather-card glass is-empty" onClick={onSetup}>
        <span className="weather-icon" aria-hidden="true">🌤️</span>
        <span className="weather-main"><strong>Pogoda</strong><span><MapPin aria-hidden="true" /> Ustaw miejscowość</span></span>
      </button>
    )
  }
  return <LiveWeather location={location} />
}

function LiveWeather({ location }: { location: WeatherLocation }) {
  const { weather, failed } = useWeather(location)

  if (!weather) {
    return (
      <div className="weather-card glass is-empty" role="status">
        <span className="weather-icon" aria-hidden="true">🌤️</span>
        <div className="weather-main"><strong>--°C</strong><span>{failed ? 'Brak połączenia z pogodą' : 'Sprawdzam pogodę…'}</span></div>
      </div>
    )
  }

  const { label, icon } = describeWeather(weather.code, weather.isDay)
  const temperature = Math.round(weather.temperature)
  const updated = new Date(weather.updatedAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="weather-card glass" aria-label={`Pogoda w miejscowości ${location.name}: ${temperature} stopni, ${label}`} title={`${location.name} · aktualizacja ${updated}${failed ? ' · brak połączenia' : ''}`}>
      <span className="weather-icon" aria-hidden="true">{icon}</span>
      <div className="weather-main"><strong>{temperature}°C</strong><span>{label}</span></div>
      <div className="weather-details">
        <span><Wind aria-hidden="true" />Wiatr {Math.round(weather.wind)} km/h</span>
        <span><Umbrella aria-hidden="true" />Opady {weather.precipitationChance ?? 0}%</span>
      </div>
    </div>
  )
}

/** Cytat dnia z pliku JSON; dotknięcie pokazuje kolejny, a następnego dnia wraca nowy cytat dnia. */
export function QuoteCard({ today }: { today: Date }) {
  const [offset, setOffset] = useState(0)
  const quote = quoteForDate(today, offset)
  if (!quote) return null

  return (
    <button className="quote-card glass" onClick={() => setOffset((value) => value + 1)} aria-label={`Cytat dnia: ${quote.text}. Kliknij, aby zobaczyć kolejny.`}>
      <span className="quote-text">„{quote.text}”</span>
      {quote.author && <span className="quote-author">— {quote.author}</span>}
    </button>
  )
}
