import type { ClassEvent, ClassTask, GalleryItem, Student, WeatherLocation } from '../types'

// Dane pokazowe do wersji demo (GitHub Pages) — zmyśleni uczniowie, żadnych prawdziwych osób.
// Zdjęcia: wrzuć wygenerowane obrazy do public/demo-photos/ pod tymi samymi nazwami plików.

export const demoWeatherLocation: WeatherLocation = { name: 'Toruń', latitude: 53.0138, longitude: 18.6058 }

export const demoStudents: Student[] = [
  { id: 1, name: 'Kuba', fullName: 'Kuba Nowak', photo: 'demo-photos/kuba.png', present: true, birthday: '03-14' },
  { id: 2, name: 'Ola', fullName: 'Ola Kowalska', photo: 'demo-photos/ola.png', present: true, birthday: '09-02' },
  { id: 3, name: 'Bartek', fullName: 'Bartek Zieliński', photo: 'demo-photos/bartek.png', present: true, birthday: '06-30' },
  { id: 4, name: 'Grzesia', fullName: 'Grzesia Wiśniewska', photo: 'demo-photos/zosia.png', present: false, birthday: '11-20' },
]

export const demoTasks: ClassTask[] = [
  { id: 'demo-task-1', title: 'Podlewanie kwiatków', icon: '🌱', assigneeIds: [1], done: false },
  { id: 'demo-task-2', title: 'Czyszczenie tablicy', icon: '🧽', assigneeIds: [2], done: true },
]

export const demoEvents: ClassEvent[] = [
  { id: 'demo-event-1', date: '2026-10-18', title: 'Wycieczka do zoo', icon: '🦁', color: 'green' },
  { id: 'demo-event-2', date: '2026-10-31', title: 'Halloween w klasie', icon: '🎃', color: 'amber' },
]

export const demoGallery: GalleryItem[] = [
  { id: 'demo-gallery-1', src: 'demo-photos/galeria-klasowe.png', title: 'Nasza klasa', category: 'Zajęcia' },
]
