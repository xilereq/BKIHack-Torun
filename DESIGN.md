# Głos Osiedla — design (obowiązujący)

> Zatwierdzony 17.10.2026. Każdy ekran ma być z nim zgodny. Zmiany tylko po uzgodnieniu w zespole.
> Makiety: https://claude.ai/artifact/XEmWzwQjpJR2UoDnd39Gpg
> Tokeny w kodzie: `src/index.css` (blok `@theme`). Nie wpisuj kolorów „z ręki” w komponentach.

## Charakter

**Narzędzie współpracy, nie miejsce krytyki.** Aplikacja ma pomagać mieszkańcom i radnym wspólnie rozwiązywać sprawy, a nie podgrzewać emocji. Dlatego żadnych czerwonych wykrzykników ani słów „przeterminowane”, „nie dotrzymano”. Gdy plan miasta się opóźnia, piszemy „czeka na nowy termin” i proponujemy wspólny następny krok.

Czerwono-biały, uniwersalny, spokojny. Dużo bieli, płaskie karty, cienkie ramki, bez gradientów i ozdobników.
Ma wyglądać jak usługa publiczna, z której bez trudu skorzysta senior.

## Logo

Czerwony dymek (głos mieszkańca) z trzema białymi słupkami (bloki osiedla, a zarazem poziom głosu). Obok napis „Głos Osiedla” w kolorze `ink`, Atkinson Hyperlegible Bold.

- Pliki: `public/logo/znak.svg` (czerwony), `znak-czarny.svg` (jednobarwny), `znak-bialy.svg` (na czerwone tło), favicon `public/favicon.svg`. W kodzie: komponent `Logo` (`src/components/ui.tsx`).
- Porównanie wariantów i rozmiarów: `/logo/podglad.html` na serwerze deweloperskim.
- Znak bez kafelka i ramki; nie obracamy, nie zmieniamy proporcji ani kolorów słupków.

## Paleta

| Token | Hex | Do czego |
|---|---|---|
| `brand` | `#C8102E` | Marka i **główna akcja**. Jeden czerwony przycisk na ekran. |
| `brand-dark` | `#9E0B23` | Najechanie i wciśnięcie czerwonego przycisku, obrys znaczników |
| `brand-tint` | `#FDECEE` | Delikatne tło wyróżnień marki |
| `surface` | `#FFFFFF` | Karty, paski, panele |
| `canvas` | `#F5F6F8` | Tło ekranu |
| `line` | `#E2E5E9` | Ramki kart, podziały |
| `line-strong` | `#C9CED5` | Ramka przycisku drugorzędnego |
| `ink` | `#16191D` | Treść i nagłówki |
| `ink-2` | `#5A6270` | Opisy, podpisy, metadane |

### Statusy (tylko w etykietach, zawsze z ikoną i słowem)

| Status | Tekst | Tło |
|---|---|---|
| Nowe | `#3F4652` | `#EEF0F3` |
| Zaplanowane | `#1D4F9E` | `#E8F0FC` |
| Czeka na nowy termin | `#8A5300` | `#FDF3E1` (ciepły bursztyn, ikona zegara) |
| Rozwiązane | `#1C6B3C` | `#E5F4EA` |
| Pomysł | `#5B3A9E` | `#F0EBFA` |
| Zweryfikowany mieszkaniec | ikona tarczy `#1C6B3C`, biała etykieta z ramką | |

### Znaczniki na mapie

Wszystkie znaczniki to **okrągłe plakietki z minimalistyczną ikoną liniową** (biała obwódka, delikatny cień). Liczba zgłoszeń (od 2) w małej białej plakietce w prawym górnym rogu.

| Znacznik | Wygląd |
|---|---|
| Problem | czerwone kółko 34 px, biała ikonka kategorii (droga, chodnik, latarnia, kosz, kropla…), bez wykrzyknika |
| Pomysł | fioletowe kółko `#6A45B8`, biała żarówka |
| Rozwiązane | zielone kółko `#1C6B3C`, biały ptaszek |
| Dokument miasta | białe kółko 28 px, szara ramka, ikona dokumentu `ink` |
| Plan miasta czekający na aktualny termin | białe kółko, bursztynowa ramka `#C27C0E`, zegar |
| Zobowiązanie w terminie | białe kółko, niebieska ramka, niebieski kalendarz |

Zasada techniczna: element pozycjonowany przez MapLibre nie dostaje żadnych `transform`/`transition` ani nadpisania `className` (tylko `classList.add`), a wygląd jest w elemencie wewnętrznym. Inaczej punkty się rozjeżdżają.

### Zobowiązania miasta: etykiety

- „Plan VI 2026 · do aktualizacji” (bursztynowa, zegar), gdy termin upłynął, a prac nie wykonano.
- „Termin VI 2027” (niebieska), gdy termin jeszcze nie minął.
- „Pierwotny termin …, zmieniony” (szara), gdy miasto podało nowy termin.
- „Zrealizowano” (zielona) po wykonaniu remontu.
- Interpelacja pyta o aktualny harmonogram i o to, jak można pomóc, a nie o winnych.

## Typografia

Krój **Atkinson Hyperlegible** (400, 700), dołączony lokalnie przez `@fontsource`, więc działa bez internetu.

| Rola | Rozmiar / interlinia | Grubość |
|---|---|---|
| Display | 40 / 48 | 700 |
| H1 | 28 / 36 | 700 |
| H2 | 22 / 30 | 700 |
| Tekst | **18 / 28** | 400 |
| Mały | 15 / 22 | 400 |

