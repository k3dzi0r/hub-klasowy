// Obrazy i nagrania relaksu wbudowane w aplikację (tryb deweloperski i zwykły build).
export const pictureFiles = import.meta.glob('../assets/relaks/obrazy/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG,WEBP}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export const musicFiles = import.meta.glob('../assets/relaks/muzyka/*.{mp3,m4a,aac,ogg,oga,opus,wav,flac,MP3,M4A,WAV}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export const natureFiles = import.meta.glob('../assets/relaks/natura/*.{mp3,m4a,aac,ogg,oga,opus,wav,flac,MP3,M4A,WAV}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
