import { ChevronLeft, ChevronRight, CloudRain, FolderOpen, Image, Leaf, Maximize, Music2, Pause, Play, SkipBack, SkipForward, Volume1, Volume2, Wind } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BreathingExercise } from '../components/BreathingExercise'
import { PictureFullscreen } from '../components/PictureFullscreen'
import { useRelaxMedia } from '../data/relaxMedia'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { useRelaxAudio, type Playlist } from '../hooks/useRelaxAudio'

const relaxOptions = [
  { id: 'music', label: 'Muzyka relaksacyjna', icon: Music2, color: 'violet' },
  { id: 'nature', label: 'Dźwięki natury', icon: CloudRain, color: 'green' },
  { id: 'breathing', label: 'Spokojny oddech', icon: Wind, color: 'blue' },
  { id: 'pictures', label: 'Spokojne obrazy', icon: Image, color: 'amber' },
] as const

type RelaxMode = (typeof relaxOptions)[number]['id']

type RelaxSettings = { pictureMode: 'slideshow' | 'single'; intervalSec: number; volume: number }

const defaultSettings: RelaxSettings = { pictureMode: 'slideshow', intervalSec: 20, volume: 0.7 }
const intervals = [10, 20, 30, 60, 120]
const folders: Record<Playlist | 'pictures', string> = import.meta.env.MODE === 'windows'
  ? { music: 'relaks\\muzyka', nature: 'relaks\\natura', pictures: 'relaks\\obrazy' }
  : { music: 'src/assets/relaks/muzyka', nature: 'src/assets/relaks/natura', pictures: 'src/assets/relaks/obrazy' }

