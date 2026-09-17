// Zdjęcia galerii jako zwykłe pliki w dane/galeria/<klasa>/ (przez lokalny serwer huba).
import type { GalleryItem } from '../types'

export type GalleryFile = { name: string; size: number; modified: string }

const base = (classId: string) => `api/galeria/${encodeURIComponent(classId)}/`

export const galleryUrl = (classId: string, name: string) => `${base(classId)}${encodeURIComponent(name)}`

export async function listGallery(classId: string): Promise<GalleryFile[]> {
  const response = await fetch(base(classId), { cache: 'no-store' })
  if (!response.ok) throw new Error(`Galeria: ${response.status}`)
  return ((await response.json()) as { files: GalleryFile[] }).files
}

export async function uploadGalleryImage(classId: string, name: string, image: Blob) {
  const response = await fetch(galleryUrl(classId, name), { method: 'PUT', headers: { 'Content-Type': image.type || 'image/jpeg' }, body: image })
  if (!response.ok) throw new Error(`Wysyłanie zdjęcia: ${response.status}`)
}

export async function deleteGalleryImage(classId: string, name: string) {
  const response = await fetch(galleryUrl(classId, name), { method: 'DELETE' })
  if (!response.ok && response.status !== 404) throw new Error(`Usuwanie zdjęcia: ${response.status}`)
}

export async function deleteGalleryFolder(classId: string) {
  await fetch(base(classId), { method: 'DELETE' }).catch(() => undefined)
}

/** Czytelna i stała nazwa pliku: „Wycieczka do zoo-ab12cd.jpg” (ten sam element → ta sama nazwa). */
export function galleryFileName(title: string, id: string) {
  const readable = title.normalize('NFC').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'zdjecie'
  const suffix = id.replace(/[^\w]/g, '').slice(-8)
  return `${readable}-${suffix}.jpg`
}

export const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob()

export const blobToDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result))
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(blob)
})

/** Zdjęcia zapisane w danych klasy (data URL) przenosi do plików; zwraca galerię z nazwami plików. */
export async function externalizeGallery(classId: string, gallery: GalleryItem[]) {
  return Promise.all(gallery.map(async (item) => {
    if (item.file || !item.src?.startsWith('data:')) return item
    const file = galleryFileName(item.title, item.id)
    await uploadGalleryImage(classId, file, await dataUrlToBlob(item.src))
    return { id: item.id, file, title: item.title, category: item.category, addedAt: item.addedAt ?? new Date().toISOString() }
  }))
}

/** Na potrzeby pliku kopii: zdjęcia z folderu (także wrzucone ręcznie) pakuje z powrotem jako data URL. */
export async function inlineGallery(classId: string, gallery: GalleryItem[], defaultTitle: (file: string) => string) {
  const files = await listGallery(classId)
  return Promise.all(files.map(async (entry) => {
    const meta = gallery.find((item) => item.file === entry.name)
    const blob = await (await fetch(galleryUrl(classId, entry.name))).blob()
    return {
      id: meta?.id ?? entry.name,
      src: await blobToDataUrl(blob),
      title: meta?.title ?? defaultTitle(entry.name),
      category: meta?.category ?? 'Inne',
      addedAt: meta?.addedAt ?? entry.modified,
    } satisfies GalleryItem
  }))
}
