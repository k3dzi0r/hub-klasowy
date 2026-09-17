import { Check, ChevronLeft, ChevronRight, FolderOpen, Heart, ImagePlus, Pencil, Plus, Tags, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { titleFromFileName } from '../data/relaxMedia'
import { FALLBACK_CATEGORY } from '../lib/appData'
import { dataUrlToBlob, deleteGalleryImage, galleryFileName, galleryUrl, listGallery, uploadGalleryImage, type GalleryFile } from '../lib/galleryFiles'
import { newId, resizeImage } from '../lib/images'
import { getStorageInfo, type StorageInfo } from '../lib/storage'
import type { GalleryItem, Student } from '../types'

const ALL = 'Wszystkie'
const STUDENTS = 'Uczniowie'

type Props = {
  items: GalleryItem[]
  categories: string[]
  students: Student[]
  classId: string
  onChange: (items: GalleryItem[]) => void
  onCategoriesChange: (categories: string[], items: GalleryItem[]) => void
}

type ShownItem = GalleryItem & { src: string; studentPhoto?: boolean }

/** Okno zarządzania kategoriami: dodawanie, zmiana nazwy (zdjęcia przechodzą razem) i usuwanie (zdjęcia do „Inne”). */
function CategoryManager({ categories, items, onSave, onClose }: { categories: string[]; items: GalleryItem[]; onSave: (categories: string[], items: GalleryItem[]) => void; onClose: () => void }) {
  const [newName, setNewName] = useState('')
  const count = (name: string) => items.filter((item) => item.category === name).length

  const rename = (oldName: string, value: string) => {
    const name = value.trim()
    if (!name || name === oldName || name === ALL || name === STUDENTS || categories.includes(name)) return
    onSave(categories.map((item) => item === oldName ? name : item), items.map((item) => item.category === oldName ? { ...item, category: name } : item))
  }

  const remove = (name: string) => {
    const photos = count(name)
    if (photos && !window.confirm(`Usunąć kategorię „${name}”? ${photos} zdj. przejdzie do kategorii „${FALLBACK_CATEGORY}”.`)) return
    onSave(categories.filter((item) => item !== name), items.map((item) => item.category === name ? { ...item, category: FALLBACK_CATEGORY } : item))
  }

  const add = () => {
    const name = newName.trim()
    if (!name || name === ALL || name === STUDENTS || categories.includes(name)) return
    onSave([...categories.filter((item) => item !== FALLBACK_CATEGORY), name, FALLBACK_CATEGORY], items)
    setNewName('')
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div className="category-manager panel" role="dialog" aria-modal="true" aria-labelledby="category-manager-title" onClick={(event) => event.stopPropagation()}>
        <div className="category-manager-head"><h2 id="category-manager-title">Kategorie zdjęć</h2><button onClick={onClose} aria-label="Zamknij"><X /></button></div>
        <div className="category-manager-list">
          {categories.map((name) => (
            <div key={name} className="category-manager-row">
              <input aria-label={`Nazwa kategorii ${name}`} defaultValue={name} disabled={name === FALLBACK_CATEGORY} onBlur={(event) => rename(name, event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') event.currentTarget.blur() }} />
              <span>{count(name)} zdj.</span>
              <button className="icon-delete" disabled={name === FALLBACK_CATEGORY} onClick={() => remove(name)} aria-label={`Usuń kategorię ${name}`}><Trash2 /></button>
            </div>
          ))}
        </div>
        <form className="place-search" onSubmit={(event) => { event.preventDefault(); add() }}>
          <input aria-label="Nowa kategoria" placeholder="Nowa kategoria, np. Teatr" value={newName} onChange={(event) => setNewName(event.target.value)} />
          <button type="submit"><Plus aria-hidden="true" /> Dodaj</button>
        </form>
        <p className="settings-hint">„{FALLBACK_CATEGORY}” zostaje zawsze. Zdjęcia uczniów pokazują się same w kategorii „{STUDENTS}” — zmienisz je w Ustawieniach → Uczniowie.</p>
      </div>
    </div>
  )
}

export function GalleryView({ items, categories, students, classId, onChange, onCategoriesChange }: Props) {
  const [category, setCategory] = useState(ALL)
  const [managingCategories, setManagingCategories] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [uploadCategory, setUploadCategory] = useState(categories[0] ?? FALLBACK_CATEGORY)
  const [message, setMessage] = useState('')
  const [storageInfo, setStorageInfo] = useState<StorageInfo | null>(null)
  const [files, setFiles] = useState<GalleryFile[]>([])
  const [editing, setEditing] = useState<{ title: string; category: string } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const folderMode = storageInfo?.kind === 'folder'

  const refreshFiles = useCallback(async () => {
    try {
      setFiles(await listGallery(classId))
    } catch {
      setMessage('Nie udało się odczytać folderu galerii.')
    }
  }, [classId])

  useEffect(() => {
    let active = true
    void getStorageInfo().then(async (info) => {
      if (!active) return
      setStorageInfo(info)
      if (info.kind === 'folder') {
        const listing = await listGallery(classId).catch(() => [])
        if (active) setFiles(listing)
      }
    })
    return () => { active = false }
  }, [classId])

  // Pliki z folderu (także wrzucone ręcznie) + podpisy z danych klasy; w trybie przeglądarki — zdjęcia zapisane w danych.
  const allItems = useMemo<ShownItem[]>(() => {
    const inlineItems = items.filter((item) => !item.file && item.src).map((item) => ({ ...item, src: item.src as string }))
    const fileItems = folderMode
      ? files.map((entry) => {
        const meta = items.find((item) => item.file === entry.name)
        return {
          id: meta?.id ?? entry.name,
          file: entry.name,
          title: meta?.title ?? titleFromFileName(entry.name),
          category: meta?.category ?? 'Inne',
          addedAt: meta?.addedAt ?? entry.modified,
          src: galleryUrl(classId, entry.name),
        }
      })
      : []
    const photos = [...fileItems, ...inlineItems]
      .map((item) => categories.includes(item.category) ? item : { ...item, category: FALLBACK_CATEGORY })
      .sort((a, b) => (b.addedAt ?? '').localeCompare(a.addedAt ?? ''))
    // Zdjęcia uczniów trafiają do galerii same (bez kopiowania) — na końcu listy, w kategorii „Uczniowie”.
    const studentPhotos = students.filter((student) => student.photo).map((student) => ({
      id: `student-${student.id}`, title: student.fullName || student.name, category: STUDENTS, src: student.photo, studentPhoto: true,
    }))
    return [...photos, ...studentPhotos]
  }, [categories, classId, files, folderMode, items, students])
  const hasStudentPhotos = allItems.some((item) => item.studentPhoto)
  const filters = [ALL, ...categories, ...(hasStudentPhotos ? [STUDENTS] : [])]

  const shown = useMemo(() => category === ALL ? allItems : allItems.filter((item) => item.category === category), [allItems, category])
  const activeIndex = shown.findIndex((item) => item.id === activeId)
  const active = activeIndex >= 0 ? shown[activeIndex] : null

  const addFiles = async (selected: FileList | null) => {
    if (!selected?.length) return
    setMessage('Dodaję zdjęcia…')
    try {
      const additions: GalleryItem[] = []
      for (const file of Array.from(selected)) {
        const id = newId('photo')
        const title = file.name.replace(/\.[^.]+$/, '')
        const addedAt = new Date().toISOString()
        if (folderMode) {
          const name = galleryFileName(title, id)
          await uploadGalleryImage(classId, name, await dataUrlToBlob(await resizeImage(file, 1920, 0.85)))
          additions.push({ id, file: name, title, category: uploadCategory, addedAt })
        } else {
          additions.push({ id, src: await resizeImage(file, 1280, 0.8), title, category: uploadCategory, addedAt, uploaded: true })
        }
      }
      onChange([...additions, ...items])
      if (folderMode) await refreshFiles()
      setCategory(uploadCategory)
      setMessage(`Dodano ${additions.length} ${additions.length === 1 ? 'zdjęcie' : 'zdjęcia'}.`)
    } catch {
      setMessage('Nie udało się dodać zdjęcia.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const saveCaption = () => {
    if (!active || !editing) return
    const patch = { title: editing.title.trim() || active.title, category: editing.category }
    const exists = items.some((item) => item.id === active.id)
    onChange(exists
      ? items.map((item) => item.id === active.id ? { ...item, ...patch } : item)
      : [{ id: active.id, file: active.file, addedAt: active.addedAt, ...patch }, ...items])
    if (patch.category !== category && category !== ALL) setCategory(patch.category)
    setEditing(null)
  }

  const removeActive = async () => {
    if (!active || !window.confirm(`Usunąć zdjęcie „${active.title}”?`)) return
    try {
      if (active.file) {
        await deleteGalleryImage(classId, active.file)
        await refreshFiles()
      }
      onChange(items.filter((item) => item.id !== active.id))
      setActiveId(null)
      setEditing(null)
    } catch {
      setMessage('Nie udało się usunąć zdjęcia.')
    }
  }

  const move = (delta: number) => {
    if (activeIndex < 0 || !shown.length) return
    setEditing(null)
    setActiveId(shown[(activeIndex + delta + shown.length) % shown.length].id)
  }

  return (
    <div className="gallery-view">
      <div className="gallery-toolbar">
        <div className="filter-pills" role="group" aria-label="Kategorie zdjęć">
          {filters.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => { setCategory(item); setActiveId(null) }}>{item}</button>)}
          <button className="filter-manage" onClick={() => setManagingCategories(true)}><Tags aria-hidden="true" /> Kategorie</button>
        </div>
        <div className="gallery-upload">
          <select aria-label="Kategoria nowych zdjęć" value={categories.includes(uploadCategory) ? uploadCategory : FALLBACK_CATEGORY} onChange={(event) => setUploadCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select>
          <button onClick={() => inputRef.current?.click()}><ImagePlus /> Dodaj zdjęcia</button>
          <input ref={inputRef} type="file" accept="image/*" multiple onChange={(event) => void addFiles(event.target.files)} />
        </div>
      </div>
      {message && <div className="gallery-message" role="status">{message}</div>}
      {!shown.length && <div className="gallery-empty panel"><span aria-hidden="true">🖼️</span><strong>{allItems.length ? 'Brak zdjęć w tej kategorii' : 'Galeria jest pusta'}</strong><p>Kliknij „Dodaj zdjęcia”{folderMode ? ' albo wrzuć pliki JPG/PNG do folderu galerii tej klasy' : ''}.</p></div>}
      <section className="gallery-grid" aria-label="Galeria klasy">
        {shown.map((item) => (
          <button key={item.id} onClick={() => setActiveId(item.id)}>
            <img src={item.src} alt={item.title} loading="lazy" />
            <span><strong>{item.title}</strong><small>{item.category}</small></span>
          </button>
        ))}
      </section>
      <div className="gallery-footer"><Heart /> Dobre wspomnienia zostają z nami.</div>
      {folderMode && storageInfo?.kind === 'folder' && (
        <p className="gallery-folder"><FolderOpen aria-hidden="true" /> Zdjęcia tej klasy: <code>{storageInfo.folder}/galeria/{classId}</code></p>
      )}

      {managingCategories && (
        <CategoryManager
          categories={categories}
          items={items}
          onClose={() => setManagingCategories(false)}
          onSave={(nextCategories, nextItems) => {
            onCategoriesChange(nextCategories, nextItems)
            if (category !== ALL && category !== STUDENTS && !nextCategories.includes(category)) setCategory(ALL)
          }}
        />
      )}

      {active && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Podgląd zdjęcia">
          <button className="lightbox-close" onClick={() => { setActiveId(null); setEditing(null) }} aria-label="Zamknij podgląd"><X /></button>
          <button onClick={() => move(-1)} aria-label="Poprzednie zdjęcie"><ChevronLeft /></button>
          <figure>
            <img src={active.src} alt={active.title} />
            {editing ? (
              <form className="lightbox-edit" onSubmit={(event) => { event.preventDefault(); saveCaption() }}>
                <input autoFocus aria-label="Podpis zdjęcia" value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} />
                <select aria-label="Kategoria zdjęcia" value={editing.category} onChange={(event) => setEditing({ ...editing, category: event.target.value })}>
                  {categories.map((item) => <option key={item}>{item}</option>)}
                </select>
                <button type="submit" className="primary"><Check /> Zapisz</button>
                <button type="button" onClick={() => setEditing(null)}>Anuluj</button>
              </form>
            ) : (
              <figcaption>
                <span>{active.title}<small>{active.category}</small></span>
                {active.studentPhoto ? (
                  <span className="lightbox-note">Zdjęcie ucznia — zmienisz je w Ustawieniach → Uczniowie</span>
                ) : (
                  <span className="lightbox-tools">
                    <button onClick={() => setEditing({ title: active.title, category: active.category })}><Pencil /> Edytuj podpis</button>
                    <button className="danger" onClick={() => void removeActive()} aria-label={`Usuń zdjęcie ${active.title}`}><Trash2 /></button>
                  </span>
                )}
              </figcaption>
            )}
          </figure>
          <button onClick={() => move(1)} aria-label="Następne zdjęcie"><ChevronRight /></button>
        </div>
      )}
    </div>
  )
}
