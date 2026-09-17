import { useCallback, useEffect, useRef, useState } from 'react'
import { createDefaultData, normalizeData, STORAGE_KEY, withScheduleActivity } from '../lib/appData'
import { deleteGalleryFolder } from '../lib/galleryFiles'
import { newId } from '../lib/images'
import { browserStorage, getStorageInfo, storage } from '../lib/storage'
import type { AppData } from '../types'

export type ClassSummary = { id: string; name: string }
export type ClassIndex = { activeId: string; classes: ClassSummary[] }

const INDEX_KEY = 'classes-index'
const classKey = (id: string) => `class:${id}`

type Update = AppData | ((latest: AppData) => AppData)

/** Rzeczy dotyczące sali (pogoda, wygląd, timer) przechodzą do nowej klasy z bieżącej. */
const roomSettings = (from: AppData | null): Partial<AppData> => from
  ? { weatherLocation: from.weatherLocation, seasonMode: from.seasonMode, glassOpacity: from.glassOpacity, timerMinutes: from.timerMinutes }
  : {}

/**
 * Profile klas zapisane w folderze „dane” (albo w przeglądarce): lista klas, aktywna klasa i jej dane.
 * Zmiany zapisują się z krótkim opóźnieniem; przy pierwszym uruchomieniu dane z localStorage stają się pierwszą klasą.
 */
/**
 * Pierwsze uruchomienie z nowym zapisem: przenosi dane z pamięci przeglądarki (IndexedDB, a jeszcze wcześniej localStorage)
 * do folderu „dane”. Gdy nic nie ma — tworzy pustą klasę.
 */
async function migrateExistingData(): Promise<ClassIndex> {
  const usingFolder = (await getStorageInfo()).kind === 'folder'
  if (usingFolder) {
    const browserIndex = await browserStorage.get<ClassIndex>(INDEX_KEY).catch(() => undefined)
    if (browserIndex?.classes.length) {
      for (const item of browserIndex.classes) {
        const classData = await browserStorage.get<AppData>(classKey(item.id)).catch(() => undefined)
        if (classData) await storage.set(classKey(item.id), classData)
      }
      await storage.set(INDEX_KEY, browserIndex)
      return browserIndex
    }
  }
  const legacy = window.localStorage.getItem(STORAGE_KEY)
  const firstData = legacy ? normalizeData(JSON.parse(legacy)) : createDefaultData()
  const id = newId('klasa')
  const index = { activeId: id, classes: [{ id, name: firstData.classInfo.name }] }
  await storage.set(classKey(id), firstData)
  await storage.set(INDEX_KEY, index)
  return index
}

export function useClassroom() {
  const [index, setIndex] = useState<ClassIndex | null>(null)
  const [data, setDataState] = useState<AppData | null>(null)
  const [saveFailed, setSaveFailed] = useState(false)
  const pendingSave = useRef<{ id: string; data: AppData } | null>(null)
  const indexRef = useRef<ClassIndex | null>(null)
  const saveTimer = useRef<number | undefined>(undefined)

  const flush = useCallback(async () => {
    window.clearTimeout(saveTimer.current)
    const pending = pendingSave.current
    if (!pending) return
    pendingSave.current = null
    try {
      await storage.set(classKey(pending.id), pending.data)
      // Nazwa klasy na liście nadąża za nazwą wpisaną w Ustawieniach.
      const currentIndex = indexRef.current
      const summary = currentIndex?.classes.find((item) => item.id === pending.id)
      if (currentIndex && summary && summary.name !== pending.data.classInfo.name) {
        const nextIndex = { ...currentIndex, classes: currentIndex.classes.map((item) => item.id === pending.id ? { ...item, name: pending.data.classInfo.name } : item) }
        indexRef.current = nextIndex
        setIndex(nextIndex)
        await storage.set(INDEX_KEY, nextIndex)
      }
      setSaveFailed(false)
    } catch (error) {
      console.warn('Nie udało się zapisać danych klasy.', error)
      setSaveFailed(true)
    }
  }, [])

  useEffect(() => {
    let active = true
    void (async () => {
      try {
        let loadedIndex = await storage.get<ClassIndex>(INDEX_KEY)
        if (!loadedIndex?.classes.length) loadedIndex = await migrateExistingData()
        const saved = await storage.get<AppData>(classKey(loadedIndex.activeId))
        if (!active) return
        indexRef.current = loadedIndex
        setIndex(loadedIndex)
        setDataState(withScheduleActivity(normalizeData(saved)))
      } catch (error) {
        console.warn('Nie udało się otworzyć bazy danych — dane nie będą zapisywane.', error)
        if (!active) return
        setSaveFailed(true)
        setIndex({ activeId: 'tymczasowa', classes: [{ id: 'tymczasowa', name: 'Nasza klasa' }] })
        setDataState(createDefaultData())
      }
    })()
    const onHide = () => { void flush() }
    window.addEventListener('pagehide', onHide)
    return () => {
      active = false
      window.removeEventListener('pagehide', onHide)
    }
  }, [flush])

  const writeIndex = useCallback((next: ClassIndex) => {
    indexRef.current = next
    setIndex(next)
    storage.set(INDEX_KEY, next).catch(() => setSaveFailed(true))
  }, [])

  const setData = useCallback((update: Update) => {
    setDataState((latest) => {
      if (!latest || !index) return latest
      const next = typeof update === 'function' ? update(latest) : update
      // Bez zmian nie zapisujemy — inaczej timer planu co kilka sekund nadpisywałby plik starszą kopią danych.
      if (next === latest) return latest
      pendingSave.current = { id: index.activeId, data: next }
      window.clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => { void flush() }, 400)
      return next
    })
  }, [flush, index])

  const switchClass = useCallback(async (id: string) => {
    if (!index || id === index.activeId) return
    await flush()
    const saved = await storage.get<AppData>(classKey(id))
    setDataState(withScheduleActivity(normalizeData(saved)))
    writeIndex({ ...index, activeId: id })
  }, [flush, index, writeIndex])

  const addClass = useCallback(async (name: string, initial?: AppData) => {
    if (!index) return
    await flush()
    const id = newId('klasa')
    const base = initial ?? { ...createDefaultData(), ...roomSettings(data) }
    const classData = withScheduleActivity({ ...base, classInfo: { ...base.classInfo, name: name.trim() || base.classInfo.name } })
    await storage.set(classKey(id), classData)
    setDataState(classData)
    writeIndex({ activeId: id, classes: [...index.classes, { id, name: classData.classInfo.name }] })
  }, [data, flush, index, writeIndex])

  const deleteClass = useCallback(async (id: string) => {
    if (!index || index.classes.length < 2) return
    const remaining = index.classes.filter((item) => item.id !== id)
    if (id === index.activeId) {
      pendingSave.current = null
      const saved = await storage.get<AppData>(classKey(remaining[0].id))
      setDataState(withScheduleActivity(normalizeData(saved)))
    }
    await storage.remove(classKey(id))
    if ((await getStorageInfo()).kind === 'folder') await deleteGalleryFolder(id)
    writeIndex({ activeId: id === index.activeId ? remaining[0].id : index.activeId, classes: remaining })
  }, [index, writeIndex])

  // Lista pokazuje bieżącą nazwę aktywnej klasy od razu, zanim zapis dotrze do bazy.
  const visibleIndex = index && data
    ? { ...index, classes: index.classes.map((item) => item.id === index.activeId ? { ...item, name: data.classInfo.name } : item) }
    : index

  return { index: visibleIndex, data, setData, saveFailed, switchClass, addClass, deleteClass }
}

export type Classroom = ReturnType<typeof useClassroom>
