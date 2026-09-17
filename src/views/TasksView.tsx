import { Check, Ear, Heart, Sparkles, Star, ThumbsUp } from 'lucide-react'
import { EmptyState } from '../components/EmptyState'
import { StudentPhoto } from '../components/StudentPhoto'
import type { ClassTask, Navigate, Student } from '../types'

type Props = {
  tasks: ClassTask[]
  students: Student[]
  onToggle: (id: string) => void
  onNavigate: Navigate
}

export function TasksView({ tasks, students, onToggle, onNavigate }: Props) {
  return (
    <div className="tasks-layout">
      <section className="panel duty-panel">
        <div className="panel-heading"><div><span className="section-overline">Dzisiaj</span><h2>Dyżury klasowe</h2></div><strong>{tasks.filter((task) => task.done).length} / {tasks.length}</strong></div>
        {!tasks.length && <EmptyState icon="🧹" title="Brak dyżurów" text="Dodaj obowiązki i przypisz do nich uczniów." actionLabel="Dodaj dyżury" onAction={() => onNavigate('settings', 'dyzury')} />}
        <div className="duty-list">
          {tasks.map((task) => {
            const assignees = students.filter((student) => task.assigneeIds.includes(student.id))
            return (
              <button key={task.id} className={task.done ? 'done' : ''} onClick={() => onToggle(task.id)}>
                <span className="duty-icon" aria-hidden="true">{task.icon}</span>
                <strong>{task.title}</strong>
                <div className="assignee-group" aria-label={`Przypisani: ${assignees.map((student) => student.name).join(', ') || 'nikt'}`}>
                  <div>{assignees.map((student) => <StudentPhoto key={student.id} student={student} />)}</div>
                  <span>{assignees.length ? assignees.map((student) => student.name).join(', ') : 'Nieprzypisane'}</span>
                </div>
                <span className="task-check">{task.done && <Check />}</span>
              </button>
            )
          })}
        </div>
      </section>

      <aside className="panel rules-panel">
        <div className="panel-heading"><h2>Nasze zasady</h2><Sparkles /></div>
        <div className="rule"><Heart /><div><strong>Jesteśmy dla siebie mili</strong><span>Mówimy spokojnie.</span></div></div>
        <div className="rule"><Ear /><div><strong>Słuchamy się</strong><span>Dajemy innym czas.</span></div></div>
        <div className="rule"><ThumbsUp /><div><strong>Dbamy o porządek</strong><span>Każdy może pomóc.</span></div></div>
        <div className="rule"><Star /><div><strong>Staramy się i próbujemy</strong><span>Małe kroki są ważne.</span></div></div>
      </aside>
    </div>
  )
}
