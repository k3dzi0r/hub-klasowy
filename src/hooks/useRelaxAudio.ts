import { useEffect, useRef, useState } from 'react'
import type { MediaItem } from '../data/relaxMedia'

export type Playlist = 'music' | 'nature'

type Track = { list: Playlist; index: number }

/**
 * Jeden odtwarzacz dla muzyki i dźwięków natury.
 * Muzyka przechodzi do kolejnego utworu (w kółko), dźwięki natury zapętlają bieżące nagranie.
 */
export function useRelaxAudio(playlists: Record<Playlist, MediaItem[]>, volume: number) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const onEndedRef = useRef<() => void>(() => {})
  const [track, setTrack] = useState<Track | null>(null)
  const [playing, setPlaying] = useState(false)
  const [position, setPosition] = useState({ current: 0, duration: 0 })

  useEffect(() => {
    const audio = new Audio()
    audio.preload = 'auto'
    audioRef.current = audio
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onTime = () => setPosition({ current: audio.currentTime, duration: Number.isFinite(audio.duration) ? audio.duration : 0 })
    const onEnded = () => onEndedRef.current()
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onTime)
    audio.addEventListener('ended', onEnded)
    return () => {
      audio.pause()
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  const play = (list: Playlist, index: number) => {
    const audio = audioRef.current
    const item = playlists[list][index]
    if (!audio || !item) return
    if (track?.list !== list || track.index !== index) {
      audio.src = item.src
      audio.loop = list === 'nature'
      setPosition({ current: 0, duration: 0 })
    }
    setTrack({ list, index })
    audio.play().catch(() => setPlaying(false))
  }

  const step = (delta: number) => {
    if (!track) return
    const count = playlists[track.list].length
    play(track.list, (track.index + delta + count) % count)
  }

  useEffect(() => {
    onEndedRef.current = () => {
      if (track?.list === 'music') step(1)
    }
  })

  /** Start/pauza dla wskazanej listy: wznawia jej bieżące nagranie albo zaczyna od pierwszego. */
  const toggle = (list: Playlist) => {
    const audio = audioRef.current
    if (!audio) return
    if (track?.list !== list) return play(list, 0)
    if (audio.paused) audio.play().catch(() => setPlaying(false))
    else audio.pause()
  }

  const pause = () => audioRef.current?.pause()

  const seek = (seconds: number) => {
    if (audioRef.current) audioRef.current.currentTime = seconds
  }

  const current = track ? playlists[track.list][track.index] ?? null : null

  return { track, current, playing, position, play, step, toggle, pause, seek }
}
