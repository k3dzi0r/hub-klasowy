import { Camera, Plus, Trash2, UserPlus, X } from 'lucide-react'
import { useState } from 'react'
import { StudentPhoto } from '../../components/StudentPhoto'
import { resizeImage } from '../../lib/images'
import type { AppData, Student } from '../../types'

type Props = { data: AppData; onChange: (next: AppData) => void }

const monthOptions = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']
const pad = (value: number) => String(value).padStart(2, '0')

export function StudentsSettings({ data, onChange }: Props) {
  const [message, setMessage] = useState('')
  const updateStudent = (id: number, patch: Partial<Student>) => onChange({ ...data, students: data.students.map((item) => item.id === id ? { ...item, ...patch } : item) })

  const addStudent = () => {
    const id = Math.max(0, ...data.students.map((student) => student.id)) + 1
    onChange({ ...data, students: [...data.students, { id, name: 'Nowy uczeń', fullName: '', photo: '', present: true }] })
  }

  const removeStudent = (student: Student) => {
    if (!window.confirm(`Usunąć ucznia: ${student.name}? Zniknie też z przypisanych dyżurów.`)) return
    onChange({
      ...data,
      students: data.students.filter((item) => item.id !== student.id),
      tasks: data.tasks.map((task) => ({ ...task, assigneeIds: task.assigneeIds.filter((id) => id !== student.id) })),
    })
  }

  const setPhoto = async (student: Student, file: File | undefined) => {
    if (!file) return
    try {
      updateStudent(student.id, { photo: await resizeImage(file, 600) })
      setMessage('')
    } catch {
      setMessage('Nie udało się wczytać zdjęcia. Spróbuj innego pliku (JPG lub PNG).')
    }
  }

  const setBirthday = (student: Student, part: 'day' | 'month', value: number) => {
    const [month, day] = student.birthday ? student.birthday.split('-').map(Number) : [1, 1]
    if (!value) return updateStudent(student.id, { birthday: undefined })
    updateStudent(student.id, { birthday: part === 'day' ? `${pad(month)}-${pad(value)}` : `${pad(value)}-${pad(day)}` })
  }

  return (
    <section className="panel settings-section span-two">
      <div className="settings-title-row"><div><UserPlus /><h2>Uczniowie</h2><span>Imię widoczne na ekranie, zdjęcie, urodziny i obecność.</span></div><button onClick={addStudent}><Plus /> Dodaj ucznia</button></div>
      {message && <p className="settings-error" role="alert">{message}</p>}
      <div className="student-editor-grid">
        {data.students.map((student) => {
          const [month, day] = student.birthday ? student.birthday.split('-').map(Number) : [0, 0]
          return (
            <article key={student.id} className="student-editor">
              <div className="student-editor-photo">
                <StudentPhoto student={student} />
                <label className="photo-button">
                  <Camera aria-hidden="true" /> {student.photo ? 'Zmień zdjęcie' : 'Dodaj zdjęcie'}
                  <input type="file" accept="image/*" onChange={(event) => { void setPhoto(student, event.target.files?.[0]); event.target.value = '' }} />
                </label>
                {student.photo && <button className="photo-remove" onClick={() => updateStudent(student.id, { photo: '' })} aria-label={`Usuń zdjęcie: ${student.name}`}><X /></button>}
              </div>
              <label>Imię na ekranie<input value={student.name} onChange={(event) => updateStudent(student.id, { name: event.target.value })} /></label>
              <label>Imię i nazwisko<input value={student.fullName} placeholder="opcjonalnie" onChange={(event) => updateStudent(student.id, { fullName: event.target.value })} /></label>
              <div className="birthday-inputs">
                <span aria-hidden="true">🎂</span>
                <select aria-label={`Dzień urodzin: ${student.name}`} value={day} onChange={(event) => setBirthday(student, 'day', Number(event.target.value))}>
                  <option value={0}>dzień</option>
                  {Array.from({ length: 31 }, (_, index) => <option key={index} value={index + 1}>{index + 1}</option>)}
                </select>
                <select aria-label={`Miesiąc urodzin: ${student.name}`} value={month} onChange={(event) => setBirthday(student, 'month', Number(event.target.value))}>
                  <option value={0}>miesiąc</option>
                  {monthOptions.map((label, index) => <option key={label} value={index + 1}>{label}</option>)}
                </select>
              </div>
              <div className="student-editor-actions">
                <label className="presence-switch"><input type="checkbox" checked={student.present} onChange={() => updateStudent(student.id, { present: !student.present })} /><i /><span>{student.present ? 'Jest' : 'Nie ma'}</span></label>
                <button className="icon-delete" onClick={() => removeStudent(student)} aria-label={`Usuń ucznia: ${student.name}`}><Trash2 /></button>
              </div>
            </article>
          )
        })}
        <button className="student-editor-add" onClick={addStudent}><UserPlus aria-hidden="true" /><strong>Dodaj ucznia</strong></button>
      </div>
      <p className="settings-hint">Zdjęcia są zmniejszane i zapisywane tylko na tym komputerze.</p>
    </section>
  )
}
