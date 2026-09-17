import react from '@vitejs/plugin-react'
import { createWriteStream } from 'node:fs'
import { copyFile, mkdir, readdir, readFile, rename, rm, stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { join, resolve } from 'node:path'
import { pipeline } from 'node:stream/promises'
import { defineConfig, type Plugin } from 'vite'

const DATA_DIR = resolve(import.meta.dirname, 'dane')
const NAME_PATTERN = /^[\w.-]+\.json$/
const CLASS_PATTERN = /^[\w-]+$/
const IMAGE_PATTERN = /^(?!\.)[^\\/:*?"<>|]+\.(jpe?g|png|webp)$/i
const IMAGE_TYPES: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }
const KEEP_BACKUP_DAYS = 30

const today = () => new Date().toISOString().slice(0, 10)

/** Przed pierwszą zmianą pliku danego dnia odkłada jego kopię do dane/kopie/RRRR-MM-DD/. */
async function dailySnapshot(name: string) {
  const source = join(DATA_DIR, name)
  const dayDir = join(DATA_DIR, 'kopie', today())
  const target = join(dayDir, name)
  try {
    await stat(target)
  } catch {
    try {
      await stat(source)
    } catch {
      return // pliku jeszcze nie ma — nie ma czego kopiować
    }
    const newDay = await stat(dayDir).then(() => false, () => true)
    await mkdir(dayDir, { recursive: true })
    await copyFile(source, target)
    if (newDay) await pruneSnapshots()
  }
}

/** Usuwane zdjęcia i galerie klas nie znikają od razu — trafiają do dane/kopie/RRRR-MM-DD/galeria/. */
async function moveToSnapshot(path: string, relative: string) {
  let target = join(DATA_DIR, 'kopie', today(), 'galeria', relative)
  // Jeśli coś o tej nazwie już tam leży (np. wcześniej usunięte zdjęcia tej klasy), nie nadpisujemy — dopisujemy znacznik czasu.
  if (await stat(target).then(() => true, () => false)) target = target.replace(/(\.[^./\\]+)?$/, (extension) => `-${Date.now()}${extension}`)
  await mkdir(join(target, '..'), { recursive: true })
  await rename(path, target)
}

async function handleGallery(req: IncomingMessage, res: ServerResponse) {
  const [classId, name, ...rest] = new URL(req.url ?? '/', 'http://localhost').pathname.split('/').filter(Boolean).map(decodeURIComponent)
  if (!classId || !CLASS_PATTERN.test(classId) || rest.length || (name && !IMAGE_PATTERN.test(name))) {
    res.statusCode = 400
    res.end()
    return
  }
  const dir = join(DATA_DIR, 'galeria', classId)

  if (!name) {
    if (req.method === 'DELETE') {
      await stat(dir).then(() => moveToSnapshot(dir, classId), () => undefined)
      res.statusCode = 204
      res.end()
      return
    }
    await mkdir(dir, { recursive: true })
    const entries = await readdir(dir, { withFileTypes: true })
    const files = await Promise.all(entries.filter((entry) => entry.isFile() && IMAGE_PATTERN.test(entry.name)).map(async (entry) => {
      const info = await stat(join(dir, entry.name))
      return { name: entry.name, size: info.size, modified: info.mtime.toISOString() }
    }))
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader('Cache-Control', 'no-store')
    res.end(JSON.stringify({ files }))
    return
  }

  const file = join(dir, name)
  if (req.method === 'GET') {
    try {
      const info = await stat(file)
      res.setHeader('Content-Type', IMAGE_TYPES[name.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream')
      res.setHeader('Content-Length', info.size)
      res.setHeader('Cache-Control', 'no-cache')
      await pipeline(createReadStream(file), res)
    } catch {
      res.statusCode = 404
      res.end()
    }
    return
  }
  if (req.method === 'PUT') {
    await mkdir(dir, { recursive: true })
    const temp = `${file}.${Date.now()}.tmp`
    await pipeline(req, createWriteStream(temp))
    await rename(temp, file)
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method === 'DELETE') {
    await stat(file).then(() => moveToSnapshot(file, join(classId, name)), () => undefined)
    res.statusCode = 204
    res.end()
    return
  }
  res.statusCode = 405
  res.end()
}

async function pruneSnapshots() {
  const limit = Date.now() - KEEP_BACKUP_DAYS * 86_400_000
  const folders = await readdir(join(DATA_DIR, 'kopie')).catch(() => [])
  for (const folder of folders) {
    const time = Date.parse(folder)
    if (!Number.isNaN(time) && time < limit) await rm(join(DATA_DIR, 'kopie', folder), { recursive: true, force: true })
  }
}

async function handleData(req: IncomingMessage, res: ServerResponse) {
  const name = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname.replace(/^\//, ''))
  await mkdir(DATA_DIR, { recursive: true })
  res.setHeader('Cache-Control', 'no-store')

  if (!name) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify({ ok: true, folder: DATA_DIR }))
    return
  }
  if (!NAME_PATTERN.test(name)) {
    res.statusCode = 400
    res.end()
    return
  }

  const file = join(DATA_DIR, name)
  if (req.method === 'GET') {
    try {
      const body = await readFile(file)
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(body)
    } catch {
      res.statusCode = 404
      res.end()
    }
    return
  }
  if (req.method === 'PUT') {
    const temp = `${file}.${Date.now()}.tmp`
    await pipeline(req, createWriteStream(temp))
    try {
      JSON.parse(await readFile(temp, 'utf8'))
    } catch {
      await rm(temp, { force: true })
      res.statusCode = 400
      res.end()
      return
    }
    await dailySnapshot(name)
    await rename(temp, file)
    res.statusCode = 204
    res.end()
    return
  }
  if (req.method === 'DELETE') {
    await dailySnapshot(name)
    await rm(file, { force: true })
    res.statusCode = 204
    res.end()
    return
  }
  res.statusCode = 405
  res.end()
}

/** Folder „dane” w trybie deweloperskim — to samo API co serwer w paczce Windows (windows/serwer.ps1). */
function folderDataPlugin(): Plugin {
  const attach = (middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void }) => {
    void pruneSnapshots()
    middlewares.use('/api/dane', (req, res) => {
      handleData(req, res).catch((error: unknown) => {
        console.error('[dane]', error)
        res.statusCode = 500
        res.end()
      })
    })
    middlewares.use('/api/galeria', (req, res) => {
      handleGallery(req, res).catch((error: unknown) => {
        console.error('[galeria]', error)
        if (!res.headersSent) res.statusCode = 500
        res.end()
      })
    })
  }
  return {
    name: 'hub-klasowy-dane',
    configureServer: (server) => attach(server.middlewares),
    configurePreviewServer: (server) => attach(server.middlewares),
  }
}

// Paczka na Windows (npm run pakiet:windows, tryb „windows”) bierze obrazy i nagrania relaksu z folderu obok aplikacji,
// więc nie wbudowujemy ich drugi raz do środka.
export default defineConfig(({ mode }) => ({
  base: mode === 'demo' ? '/hub-klasowy/' : '/',
  plugins: [react(), folderDataPlugin()],
  resolve: {
    alias: mode === 'windows'
      ? [{ find: /^\.\/relaxBundled$/, replacement: '/src/data/relaxBundled.empty.ts' }]
      : [],
  },
}))