const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`

function EmptyFolder({ folder, kind }: { folder: string; kind: string }) {
  return <p className="relax-empty"><FolderOpen aria-hidden="true" /> Brak {kind}. Dodaj pliki do folderu <code>{folder}</code>.</p>
}

export function RelaxView() {
  const [active, setActive] = useState<RelaxMode>('breathing')
  const [settings, setSettings] = useLocalStorage<RelaxSettings>('hub-klasowy-relaks', defaultSettings)
  const [pictureIndex, setPictureIndex] = useState(0)
  const [slideshowPaused, setSlideshowPaused] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const media = useRelaxMedia()
  const calmPictures = media.pictures
  const playlists = { music: media.music, nature: media.nature }
  const audio = useRelaxAudio(playlists, settings.volume)
  const pictureCount = calmPictures.length
  const shownIndex = pictureCount ? Math.min(pictureIndex, pictureCount - 1) : 0
  const picture = calmPictures[shownIndex]
  const slideshowRunning = settings.pictureMode === 'slideshow' && !slideshowPaused && pictureCount > 1 && (active === 'pictures' || fullscreen)

  useEffect(() => {
    if (!slideshowRunning) return
    const timer = window.setInterval(() => setPictureIndex((value) => (value + 1) % pictureCount), settings.intervalSec * 1000)
    return () => window.clearInterval(timer)
  }, [slideshowRunning, settings.intervalSec, pictureIndex, pictureCount])

  const movePicture = (delta: number) => setPictureIndex((value) => (Math.min(value, pictureCount - 1) + delta + pictureCount) % pictureCount)

  const openFullscreen = () => {
    setFullscreen(true)
    document.documentElement.requestFullscreen?.().catch(() => { /* bez trybu pełnoekranowego zostaje nakładka na całe okno */ })
  }

  const updateSettings = (patch: Partial<RelaxSettings>) => setSettings({ ...settings, ...patch })

  const renderPlayer = (list: Playlist) => {
    const items = playlists[list]
    if (!items.length) return <EmptyFolder folder={folders[list]} kind="nagrań" />
    const isThisList = audio.track?.list === list
    const current = isThisList ? audio.current : null
    const isPlaying = isThisList && audio.playing
    return (
      <div className="relax-player">
        <div className="player-now">
          <div className={`sound-visual ${isPlaying ? 'is-playing' : ''}`} aria-hidden="true">
            {list === 'music' ? <Music2 /> : <CloudRain />}
            {[1, 2, 3, 4, 5].map((bar) => <i key={bar} />)}
          </div>
          <small>{list === 'music' ? 'Muzyka relaksacyjna' : 'Dźwięki natury'}</small>
          <h3>{current?.title ?? 'Wybierz nagranie z listy'}</h3>
          <div className="player-progress">
            <time>{formatTime(isThisList ? audio.position.current : 0)}</time>
            <input type="range" aria-label="Pozycja nagrania" min={0} max={Math.max(1, isThisList ? audio.position.duration : 1)} step={1} value={isThisList ? audio.position.current : 0} disabled={!isThisList} onChange={(event) => audio.seek(Number(event.target.value))} />
            <time>{formatTime(isThisList ? audio.position.duration : 0)}</time>
          </div>
          <div className="player-controls">
            <button onClick={() => (isThisList ? audio.step(-1) : audio.play(list, items.length - 1))} aria-label="Poprzednie nagranie"><SkipBack /></button>
            <button className="player-main" onClick={() => audio.toggle(list)} aria-label={isPlaying ? 'Pauza' : 'Odtwórz'}>{isPlaying ? <Pause /> : <Play />}</button>
            <button onClick={() => (isThisList ? audio.step(1) : audio.play(list, Math.min(1, items.length - 1)))} aria-label="Następne nagranie"><SkipForward /></button>
          </div>
          <label className="player-volume">
            <Volume1 aria-hidden="true" />
            <input type="range" aria-label="Głośność" min={0} max={1} step={0.05} value={settings.volume} onChange={(event) => updateSettings({ volume: Number(event.target.value) })} />
            <Volume2 aria-hidden="true" />
          </label>
          <p className="player-hint">{list === 'music' ? 'Utwory grają po kolei, w kółko.' : 'Nagranie powtarza się bez końca.'}</p>
        </div>
        <ol className="track-list">
          {items.map((item, index) => {
            const selected = isThisList && audio.track?.index === index
            return (
              <li key={item.id}>
                <button className={selected ? 'selected' : ''} onClick={() => (selected ? audio.toggle(list) : audio.play(list, index))} aria-current={selected ? 'true' : undefined}>
                  <span className="track-number">{selected && isPlaying ? <span className="eq" aria-hidden="true"><i /><i /><i /></span> : index + 1}</span>
                  <strong>{item.title}</strong>
                  {selected && !isPlaying && <Pause aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    )
  }

  return (
    <div className={`relax-view relax-${active}`}>
      <div className="relax-bg" style={active === 'pictures' && picture ? { backgroundImage: `linear-gradient(rgba(8, 35, 61, .2), rgba(8, 35, 61, .45)), url("${picture.src}")` } : undefined} />

      <div className="relax-head">
        <div className="relax-copy"><Leaf /><div><h2>Czas na relaks</h2><p>Wybierz to, co pomoże Ci się wyciszyć.</p></div></div>
        {audio.current && (active === 'breathing' || active === 'pictures' || audio.track?.list !== active) && (
          <button className="now-playing" onClick={() => audio.track && audio.toggle(audio.track.list)}>
            {audio.playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
            <span><small>{audio.playing ? 'Teraz gra' : 'Wstrzymano'}</small>{audio.current.title}</span>
          </button>
        )}
      </div>

      <div className="relax-options">
        {relaxOptions.map(({ id, label, icon: Icon, color }) => (
          <button key={id} className={`${color} ${active === id ? 'active' : ''}`} onClick={() => setActive(id)} aria-pressed={active === id}>
            <Icon /><strong>{label}</strong>
          </button>
        ))}
      </div>

      <section className="relax-stage">
        {active === 'breathing' && <BreathingExercise />}

        {(active === 'music' || active === 'nature') && renderPlayer(active)}

        {active === 'pictures' && (picture ? (
          <div className="pictures-panel">
            <div className="calm-picture-stage">
              <button onClick={() => movePicture(-1)} aria-label="Poprzedni obraz"><ChevronLeft /></button>
              <figure>
                <button className="picture-open" onClick={openFullscreen} aria-label={`Pokaż na pełnym ekranie: ${picture.title}`}><img key={picture.src} src={picture.src} alt={picture.title} /></button>
                <figcaption>{picture.title}<span>{shownIndex + 1} / {pictureCount}</span></figcaption>
              </figure>
              <button onClick={() => movePicture(1)} aria-label="Następny obraz"><ChevronRight /></button>
            </div>

            <div className="picture-toolbar">
              <div className="segmented" role="radiogroup" aria-label="Sposób wyświetlania">
                <button role="radio" aria-checked={settings.pictureMode === 'slideshow'} className={settings.pictureMode === 'slideshow' ? 'active' : ''} onClick={() => { updateSettings({ pictureMode: 'slideshow' }); setSlideshowPaused(false) }}>Pokaz slajdów</button>
                <button role="radio" aria-checked={settings.pictureMode === 'single'} className={settings.pictureMode === 'single' ? 'active' : ''} onClick={() => updateSettings({ pictureMode: 'single' })}>Jeden obraz</button>
              </div>
              {settings.pictureMode === 'slideshow' && (
                <>
                  <label className="interval-select">Zmiana co
                    <select value={settings.intervalSec} onChange={(event) => updateSettings({ intervalSec: Number(event.target.value) })}>
                      {intervals.map((seconds) => <option key={seconds} value={seconds}>{seconds < 60 ? `${seconds} s` : `${seconds / 60} min`}</option>)}
                    </select>
                  </label>
                  <button className="toolbar-button" onClick={() => setSlideshowPaused((value) => !value)}>{slideshowPaused ? <Play /> : <Pause />}{slideshowPaused ? 'Wznów' : 'Wstrzymaj'}</button>
                </>
              )}
              <button className="toolbar-button primary" onClick={openFullscreen}><Maximize /> Pełny ekran</button>
            </div>

            <div className="picture-thumbs">
              {calmPictures.map((item, index) => (
                <button key={item.id} className={index === shownIndex ? 'active' : ''} onClick={() => setPictureIndex(index)} aria-label={item.title} aria-current={index === shownIndex ? 'true' : undefined}>
                  <img src={item.src} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        ) : <EmptyFolder folder={folders.pictures} kind="obrazów" />)}
      </section>

      {fullscreen && (
        <PictureFullscreen
          pictures={calmPictures}
          index={shownIndex}
          slideshow={settings.pictureMode === 'slideshow'}
          paused={slideshowPaused}
          onMove={movePicture}
          onTogglePause={() => setSlideshowPaused((value) => !value)}
          onClose={() => setFullscreen(false)}
        />
      )}
    </div>
  )
}
