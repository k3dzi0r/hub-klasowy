import { useEffect, useState } from 'react'
import type { WeatherLocation } from '../types'

export type Weather = {
  locationKey: string
  temperature: number
  code: number
  isDay: boolean
  wind: number
  precipitationChance: number | null
  updatedAt: number
}

type ForecastResponse = {
  current: { temperature_2m: number; weather_code: number; wind_speed_10m: number; is_day: number }
  daily?: { precipitation_probability_max?: (number | null)[] }
}

const CACHE_KEY = 'hub-klasowy-weather'
const REFRESH_MS = 15 * 60 * 1000

const locationKeyOf = (location: WeatherLocation) => `${location.latitude.toFixed(3)},${location.longitude.toFixed(3)}`

function readCache(key: string) {
  try {
    const cached = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? 'null') as Weather | null
    return cached?.locationKey === key ? cached : null
  } catch {
    return null
  }
}

/** Aktualna pogoda z Open-Meteo (bez klucza API), odświeżana co 15 minut, z zapasową kopią offline. */
export function useWeather(location: WeatherLocation) {
  const key = locationKeyOf(location)
  const { latitude, longitude } = location
  const [weather, setWeather] = useState<Weather | null>(() => readCache(key))
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        const params = new URLSearchParams({
          latitude: String(latitude),
          longitude: String(longitude),
          current: 'temperature_2m,weather_code,wind_speed_10m,is_day',
          daily: 'precipitation_probability_max',
          wind_speed_unit: 'kmh',
          timezone: 'auto',
          forecast_days: '1',
        })
        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)
        if (!response.ok) throw new Error(`Open-Meteo: ${response.status}`)
        const data = (await response.json()) as ForecastResponse
        const next: Weather = {
          locationKey: key,
          temperature: data.current.temperature_2m,
          code: data.current.weather_code,
          isDay: data.current.is_day === 1,
          wind: data.current.wind_speed_10m,
          precipitationChance: data.daily?.precipitation_probability_max?.[0] ?? null,
          updatedAt: Date.now(),
        }
        if (!active) return
        setWeather(next)
        setFailed(false)
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(next))
      } catch (error) {
        console.warn('Nie udało się pobrać pogody.', error)
        if (active) setFailed(true)
      }
    }

    void load()
    const timer = window.setInterval(load, REFRESH_MS)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [key, latitude, longitude])

  const current = weather?.locationKey === key ? weather : readCache(key)
  return { weather: current, failed }
}

/** Opis i ikona dla kodów pogody WMO używanych przez Open-Meteo. */
export function describeWeather(code: number, isDay: boolean) {
  if (code === 0) return { label: isDay ? 'Słonecznie' : 'Bezchmurnie', icon: isDay ? '☀️' : '🌙' }
  if (code === 1) return { label: 'Przeważnie słonecznie', icon: isDay ? '🌤️' : '🌙' }
  if (code === 2) return { label: 'Częściowe zachmurzenie', icon: '⛅' }
  if (code === 3) return { label: 'Pochmurno', icon: '☁️' }
  if (code === 45 || code === 48) return { label: 'Mgła', icon: '🌫️' }
  if (code >= 51 && code <= 57) return { label: 'Mżawka', icon: '🌦️' }
  if (code === 66 || code === 67) return { label: 'Marznący deszcz', icon: '🌧️' }
  if (code >= 61 && code <= 65) return { label: code === 65 ? 'Ulewa' : 'Deszcz', icon: '🌧️' }
  if (code >= 71 && code <= 77) return { label: 'Śnieg', icon: '🌨️' }
  if (code >= 80 && code <= 82) return { label: 'Przelotny deszcz', icon: '🌦️' }
  if (code === 85 || code === 86) return { label: 'Przelotny śnieg', icon: '🌨️' }
  if (code >= 95) return { label: 'Burza', icon: '⛈️' }
  return { label: 'Pogoda', icon: '🌡️' }
}

export type GeocodingResult = { id: number; name: string; latitude: number; longitude: number; admin1?: string; country?: string }

export async function searchPlaces(query: string) {
  const params = new URLSearchParams({ name: query, count: '6', language: 'pl', format: 'json' })
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`)
  if (!response.ok) throw new Error(`Geocoding: ${response.status}`)
  const data = (await response.json()) as { results?: GeocodingResult[] }
  return data.results ?? []
}
