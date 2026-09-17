import { Download, FolderOpen, FolderPlus, RotateCcw, ShieldAlert, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { exportDataFile, readDataFile } from '../../lib/appData'
import { getStorageInfo, type StorageInfo } from '../../lib/storage'
import type { Classroom } from '../../hooks/useClassroom'
import type { AppData } from '../../types'

type Props = { data: AppData; classroom: Classroom; onChange: (next: AppData) => void; onReset: () => void }

export function BackupSettings({ data, classroom, onChange, onReset }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const newClassInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)

  useEffect(() => {
    let active = true
    void getStorageInfo().then((info) => { if (active) setStorageInfo(info) })
    return () => { active = false }
  }, [])

  const importFile = async (file: File | undefined, asNewClass: boolean) => {
    if (!file) return
    try {
      const imported = await readDataFile(file)
      if (asNewClass) {
        await classroom.addClass(imported.classInfo.name, imported)
        setMessage({ text: `Dodano klasę: ${imported.classInfo.name} (uczniów: ${imported.students.length}).` })
        return
      }
      if (!window.confirm(`Zastąpić dane klasy „${data.classInfo.name}” danymi z pliku „${file.name}”?`)) return
      onChange(imported)
      setMessage({ text: `Wczytano dane klasy: ${imported.classInfo.name} (uczniów: ${imported.students.length}).` })
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : 'Nie udało się wczytać pliku.', error: true })
    }
  }

  const exportData = async () => {
    setMessage({ text: 'Przygotowuję plik kopii…' })
    try {
      await exportDataFile(data, classroom.index?.activeId ?? '')
      setMessage({ text: 'Plik kopii został pobrany (razem ze zdjęciami galerii).' })
    } catch {
      setMessage({ text: 'Nie udało się przygotować kopii.', error: true })
    }
  }

  const reset = () => {
    if (!window.confirm(`Wyczyścić dane klasy „${data.classInfo.name}”? Znikną uczniowie, wydarzenia, komunikaty, dyżury i galeria; plan wróci do przykładowego. Zrób wcześniej kopię, jeśli chcesz ją zachować.`)) return
    onReset()
    setMessage({ text: 'Dane wyczyszczone.' })
  }

  return (
    <section className="panel settings-section span-two backup-section">
      <div className="settings-title-row"><div><Download /><h2>Dane i kopia</h2><span>Plik kopii dotyczy aktywnej klasy — np. żeby przenieść ją na inny komputer.</span></div></div>
      {storageInfo && (
        <p className="storage-location">
          <FolderOpen aria-hidden="true" />
          {storageInfo.kind === 'folder'
            ? <span>Dane wszystkich klas zapisują się w folderze <code>{storageInfo.folder}</code>. Każda klasa to osobny plik, a codzienne kopie trafiają do <code>dane/kopie</code> (30 dni). Kopię zapasową zrobisz, kopiując cały folder <code>dane</code>.</span>
            : <span>Dane zapisują się w pamięci tej przeglądarki (aplikacja działa bez serwera huba). Regularnie pobieraj kopię danych.</span>}
        </p>
      )}
      <div className="backup-actions">
        <button className="primary" onClick={() => void exportData()}><Download /> Pobierz kopię danych</button>
        <button onClick={() => newClassInputRef.current?.click()}><FolderPlus /> Wczytaj jako nową klasę</button>
        <button onClick={() => inputRef.current?.click()}><Upload /> Zastąp obecną klasę z pliku</button>
        <input ref={newClassInputRef} type="file" accept="application/json,.json" hidden onChange={(event) => { void importFile(event.target.files?.[0], true); event.target.value = '' }} />
        <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={(event) => { void importFile(event.target.files?.[0], false); event.target.value = '' }} />
        <button className="danger" onClick={reset}><RotateCcw /> Wyczyść tę klasę</button>
      </div>
      {message && <p className={message.error ? 'settings-error' : 'settings-success'} role="status">{message.text}</p>}
      <p className="settings-hint backup-warning"><ShieldAlert aria-hidden="true" /> Plik kopii zawiera imiona, zdjęcia i daty urodzin uczniów. Nie udostępniaj go publicznie. Aplikację bez danych możesz przekazać innym bez obaw.</p>
    </section>
  )
}