Nic poniżej 15 px (wyjątek: liczby w znacznikach mapy, min. 12 px). Wersaliki tylko w krótkich etykietach sekcji.

## Kształty i odstępy

- Zaokrąglenia: przyciski i pola **14–16 px**, karty **16 px**, etykiety w pełni zaokrąglone.
- Ramki 1 px `line`. Karta wyróżniona: ramka 2 px `brand`. Bez cieni, poza znacznikami na mapie i oknami.
- Siatka 4 px. Odstępy w kartach 16–20 px, między kartami 12 px.

## Komponenty

- **Przycisk główny:** czerwone tło, biały tekst 20–22 px pogrubiony, wys. 60–64 px (mobile) / 52 px (desktop). Jeden na ekran.
- **Przycisk drugorzędny:** biały, ramka `line-strong`, tekst `ink` pogrubiony.
- **Link:** czerwony, pogrubiony, podkreślenie przy najechaniu.
- **Pole tekstowe:** etykieta nad polem (18 px, pogrubiona), wys. 56 px, aktywne pole w ramce 2 px `ink`.
- **Karta „Co miasto wie o tym miejscu”:** ramka 2 px `brand`, etykieta statusu, zdanie odpowiedzi, link do źródła.
- **Etykieta uzasadnienia pilności:** szare tło `#EEF0F3`, tekst `#3F4652`; „czeka na aktualny termin” w kolorach bursztynowych.
- **Wynik pilności:** ciemna plakietka (`ink`) dla 80+, szara dla niższych. Bez czerwieni.
- **Ślad AI:** każdy etap z chipem technologii (szare, kwadratowe: „LLM”, „Model wizyjny”, „Embeddingi”, „PostGIS”, „RAG · BIP”), krótkim wynikiem i rozwinięciem z paskami pewności i fragmentem zapytania.
- **Filtry panelu radnego:** listy rozwijane (Obszar, Sortuj według, Zgłoszone) i przełącznik statusu (Wszystkie, Do działania, Zaplanowane, Wykonane).
- **Karuzela zdjęć:** przesuwanie palcem (scroll-snap) i strzałki w białych kółkach, licznik „1/3” i kropki. Data zdjęcia w ciemnej plakietce.
- **Dymek na mapie (panel radnego):** biała karta 320 px nad punktem, zaokrąglenie 16 px; karuzela, statusy, tytuł, jedna etykieta, ciemny przycisk „Historia miejsca”.
- **Podbij sprawę:** przycisk w obrysie czerwonym, pigułka z ikoną strzałki w górę. Po podbiciu zielona pigułka „Podbite”. Bez weryfikacji przycisk otwiera weryfikację mObywatel.

## Wygląd aplikacji mobilnej (widok mieszkańca)

- **Ramka telefonu** (tylko na komputerze): ekran w prawdziwych wymiarach smartfona **393×852 pt**, ramka 12 px, zaokrąglenie 60/48 px, boczne przyciski, wyspa 124×36 px, pasek statusu 54 px nad treścią i wskaźnik domowy nad treścią. Całość skaluje się proporcjonalnie do wysokości okna (bez zgniatania). Na prawdziwym telefonie aplikacja jest pełnoekranowa, a marginesy biorą się z `env(safe-area-inset-*)`.
- **Marginesy bezpieczne:** każdy ekran używa `var(--safe-top)` i `var(--safe-bottom)` (w ramce 54/28 px).
- **Ekran startowy:** mapa na cały ekran; pływający nagłówek w pigułce (logo, nazwa, osiedle) i okrągły przycisk powiadomień. Żadnych stałych nakładek na mapie.
- **Dolny pasek:** Mapa · przycisk aparatu · Moje sprawy. Przycisk aparatu to czerwone kółko 68 px wystające ponad pasek; otwiera arkusz „Coś jest nie tak albo czegoś brakuje?” z opcjami: Zrób zdjęcie, Wybierz z galerii, Opisz bez zdjęcia.
- **Arkusz (bottom sheet):** zaokrąglenie 28 px u góry, uchwyt 40×6 px, przyciemnione tło.
- **Pasek nawigacji podstron:** wysokość 56 px, czerwone „‹ Wróć” po lewej, tytuł na środku.
- **Tytuł ekranu głównego:** duży, 32 px (np. „Moje sprawy”).
- **Przejścia:** nowy ekran wjeżdża z prawej, powrót z lewej, arkusze z dołu. Tylko przesunięcie, bez zmiany przezroczystości.
- **Główne przyciski w aplikacji mobilnej:** pigułki (`rounded-full`).
- **Zdjęcia:** wyłącznie prawdziwe (aparat, galeria, zdjęcia zespołu w `public/zdjecia/`). Ilustracje SVG są tylko zastępstwem, dopóki brak zdjęcia.

## Dostępność (cel: WCAG 2.1 AA)

- Cele dotykowe min. **48 px**.
- Kontrast tekstu min. 4,5:1 (wszystkie pary powyżej to spełniają).
- Widoczny fokus: obrys 3 px `ink` z odstępem 2 px.
- Prawdziwe `<button>`, `<a>`, `<label>`; przyciski z samą ikoną mają `aria-label`.
- Status nigdy nie jest przekazywany samym kolorem.
- Animacje wyłączane przy `prefers-reduced-motion`.

## Ton tekstów

Prosto, ciepło, po polsku, w drugiej osobie („Twoje zgłoszenie”). Bez żargonu urzędowego.
Każda informacja o planach miasta ma link do źródła.
