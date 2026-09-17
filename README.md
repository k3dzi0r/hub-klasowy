# Hub klasowy

Lokalna aplikacja na tablicę lub ekran w sali: obecność, plan dnia, automatyczne Teraz / Potem, timer, wydarzenia i urodziny, święto dnia, cytat dnia, pogoda, emocje, dyżury, galeria, relaks, komunikaty i proste wybory. Działa dla kilku klas korzystających z tej samej sali.

## Najważniejsze funkcje

- **Klasy:** każda ma własnych uczniów, plan, komunikaty, dyżury i galerię. Klasę zmienia się kliknięciem jej nazwy w lewym górnym rogu.
- **Plan dnia:** automatycznie przełącza lekcje i przerwy oraz odlicza czas do ich końca. Obok działa niezależny timer ręczny.
- **Wygląd:** tło i kolory zmieniają się z porą roku (albo wybrana pora na stałe); przezroczystość kart jest regulowana; osobny układ dla tablic 4:3.
- **Pogoda:** na żywo z Open-Meteo (bez klucza API) dla miejscowości ustawionej w Ustawieniach.
- **Dziś jest…:** wybiera się automatycznie z kalendarza świąt; nauczyciel może na dany dzień wskazać inne lub wpisać własne.
- **Cytat dnia:** zmienia się codziennie; dotknięcie karty pokazuje kolejny.
- **Urodziny:** pokazują się w wydarzeniach i w kalendarzu co roku, a w dniu urodzin przy zdjęciu pojawia się tort.
- **W Ustawieniach można dodawać, edytować i usuwać:** uczniów (ze zdjęciami), zajęcia w planie, wydarzenia, komunikaty i dyżury.
- **Relaks:** ćwiczenie oddechowe, odtwarzacz muzyki i dźwięków natury, obrazy z pokazem slajdów i pełnym ekranem. Pliki dodaje się, wrzucając je do folderów (opis i źródła nagrań: `src/assets/relaks/ŹRÓDŁA.md`).

## Dane, kopia i udostępnianie

- **Gdzie są dane:** w folderze `dane` obok aplikacji (w paczce Windows `Hub klasowy\dane`, przy `npm run dev` — `dane/` w projekcie):
  - `klasy.json` — lista klas,
  - `klasa-….json` — dane klasy (uczniowie z małymi zdjęciami, plan, komunikaty, dyżury, podpisy i kategorie galerii),
  - `galeria/klasa-…/` — zdjęcia galerii jako zwykłe pliki JPG/PNG. Można tu też wrzucać zdjęcia ręcznie: pojawią się w galerii z tytułem z nazwy pliku.
- **Kopie automatyczne:** przy pierwszej zmianie pliku danego dnia serwer odkłada jego poprzednią wersję do `dane/kopie/RRRR-MM-DD/`. Usunięte zdjęcia i galerie usuniętych klas też trafiają do kopii. Foldery starsze niż 30 dni są kasowane automatycznie (przy starcie serwera i przy pierwszej kopii nowego dnia).
- **Galeria:** podpis i kategorię zmienia się w podglądzie zdjęcia („Edytuj podpis”), a kategorie — przyciskiem „Kategorie”. Zdjęcia uczniów pokazują się same w kategorii „Uczniowie”.
- **Kopia całości / przeniesienie:** skopiuj folder `dane`. Jedna klasa: Ustawienia → Dane i kopia → „Pobierz kopię danych” (jeden plik `.json`, razem ze zdjęciami galerii) i „Wczytaj jako nową klasę”.
- **Bez serwera huba** aplikacja zapisuje dane w pamięci przeglądarki (IndexedDB), a zdjęcia galerii w danych klasy. Dane z przeglądarki przenoszą się do folderu `dane` automatycznie przy pierwszym uruchomieniu z serwerem.
- Do internetu idą tylko zapytania o pogodę.
- Folder `dane` i pliki kopii zawierają imiona, zdjęcia i daty urodzin uczniów — nie udostępniaj ich.
- **Pusta aplikacja dla innych nauczycieli:** w paczce Windows kliknij `Udostepnij pusta aplikacje.bat` — na pulpicie powstanie `Hub klasowy - pusta aplikacja.zip` bez folderu `dane`.

## Pliki z treściami

| Plik | Do czego służy |
| --- | --- |
| `src/data/content/kalendarz_dzienny_hub_v2.json` | święto / temat dnia na stronie głównej |
| `src/data/content/nietypowe_swieta_hub_v2.json` | lista nietypowych świąt dla wybranego dnia w Kalendarzu |
| `src/data/content/cytaty_hub_klasowy.json` | cytat dnia |
| `src/data/schedule.ts`, `announcements.ts` | przykładowy plan dnia i komunikat powitalny dla nowej klasy |
| `public/backgrounds/wiosna.jpg`, `lato.jpg`, `jesien.jpg`, `zima.jpg` | tła pór roku — wystarczy podmienić plik o tej samej nazwie |
| `src/assets/relaks/obrazy`, `muzyka`, `natura` | obrazy i nagrania relaksu — wrzuć plik, a pojawi się w aplikacji |

Kolory każdej pory roku są zdefiniowane na początku `src/styles.css` (`.app-shell[data-season="…"]`).

## Uruchomienie

```bash
npm install
npm run dev
```

Vite pokaże lokalny adres, zwykle `http://localhost:5173`. Aplikacja jest dostępna tylko na tym komputerze.

## Komputer w klasie (Windows)

```bash
npm run pakiet:windows
```

Powstaje folder `release/Hub klasowy` (bez danych uczniów) — skopiuj go w całości na komputer z Windows (np. pendrivem) i kliknij dwa razy `Zainstaluj na pulpicie.bat` — powstanie skrót „Hub klasowy” z ikoną (opcjonalnie też w autostarcie). Nic nie trzeba instalować: mały serwer w PowerShellu (`serwer.ps1`) udostępnia aplikację pod `http://localhost:8080` (tylko na tym komputerze), zapisuje dane do folderu `dane`, a Edge otwiera aplikację w oknie na pełnym ekranie. Obrazy i nagrania relaksu są w folderze `relaks` obok aplikacji — można je tam dodawać i usuwać bez przebudowy. Szczegóły, autostart i aktualizacja: `windows/Instrukcja.txt`.

## Sprawdzenie projektu

```bash
npm run lint
npm run build
```
