import { useEffect, useMemo, useState } from 'react'
import { BellNotice } from './components/BellNotice'
import { Shell } from './components/Shell'
import { loadDailyCalendar, pickDayHighlight, useLoaded, usableCandidates } from './data/content'
import { useBell, type BellEvent } from './hooks/useBell'
import { useClassroom, type Classroom } from './hooks/useClassroom'
import { useToday } from './hooks/useToday'
import { activityIdsFor, createDefaultData, scheduleForDate, weekdayOf } from './lib/appData'
import { isAudioReady, playBell, unlockAudio } from './lib/chime'
import { dayKey, seasonForDate } from './lib/dates'
import { externalizeGallery } from './lib/galleryFiles'
import { getStorageInfo } from './lib/storage'
import type { AppData, Navigate, SettingsTab, ViewId } from './types'
import { AnnouncementsView } from './views/AnnouncementsView'
import { CalendarView } from './views/CalendarView'
import { ChoicesView } from './views/ChoicesView'
import { Dashboard } from './views/Dashboard'
import { GalleryView } from './views/GalleryView'
import { NowNextView } from './views/NowNextView'
import { RelaxView } from './views/RelaxView'
import { ScheduleView } from './views/ScheduleView'
import { SettingsView } from './views/SettingsView'
import { settingsTabs } from './views/settings/tabs'
import { TasksView } from './views/TasksView'

const validViews: ViewId[] = ['home', 'schedule', 'now-next', 'calendar', 'tasks', 'gallery', 'relax', 'announcements', 'choices', 'settings']

