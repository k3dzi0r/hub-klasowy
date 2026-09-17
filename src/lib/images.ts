/** Zmniejsza zdjęcie do podanego dłuższego boku i zapisuje jako JPEG (data URL), żeby zmieściło się w pamięci przeglądarki. */
export function resizeImage(file: File, maxSide: number, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const image = new Image()
      image.onerror = () => reject(new Error('Nie udało się odczytać zdjęcia.'))
      image.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        const context = canvas.getContext('2d')
        if (!context) return reject(new Error('Brak obsługi obrazu.'))
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', quality))
      }
      image.src = String(reader.result)
    }
    reader.readAsDataURL(file)
  })
}

export const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
