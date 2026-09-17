import { useSyncExternalStore } from 'react'

/** Tablica interaktywna 4:3 / 5:4 — ten sam warunek co w styles.css. */
export const BOARD_4_3_QUERY = '(min-width: 1000px) and (min-height: 700px) and (max-aspect-ratio: 8/5)'

export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
  )
}
