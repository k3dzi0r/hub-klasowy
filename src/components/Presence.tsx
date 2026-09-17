import { Check, UsersRound, X } from 'lucide-react'
import { isBirthdayToday } from '../lib/birthdays'
import { EmptyState } from './EmptyState'
import { StudentPhoto } from './StudentPhoto'
import type { Student } from '../types'

type PresenceProps = {
  students: Student[]
  onToggle: (id: number) => void
  today: Date
  compact?: boolean
  onAddStudents?: () => void
}

export function Presence({ students, onToggle, today, compact = false, onAddStudents }: PresenceProps) {
  const present = students.filter((student) => student.present).length

  return (
    <section className={`panel presence-panel ${compact ? 'compact' : ''}`} aria-labelledby="presence-title">
      <div className="panel-heading">
        <h2 id="presence-title">Dzisiaj w klasie</h2>
        <div className="presence-counter"><UsersRound aria-hidden="true" /><strong>{present} / {students.length}</strong></div>
      </div>
      {!students.length && <EmptyState icon="🧑‍🎓" title="Brak uczniów" text="Dodaj uczniów i ich zdjęcia albo wczytaj kopię danych." actionLabel="Dodaj uczniów" onAction={onAddStudents} />}
      <div className="student-grid">
        {students.map((student) => {
          const birthday = isBirthdayToday(student, today)
          return (
            <button
              key={student.id}
              className={`student-card ${student.present ? 'present' : 'absent'} ${birthday ? 'birthday' : ''}`}
              onClick={() => onToggle(student.id)}
              aria-label={`${student.name}: ${student.present ? 'jest obecny' : 'nieobecny'}${birthday ? ', dziś ma urodziny' : ''}. Kliknij, aby zmienić.`}
            >
              <div className="student-photo-wrap">
                <StudentPhoto student={student} />
                {birthday && <span className="birthday-badge" aria-hidden="true">🎂</span>}
                <span className="status-badge" aria-hidden="true">{student.present ? <Check /> : <X />}</span>
              </div>
              <strong>{student.name}</strong>
              <span>{student.present ? 'JEST' : 'NIE MA'}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
