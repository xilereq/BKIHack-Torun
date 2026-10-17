# Głos Osiedla — wersja demonstracyjna (BKIhack 2026, Toruń)

> Zgłoszenia, które nie giną.

Mieszkaniec robi zdjęcie i mówi jedno zdanie. AI od razu odpowiada, co miasto w tym miejscu już planuje, łączy zgłoszenia w sprawy na mapie razem ze zobowiązaniami miasta, a radni dostają gotową listę spraw i szkic interpelacji.

To jest **wersja demonstracyjna (mock)**: dane i odpowiedzi AI są przygotowane lub symulowane. Opis pomysłu: [PROJEKT.md](PROJEKT.md). Design: [DESIGN.md](DESIGN.md). Scenariusz pokazu: [DEMO.md](DEMO.md).

## Uruchomienie

Wymagany Node.js 20+.

```bash
npm install && npm run dev
```

Aplikacja: http://localhost:5173

| Adres | Widok |
|---|---|
| `http://localhost:5173/#/mieszkaniec` | Mieszkaniec (na komputerze w ramce telefonu, na telefonie na cały ekran) |
| `http://localhost:5173/#/radny` | Panel radnego (laptop, projektor) |
| `http://localhost:5173/?demo` | Dowolny widok z otwartym panelem demo |

Z telefonu w tej samej sieci Wi-Fi: `npm run dev -- --host`, potem adres IP komputera z portem 5173.

Wersja produkcyjna (np. jako zapas offline poza mapą): `npm run build && npm run preview`.

## Panel demo (ukryty, dla zespołu)

Otwieranie i zamykanie:

- **Ctrl+Shift+D**,
- **Alt+Shift+D** (gdy Chrome przechwyci Ctrl+Shift+D),
- **trzy szybkie kliknięcia w lewy dolny róg ekranu**,
- parametr `?demo` w adresie.

Esc zamyka panel.

W panelu:

- przełączanie widoku: mieszkaniec / radny,
- szybki start zgłoszenia: „Dziura” albo „Ławka”. Ustawia miejsce i tekst mikrofonu, a zdjęcie dołącza z `public/zdjecia/zgloszenie-*.jpg`, jeśli istnieje,
- zdarzenia w sprawie: interpelacja, odpowiedź urzędu, remont zaplanowany, remont wykonany. Dotyczą ostatniej sprawy mieszkańca, a gdy jej nie ma, sprawy „Dziura przy Rubinkowo Centrum”,
- „Pokaż tę sprawę u mieszkańca”, „Zweryfikuj od razu” (pomija kod QR),
- **Reset demo**: kliknij dwa razy, wraca stan początkowy.

Stan zapisuje się w `localStorage` przeglądarki. Dwie karty (np. telefon na laptopie i panel radnego na projektorze) widzą zmiany nawzajem na bieżąco.

## Dane do podmiany

Wszystkie dane są **przykładowe** i trzymane w osobnych plikach JSON w `src/data/demo/`:

| Plik | Zawartość |
|---|---|
| `cases.json` | Sprawy: miejsce, kategoria, adresat, czynniki pilności, oś zdarzeń |
| `reports.json` | Zgłoszenia mieszkańców przypisane do spraw (`caseId`) |
| `documents.json` | Dokumenty miasta: interpelacje, odpowiedzi, plany, protokoły; `commitment` = zobowiązanie z terminem `RRRR-MM`; `hidden: true` = dokument odsłaniany przyciskiem w panelu demo |
| `places.json` | Nazwane miejsca (przystanki, szkoły) do opisu lokalizacji pinezki |
| `units.json` | Jednostki miejskie (MZD, MPO, Straż Miejska…) |