/** Adres w stylu #/settings/uczniowie — widok i (dla Ustawień) zakładka. */
function readHash(): { view: ViewId; tab: SettingsTab } {
  const [viewPart, tabPart] = window.location.hash.replace(/^#\/?/, '').split('/')
  const view = validViews.includes(viewPart as ViewId) ? viewPart as ViewId : 'home'
  const tab = settingsTabs.some((item) => item.id === tabPart) ? tabPart as SettingsTab : 'klasa'
  return { view, tab }
}

export default function App() {
  const classroom = useClassroom()
  if (!classroom.data || !classroom.index) return <div className="app-loading" role="status">Wczytuję dane klasy…</div>
  return <ClassroomApp classroom={classroom} data={classroom.data} />
}

function ClassroomApp({ classroom, data }: { classroom: Classroom; data: AppData }) {
  const { setData, saveFailed } = classroom
  const classId = classroom.index?.activeId ?? ''
  const [route, setRoute] = useState(readHash)
  const { view, tab } = route
  const today = useToday()
  const dailyCalendar = useLoaded(loadDailyCalendar)
  const [bell, setBell] = useState<{ event: BellEvent; soundBlocked: boolean } | null>(null)

  useEffect(() => {
    const onHashChange = () => setRoute(readHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  // Przeglądarka pozwala na dźwięk dopiero po dotknięciu strony — odblokowujemy go przy każdym kliknięciu.
  useEffect(() => {
    window.addEventListener('pointerdown', unlockAudio)
    window.addEventListener('keydown', unlockAudio)
    return () => {
      window.removeEventListener('pointerdown', unlockAudio)
      window.removeEventListener('keydown', unlockAudio)
    }
  }, [])

  useEffect(() => {
    document.title = data.classInfo.name || 'Hub klasowy'
  }, [data.classInfo.name])

  // Zdjęcia galerii zapisane w danych (starsza wersja albo wczytany plik kopii) przenosimy do plików w dane/galeria.
  const hasInlinePhotos = data.gallery.some((item) => !item.file && item.src?.startsWith('data:'))
  useEffect(() => {
    if (!hasInlinePhotos || !classId) return
    let active = true
    void (async () => {
      if ((await getStorageInfo()).kind !== 'folder') return
      try {
        const converted = await externalizeGallery(classId, data.gallery)
        if (!active) return
        setData((latest) => ({ ...latest, gallery: latest.gallery.map((item) => converted.find((entry) => entry.id === item.id) ?? item) }))
      } catch (error) {
        console.warn('Nie udało się przenieść zdjęć galerii do folderu.', error)
      }
    })()
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- uruchamiamy tylko, gdy pojawią się zdjęcia do przeniesienia
  }, [hasInlinePhotos, classId])

  useEffect(() => {
    if (!data.autoSchedule) return
    const interval = window.setInterval(() => {
      setData((latest) => {
        if (!latest.autoSchedule) return latest
        const { currentActivityId, nextActivityId } = activityIdsFor(scheduleForDate(latest, new Date()))
        if (currentActivityId === latest.currentActivityId && nextActivityId === latest.nextActivityId) return latest
        return { ...latest, currentActivityId, nextActivityId }
      })
    }, 5000)
    return () => window.clearInterval(interval)
  }, [data.autoSchedule, setData])

  const navigate: Navigate = (nextView, nextTab) => {
    const next = { view: nextView, tab: nextTab ?? (nextView === 'settings' && view === 'settings' ? tab : 'klasa') }
    window.location.hash = nextView === 'settings' ? `/settings/${next.tab}` : `/${nextView}`
    setRoute(next)
    document.querySelector('.main-area')?.scrollTo({ top: 0, behavior: 'smooth' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Plan na dziś — każdy dzień tygodnia ma własny; w weekend pusty.
  const schedule = scheduleForDate(data, today)
  const current = useMemo(() => schedule.find((item) => item.id === data.currentActivityId) ?? schedule[0] ?? null, [schedule, data.currentActivityId])
  const next = useMemo(() => schedule.find((item) => item.id === data.nextActivityId) ?? schedule[1] ?? schedule[0] ?? null, [schedule, data.nextActivityId])

  // Zamiast szkolnego dzwonka: dźwięk i komunikat, gdy zajęcia z planu się zaczynają albo kończą.
  useBell(schedule, (event) => {
    if (data.bellSound) playBell()
    if (!data.bellMessage) return
    setBell({ event, soundBlocked: false })
    if (data.bellSound) window.setTimeout(() => setBell((current) => current?.event === event ? { event, soundBlocked: !isAudioReady() } : current), 500)
  })

  const todayKey = dayKey(today)
  const todayCalendar = dailyCalendar?.find((day) => day.date === todayKey)
  const highlight = pickDayHighlight(todayCalendar, data.holidayOverride, todayKey)
  const season = data.seasonMode === 'auto' ? seasonForDate(today) : data.seasonMode

  const togglePresence = (id: number) => setData({ ...data, students: data.students.map((student) => student.id === id ? { ...student, present: !student.present } : student) })
  const toggleTask = (id: string) => setData({ ...data, tasks: data.tasks.map((task) => task.id === id ? { ...task, done: !task.done } : task) })
  const setCurrent = (id: string) => {
    const index = schedule.findIndex((item) => item.id === id)
    setData({ ...data, currentActivityId: id, nextActivityId: schedule[Math.min(index + 1, schedule.length - 1)]?.id ?? id })
  }

  const content = (() => {
    switch (view) {
      case 'schedule': return <ScheduleView key={todayKey} weekSchedule={data.weekSchedule} today={today} announcements={data.announcements} currentId={data.currentActivityId} nextId={data.nextActivityId} onCurrentChange={setCurrent} onNavigate={navigate} />
      case 'now-next': return <NowNextView current={current} next={next} dayOff={!schedule.length && weekdayOf(today) === null} timerMinutes={data.timerMinutes} onNavigate={navigate} />
      case 'calendar': return <CalendarView events={data.events} students={data.students} highlight={highlight} today={today} />
      case 'tasks': return <TasksView tasks={data.tasks} students={data.students} onToggle={toggleTask} onNavigate={navigate} />
      case 'gallery': return <GalleryView key={classId} items={data.gallery} categories={data.galleryCategories} students={data.students} classId={classId} onChange={(gallery) => setData((latest) => ({ ...latest, gallery }))} onCategoriesChange={(galleryCategories, gallery) => setData((latest) => ({ ...latest, galleryCategories, gallery }))} />
      case 'relax': return <RelaxView />
      case 'announcements': return <AnnouncementsView announcements={data.announcements} onNavigate={navigate} />
      case 'choices': return <ChoicesView />
      case 'settings': return <SettingsView data={data} todaySchedule={schedule} classroom={classroom} tab={tab} onTabChange={(nextTab) => navigate('settings', nextTab)} today={today} todayCandidates={usableCandidates(todayCalendar)} highlight={highlight} onChange={setData} onReset={() => setData({ ...createDefaultData(), classInfo: data.classInfo, weatherLocation: data.weatherLocation })} />
      default: return <Dashboard data={data} schedule={schedule} today={today} highlight={highlight} current={current} next={next} onNavigate={navigate} onTogglePresence={togglePresence} />
    }
  })()

  return (
    <Shell currentView={view} onNavigate={navigate} today={today} season={season} glassOpacity={data.glassOpacity} classInfo={data.classInfo} weatherLocation={data.weatherLocation} saveFailed={saveFailed} classroom={classroom} bellSound={data.bellSound} onToggleBellSound={() => setData((latest) => ({ ...latest, bellSound: !latest.bellSound }))}>
      {content}
      {bell && <BellNotice event={bell.event} soundBlocked={bell.soundBlocked} onClose={() => setBell(null)} />}
    </Shell>
  )
}
