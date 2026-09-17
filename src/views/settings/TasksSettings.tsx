import { Check, ListPlus, Plus, Trash2 } from 'lucide-react'
import { IconPicker } from '../../components/IconPicker'
import { StudentPhoto } from '../../components/StudentPhoto'
import { newId } from '../../lib/images'
import type { AppData, ClassTask } from '../../types'

type Props = { data: AppData; onChange: (next: AppData) => void }

export function TasksSettings({ data, onChange }: Props) {
  const updateTask = (id: string, patch: Partial<ClassTask>) => onChange({ ...data, tasks: data.tasks.map((item) => item.id === id ? { ...item, ...patch } : item) })
  const addTask = () => onChange({ ...data, tasks: [...data.tasks, { id: newId('task'), title: 'Nowy obowiązek', icon: '🧹', assigneeIds: [], done: false }] })
  const removeTask = (id: string) => onChange({ ...data, tasks: data.tasks.filter((item) => item.id !== id) })
  const toggleAssignee = (task: ClassTask, studentId: number) => updateTask(task.id, { assigneeIds: task.assigneeIds.includes(studentId) ? task.assigneeIds.filter((id) => id !== studentId) : [...task.assigneeIds, studentId] })

  return (
    <section className="panel settings-section span-two">
      <div className="settings-title-row"><div><ListPlus /><h2>Dyżury uczniów</h2><span>Kliknij ikonę, żeby ją zmienić. Kliknij ucznia, żeby go przypisać albo odpiąć.</span></div><button onClick={addTask}><Plus /> Dodaj obowiązek</button></div>
      <div className="editor-card-grid tasks-editor">
        {data.tasks.map((task) => {
          const assigned = data.students.filter((student) => task.assigneeIds.includes(student.id)).length
          return (
            <article key={task.id} className="editor-card task-editor-card">
              <div className="editor-card-top"><IconPicker value={task.icon} label={`Ikona: ${task.title}`} showText onChange={(icon) => updateTask(task.id, { icon })} /><button className="icon-delete" onClick={() => removeTask(task.id)} aria-label={`Usuń zadanie ${task.title}`}><Trash2 /></button></div>
              <label>Nazwa obowiązku<input value={task.title} onChange={(event) => updateTask(task.id, { title: event.target.value })} /></label>
              <div className="task-assignees">
                <span className="task-assignees-label">Kto ma dyżur <small>{assigned ? `${assigned} ${assigned === 1 ? 'osoba' : assigned < 5 ? 'osoby' : 'osób'}` : 'nikt'}</small></span>
                <div className="student-check-grid" role="group" aria-label={`Przypisani do: ${task.title}`}>
                  {data.students.map((student) => {
                    const selected = task.assigneeIds.includes(student.id)
                    return (
                      <button key={student.id} type="button" className={selected ? 'selected' : ''} aria-pressed={selected} onClick={() => toggleAssignee(task, student.id)}>
                        <StudentPhoto student={student} />
                        <span>{student.name}</span>
                        {selected && <Check className="student-check-mark" aria-hidden="true" />}
                      </button>
                    )
                  })}
                </div>
                {!data.students.length && <p className="settings-hint">Najpierw dodaj uczniów.</p>}
              </div>
            </article>
          )
        })}
      </div>
      {!data.tasks.length && <p className="settings-hint">Brak dyżurów. Kliknij „Dodaj obowiązek”.</p>}
    </section>
  )
}