- Współrzędne przystanków, szkół i przychodni pochodzą z OpenStreetMap.
- Nazwiska radnych są fikcyjne (Anna Przykładowa, Piotr Testowy). Przed pokazem zespół podmienia dokumenty na prawdziwe przypadki z BIP.
- Linki źródłowe prowadzą do https://bip.torun.pl/interpelacje/29500. Podmień `url` na konkretny dokument.
- **Zdjęcia: tylko prawdziwe.** Dane wskazują na pliki w `public/zdjecia/`. Dopóki ich nie ma, aplikacja pokazuje ilustrację zastępczą z `public/demo/<nazwa>.svg`. Wrzuć zdjęcia pod tymi nazwami:

  | Plik | Do czego |
  |---|---|
  | `dziura.jpg`, `dziura-2.jpg`, `dziura-3.jpg` | Dziura przy przystanku Rubinkowo Centrum (karuzela 3 zdjęć) |
  | `trawnik.jpg`, `trawnik-2.jpg` | Trawnik przed blokiem (ławka, siłownia) |
  | `latarnia.jpg`, `latarnia-2.jpg` | Ciemne przejścia |
  | `chodnik.jpg`, `graffiti.jpg`, `kosz.jpg`, `studzienka.jpg`, `stojak.jpg`, `lawka.jpg` | Pozostałe sprawy |
  | `zgloszenie-dziura.jpg`, `zgloszenie-lawka.jpg` | Zdjęcie dołączane samo w scenariuszach z panelu demo (opcjonalne) |

  Format JPG, poziomo, ok. 1200 px szerokości. Bez twarzy i tablic rejestracyjnych.
- **Podbijanie spraw:** pole `supporters` w `cases.json` to liczba podbić od zweryfikowanych mieszkańców. Podbicie zwiększa pilność i pojawia się jako etykieta w panelu radnego.
- Status sprawy (przeterminowana, zaplanowana) liczy się sam z terminów w `documents.json` i bieżącej daty.

Po zmianie plików JSON kliknij **Reset demo**, bo przeglądarka trzyma poprzedni stan.

## Jak działa symulacja

| Element | Plik | Co robi |
|---|---|---|
| „AI” zgłoszeń | `src/lib/ai.ts` | Reguły słów kluczowych → problem albo pomysł, kategoria, adresat. Łączy ze sprawą tej samej kategorii w promieniu 150 m. Odpowiedź buduje z dokumentów sprawy. Odsiewa spam. |
| Pilność | `src/lib/domain.ts` | Wynik 0–99 z etykietami: liczba zgłoszeń, przeterminowanie, kursy komunikacji, bliskość szkoły i przychodni, czas oczekiwania |
| Szkic interpelacji | `src/lib/interpelacja.ts` | Szablon z przypisami do zgłoszeń i dokumentów |
| Weryfikacja mObywatel | `src/lib/verification.ts` | Interfejs `VerificationProvider` + `MockProvider` (symulowany kod QR) |
| Stan i zdarzenia | `src/lib/store.ts` | Stan demo, zgłoszenia, zdarzenia, powiadomienia, reset |

### mObywatel: kolejne implementacje `VerificationProvider`

Każdy dostawca zwraca `{ pesel, address }`. Funkcja `toVerification()` zostawia tylko pseudonim `HMAC-SHA256(PESEL, klucz serwera)` i flagę „zameldowany w Toruniu”. Resztę danych odrzuca od razu.

- `IntegratorProvider`: certyfikowany integrator (Autopay, IDENTT, Authologic). Kod QR, mieszkaniec skanuje w mObywatelu, integrator zwraca podpisane dane. Ścieżka na pilotaż.
- `LoginGovProvider`: login.gov.pl (Węzeł Krajowy, SAML 2.0). Gdy aplikację wdroży miasto.
- `EudiWalletProvider`: mObywatel Europa / EUDI Wallet. Przekazuje tylko atrybut „mieszka w Toruniu”.

## Technologia

Vite + React + TypeScript + Tailwind CSS 4. Mapa: MapLibre GL z podkładem OpenFreeMap (bez klucza API), a gdy ten jest niedostępny, kafelki rastrowe OpenStreetMap. Krój Atkinson Hyperlegible dołączony lokalnie. Bez serwera i bazy danych. Internet jest potrzebny tylko do podkładu mapy.

Worker MapLibre jest serwowany jako plik statyczny `public/vendor/maplibre-gl-worker.mjs`. Kopiuje go skrypt `postinstall` (`npm run copy-worker`).

Docelowa architektura (do pytań jury): PROJEKT.md, sekcja 7.
