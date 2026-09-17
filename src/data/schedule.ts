import type { ScheduleItem } from '../types'

// Przykładowy dzień — do zmiany w Ustawieniach → Plan dnia.
export const schedule: ScheduleItem[] = [
  { id: 'lesson-1', time: '08:00', endTime: '08:45', title: 'Lekcja 1', shortTitle: 'Lekcja 1', icon: '📘', instruction: 'Witamy się i zaczynamy zajęcia.', color: 'blue' },
  { id: 'break-1', time: '08:45', endTime: '08:55', title: 'Przerwa', shortTitle: 'Przerwa', icon: '🚶', instruction: 'Odpoczywamy.', color: 'green' },
  { id: 'lesson-2', time: '08:55', endTime: '09:40', title: 'Lekcja 2', shortTitle: 'Lekcja 2', icon: '✏️', instruction: '', color: 'blue' },
  { id: 'break-2', time: '09:40', endTime: '09:50', title: 'Przerwa', shortTitle: 'Przerwa', icon: '🚶', instruction: 'Odpoczywamy.', color: 'green' },
  { id: 'lesson-3', time: '09:50', endTime: '10:35', title: 'Lekcja 3', shortTitle: 'Lekcja 3', icon: '🎨', instruction: '', color: 'blue' },
  { id: 'breakfast', time: '10:35', endTime: '10:55', title: 'Drugie śniadanie', shortTitle: 'Drugie śniadanie', icon: '☕', instruction: 'Jemy i odpoczywamy.', color: 'amber' },
  { id: 'lesson-4', time: '10:55', endTime: '11:40', title: 'Lekcja 4', shortTitle: 'Lekcja 4', icon: '💬', instruction: '', color: 'blue' },
  { id: 'break-3', time: '11:40', endTime: '11:50', title: 'Przerwa', shortTitle: 'Przerwa', icon: '🚶', instruction: 'Odpoczywamy.', color: 'green' },
  { id: 'lesson-5', time: '11:50', endTime: '12:35', title: 'Lekcja 5', shortTitle: 'Lekcja 5', icon: '🧩', instruction: '', color: 'blue' },
  { id: 'finish', time: '12:35', endTime: '12:45', title: 'Zakończenie dnia', shortTitle: 'Zakończenie dnia', icon: '🏠', instruction: 'Sprawdzamy plan i przygotowujemy się do wyjścia.', color: 'violet' },
]
