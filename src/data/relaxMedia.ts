import { useEffect, useState } from 'react'
import { musicFiles, natureFiles, pictureFiles } from './relaxBundled'

// Obrazy i nagrania modułu relaksu.
// • W trakcie pracy (npm run dev) i w zwykłym buildzie: pliki z folderów src/assets/relaks/.
// • W paczce na Windows (npm run pakiet:windows, tryb „windows”): pliki z folderu „relaks” obok aplikacji — serwer podaje ich listę,
//   więc nowy plik wystarczy tam wrzucić i ponownie wejść w Relaks.
// Tytuł powstaje z nazwy pliku, a numer na początku („01 …”) ustala kolejność.

export type MediaItem = { id: string; title: string; src: string }
export type RelaxMedia = { pictures: MediaItem[]; music: MediaItem[]; nature: MediaItem[] }

/** „02 Leśny strumień.mp3” → „Leśny strumień”, „spokojne-morze.jpg” → „Spokojne morze”. */
export function titleFromFileName(path: string) {
  const name = decodeURIComponent(path.split('/').pop() ?? path).normalize('NFC').replace(/\.[^.]+$/, '')
  const withoutOrder = name.replace(/^\d+[\s._-]+/, '')
  const readable = /\s/.test(withoutOrder) ? withoutOrder : withoutOrder.replace(/[-_]+/g, ' ')
  return readable.charAt(0).toLocaleUpperCase('pl-PL') + readable.slice(1)
}

const byName = (a: string, b: string) => a.localeCompare(b, 'pl', { numeric: true })

const fromBundle = (files: Record<string, string>): MediaItem[] => Object.entries(files)
  .sort(([a], [b]) => byName(a, b))
  .map(([path, src]) => ({ id: path, title: titleFromFileName(path), src }))

const fromFolder = (folder: string, names: string[] = []): MediaItem[] => [...names]
  .sort(byName)
  .map((name) => ({ id: `${folder}/${name}`, title: titleFromFileName(name), src: `relaks/${folder}/${encodeURIComponent(name)}` }))

const bundledMedia: RelaxMedia = { pictures: fromBundle(pictureFiles), music: fromBundle(musicFiles), nature: fromBundle(natureFiles) }

type FolderList = { obrazy?: string[]; muzyka?: string[]; natura?: string[] }

/** Lista z serwera paczki Windows; przy `npm run dev` jej nie ma i zostają pliki wbudowane. */
async function loadFolderMedia(): Promise<RelaxMedia | null> {
  try {
    const response = await fetch('relaks/lista.json', { cache: 'no-store', headers: { Accept: 'application/json' } })
    if (!response.ok || !response.headers.get('content-type')?.includes('json')) return null
    const list = (await response.json()) as FolderList
    return { pictures: fromFolder('obrazy', list.obrazy), music: fromFolder('muzyka', list.muzyka), nature: fromFolder('natura', list.natura) }
  } catch {
    return null
  }
}

export function useRelaxMedia() {
  const [media, setMedia] = useState<RelaxMedia>(bundledMedia)

  useEffect(() => {
    let active = true
    void loadFolderMedia().then((folderMedia) => { if (active && folderMedia) setMedia(folderMedia) })
    return () => { active = false }
  }, [])

  return media
}
