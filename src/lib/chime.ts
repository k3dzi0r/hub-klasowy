// Dźwięki generowane w przeglądarce — bez plików audio.
// Przeglądarka pozwala grać dopiero po pierwszym dotknięciu strony, dlatego jeden wspólny AudioContext
// odblokowujemy przy pierwszym kliknięciu (unlockAudio) i używamy go dla timera i dzwonka.

let context: AudioContext | null = null

function audioContext() {
  context ??= new AudioContext()
  return context
}

/** Wywoływane przy dotknięciu ekranu: od tej chwili dźwięki mogą grać same. */
export function unlockAudio() {
  try {
    const current = audioContext()
    if (current.state === 'suspended') void current.resume()
  } catch {
    // Brak obsługi dźwięku w tej przeglądarce.
  }
}

/** true, gdy przeglądarka pozwala teraz grać dźwięki. */
export const isAudioReady = () => context?.state === 'running'

type Note = { frequency: number; start: number; length: number; volume: number }

function playNotes(notes: Note[]) {
  try {
    const current = audioContext()
    if (current.state === 'suspended') void current.resume()
    const now = current.currentTime + 0.05
    for (const note of notes) {
      // Ton podstawowy i cichy wyższy alikwot — brzmi bardziej jak dzwonek niż czysty sinus.
      for (const [ratio, level] of [[1, 1], [2.76, 0.18]] as const) {
        const oscillator = current.createOscillator()
        const gain = current.createGain()
        const start = now + note.start
        oscillator.type = 'sine'
        oscillator.frequency.value = note.frequency * ratio
        gain.gain.setValueAtTime(0.0001, start)
        gain.gain.exponentialRampToValueAtTime(note.volume * level, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.0001, start + note.length)
        oscillator.connect(gain).connect(current.destination)
        oscillator.start(start)
        oscillator.stop(start + note.length + 0.05)
      }
    }
  } catch {
    // Brak obsługi dźwięku — na ekranie i tak widać komunikat.
  }
}

/** Łagodny sygnał końca czasu w timerze ręcznym (trzy rosnące dźwięki, dwa razy). */
export function playTimerEnd() {
  const notes = [523.25, 659.25, 783.99]
  playNotes([0, 1].flatMap((round) => notes.map((frequency, index) => ({ frequency, start: round * 1.4 + index * 0.22, length: 1, volume: 0.18 }))))
}

/** Dzwonek zmiany zajęć: spokojne „bim-bam-bom”, powtórzone dwa razy. */
export function playBell() {
  const notes = [783.99, 659.25, 523.25]
  playNotes([0, 1].flatMap((round) => notes.map((frequency, index) => ({ frequency, start: round * 2.2 + index * 0.55, length: 1.8, volume: 0.26 }))))
}
