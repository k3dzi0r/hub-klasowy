import { useState } from 'react'
import type { Student } from '../types'

const initials = (student: Student) => (student.fullName || student.name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?'

const Initials = ({ student, className }: { student: Student; className: string }) => {
  const hue = (student.id * 67) % 360
  return (
    <span className={`student-initials ${className}`} style={{ background: `hsl(${hue} 55% 88%)`, color: `hsl(${hue} 45% 32%)` }} aria-hidden="true">
      {initials(student)}
    </span>
  )
}

/** Zdjęcie ucznia albo — gdy go nie ma (lub plik nie wczytał się), kolorowe pole z inicjałami. */
export function StudentPhoto({ student, className = '' }: { student: Student; className?: string }) {
  const [broken, setBroken] = useState(false)
  if (!student.photo || broken) return <Initials student={student} className={className} />
  return <img className={className} src={student.photo} alt="" onError={() => setBroken(true)} />
}
