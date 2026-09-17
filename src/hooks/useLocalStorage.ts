import { useEffect, useState } from 'react'

/**
 * Stan zapisywany w pamięci przeglądarki.
 * `normalize` uzupełnia zapisane dane o nowe pola bez kasowania zmian nauczyciela.
 * Trzeci element to informacja, że ostatni zapis się nie udał (np. brak miejsca na zdjęcia).
 */
export function useLocalStorage<T>(key: string, initialValue: T | (() => T), normalize?: (saved: unknown) => T) {
  const [value, setValue] = useState<T>(() => {
    const fallback = initialValue instanceof Function ? initialValue() : initialValue
    try {
      const saved = window.localStorage.getItem(key)
      if (!saved) return fallback
      const parsed: unknown = JSON.parse(saved)
      return normalize ? normalize(parsed) : (parsed as T)
    } catch {
      return fallback
    }
  })
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    let failed = false
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn('Nie udało się zapisać danych lokalnie.', error)
      failed = true
    }
    // Stan błędu zmieniamy asynchronicznie, żeby nie wywoływać kaskady renderów w efekcie.
    const timer = window.setTimeout(() => setSaveFailed(failed), 0)
    return () => window.clearTimeout(timer)
  }, [key, value])

  return [value, setValue, saveFailed] as const
}
