# Głos Osiedla — design (obowiązujący)

> Zatwierdzony 17.10.2026. Każdy ekran ma być z nim zgodny. Zmiany tylko po uzgodnieniu w zespole.
> Makiety: https://claude.ai/artifact/XEmWzwQjpJR2UoDnd39Gpg
> Tokeny w kodzie: `src/index.css` (blok `@theme`). Nie wpisuj kolorów „z ręki” w komponentach.

## Charakter

Czerwono-biały, uniwersalny, spokojny. Dużo bieli, płaskie karty, cienkie ramki, bez gradientów i ozdobników.
Ma wyglądać jak usługa publiczna, z której bez trudu skorzysta senior.

## Paleta

| Token | Hex | Do czego |
|---|---|---|
| `brand` | `#C8102E` | Marka i **główna akcja**. Jeden czerwony przycisk na ekran. |
| `brand-dark` | `#9E0B23` | Najechanie i wciśnięcie czerwonego przycisku, obrys znaczników |
| `brand-tint` | `#FDECEE` | Tło wyróżnień i etykiety „przeterminowane” |
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
| Przeterminowane | `#A1121F` | `#FDECEE` |
| Rozwiązane | `#1C6B3C` | `#E5F4EA` |
| Pomysł | `#5B3A9E` | `#F0EBFA` |
| Zweryfikowany mieszkaniec | ikona tarczy `#1C6B3C`, biała etykieta z ramką | |

### Znaczniki na mapie

- **Problem:** czerwone kółko (`brand`) z białą obwódką, liczba zgłoszeń w środku.
- **Pomysł:** fioletowe kółko `#6A45B8`.
- **Dokument miasta:** czarny kwadrat `ink` z zaokrągleniem.
- **Obietnica przeterminowana:** biały kwadrat z grubą czerwoną ramką.
- **Rozwiązane:** białe kółko z zieloną ramką `#1C6B3C`.

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
- **Etykieta uzasadnienia pilności:** szare tło `#EEF0F3`, tekst `#3F4652`; „przeterminowane” w kolorach statusu.

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
