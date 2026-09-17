// Tworzy gotową paczkę na komputer z Windows: release/Hub klasowy/
//   aplikacja/                 – zbudowana aplikacja
//   relaks/obrazy|muzyka|natura – pliki relaksu (można dodawać i usuwać na Windowsie)
//   Zainstaluj na pulpicie.bat, Uruchom hub klasowy.bat, Zatrzymaj hub klasowy.bat, Udostepnij pusta aplikacje.bat,
//   serwer.ps1, hub-klasowy.ico, Instrukcja.txt
import { execSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const target = join('release', 'Hub klasowy')
const appDir = join(target, 'aplikacja')
const relaxDir = join(target, 'relaks')

// Folder relaks zostaje, jeśli już istnieje — żeby aktualizacja nie kasowała dodanych plików.
rmSync(appDir, { recursive: true, force: true })
mkdirSync(target, { recursive: true })

execSync(`npx tsc -b && npx vite build --mode windows --outDir "${appDir}" --emptyOutDir`, { stdio: 'inherit' })

for (const folder of ['obrazy', 'muzyka', 'natura']) {
  const destination = join(relaxDir, folder)
  if (!existsSync(destination)) cpSync(join('src', 'assets', 'relaks', folder), destination, { recursive: true })
}
cpSync(join('src', 'assets', 'relaks', 'ŹRÓDŁA.md'), join(relaxDir, 'ŹRÓDŁA.md'))
cpSync('windows', target, { recursive: true })

console.log(`\nGotowe: ${target}\nSkopiuj cały folder „Hub klasowy” na komputer z Windows i kliknij dwa razy „Zainstaluj na pulpicie.bat”.`)
