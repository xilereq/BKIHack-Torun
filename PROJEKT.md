# Głos Osiedla — opis projektu (BKIhack 2026, Toruń)

> Nazwa robocza. Punkt startowy do budowy projektu w nowym czacie.
> Mapa pomysłu: https://claude.ai/artifact/Uf93TPnifk51fpX1Y6HjTr (kopia lokalna: `mapa-pomyslu.html`)
> Instrukcja dla modelu budującego aplikację: `PROMPT.md`
>
> **Tryb budowy: wersja demonstracyjna (mock).** Na hackathonie budujemy aplikację, która wygląda i zachowuje się jak gotowy produkt, ale dane i odpowiedzi AI są przygotowane wcześniej lub symulowane. Opis prawdziwej architektury (sekcja 7) służy do odpowiedzi na pytania jury. Szczegóły budowy: sekcja 6a.

---

## 1. W jednym zdaniu

**Mieszkaniec robi zdjęcie i mówi, co jest nie tak albo czego brakuje. AI od razu odpowiada, co miasto w tym miejscu już planuje, porządkuje zgłoszenia na mapie razem ze zobowiązaniami miasta, a radni i urzędnicy dostają gotową listę spraw. Mieszkaniec jest informowany aż do rozwiązania sprawy.**

Hasło: *„Zgłoszenia, które nie giną.”*

Cel emocjonalny: mieszkaniec ma czuć, że jego potrzeby są ważne i zauważone przez rządzących, a aplikacja nie jest forum frustracji, tylko drogą do dobrych zmian w okolicy.

## 2. Problem (dowody do filmu i pitchu)

- Miejski serwis Dbam o Miasto: **716 zgłoszeń w całym 2022 r.** na ok. 170 tys. mieszkańców ([Tylko Toruń](https://tylkotorun.pl/wiadomosci/inne/jak-dzialala-aplikacja-dbam-o-miasto-w-minionym-roku/)).
- Kwiecień 2026: **546 zgłoszeń wciąż „nowych”**, część sprzed ok. 4 lat, niektóre zamknięte jako wykonane, choć nie były ([Tylko Toruń](https://tylkotorun.pl/wiadomosci/jak-dziala-torunski-system-do-zglaszania-usterek-przez-mieszkancow/)).
- Barometr Toruński (UMK, n=420): **ok. 1/4 mieszkańców nie wie, jak rozwiązać lokalny problem**, w konsultacjach uczestniczy **7%** ([torun.pl](https://torun.pl/pl/aktualnosc/poznalismy-wyniki-barometru-torunskiego)).

**Wniosek:** próg wejścia jest za wysoki, a zgłoszenia giną po drodze. Radni i urząd nie mają jednego obrazu tego, co mieszkańców boli i co już obiecano.

## 3. Rdzeń produktu: 5 elementów

### 1) Zgłoszenie w 10 sekund: problem albo pomysł
- **Zdjęcie + opis** słowami (pisany albo mówiony). Nic więcej.
- Dwa rodzaje zgłoszeń, rozpoznawane przez AI z opisu:
  - **Problem:** dziura, zniszczona ławka, graffiti, zepsuta latarnia.
  - **Pomysł na okolicę:** ławka przed blokiem, kosz na śmieci, latarnia, stojak na rowery, plac zabaw. Drobne rzeczy trafiają do odpowiedniej jednostki jako prośba; przy większych (np. plac zabaw) AI podpowiada też ścieżkę budżetu obywatelskiego.
- Lokalizacja z telefonu lub ze zdjęcia; bez zgody: pinezka na mapie.
- **Bez zakładania konta.**

### 2) AI porządkuje zgłoszenia
- Odsiewa spam i treści niezwiązane z miastem.
- Nadaje kategorię i wskazuje **kto za to odpowiada** (MZD, MPO, Straż Miejska, GDDKiA…), z krótkim wyjaśnieniem.
- **Łączy duplikaty** (to samo miejsce, podobne zdjęcie i opis) w jedną sprawę z licznikiem zgłoszeń.
- Ustala **pilność z uzasadnieniem**: ciężkość szkody ze zdjęcia, ruch w tym miejscu (np. liczba kursów autobusów), bliskość szkoły lub szpitala, jak długo sprawa wisi, liczba zgłoszeń.

### 3) Mapa ze zobowiązaniami miasta (główna innowacja)
- Na mapie, obok zgłoszeń: **interpelacje radnych, odpowiedzi prezydenta i zapowiedziane remonty** wyciągnięte z dokumentów w BIP.
- Kliknięcie w miejsce pokazuje: *„To miejsce zgłaszano 4 razy. W III 2025 urząd zapowiedział remont do VI 2026. Termin minął.”*
- **Przeterminowane zobowiązania** są wyróżnione.
- Każda informacja ma link do dokumentu źródłowego.

### 4) Panel dla radnych i urzędu
- Mapa okręgu ze sprawami pogrupowanymi i ułożonymi według pilności.
- Historia miejsca (zgłoszenia + dokumenty + zobowiązania).
- **Szkic interpelacji jednym kliknięciem**: na podstawie zgrupowanych zgłoszeń, zdjęć i wcześniejszych odpowiedzi, z przypisami do źródeł. Radny edytuje i wysyła sam.
- Pomysły mieszkańców pogrupowane: np. „12 osób prosi o ławkę przy bloku Kościuszki 50”.

### 5) Informacja zwrotna: mieszkaniec wie, co dzieje się z jego sprawą
- **Od razu po zgłoszeniu** AI sprawdza dokumenty i plany miasta dla tego miejsca i odpowiada, np.:
  - *„Remont Szosy Chełmińskiej na tym odcinku jest zaplanowany na 2027 r.”* (z linkiem do źródła),
  - *„To miejsce zgłoszono już 6 razy, radny okręgu złożył w tej sprawie interpelację.”*,
  - *„Nie znaleźliśmy planów dla tego miejsca. Twoje zgłoszenie trafia do MZD i radnych okręgu.”*
- **Później** powiadomienia, gdy pojawi się coś nowego w tej sprawie: interpelacja złożona → odpowiedź urzędu → remont zaplanowany → remont wykonany.
- **Po remoncie** pytanie: *„Remont wykonany. Czy Twój problem jest rozwiązany?”*
  - **Tak** → sprawa zamknięta.
  - **Nie** → nowe zgłoszenie powiązane z poprzednim. Jeśli dotyczy świeżo wyremontowanego miejsca, urząd dostaje sygnał, że usterka może podlegać gwarancji wykonawcy.

### Wiarygodność: weryfikacja przez mObywatel
- Zgłoszenie nie wymaga logowania (niski próg).
- Mieszkaniec może **raz zweryfikować się przez mObywatel** → jego zgłoszenia mają znaczek „zweryfikowany mieszkaniec”, a radni mogą filtrować tylko zweryfikowane.
- Na hackathonie: przycisk i symulowany przebieg, architektura gotowa na prawdziwą integrację (sekcja 6).

## 4. Dlaczego to jest nowe

- Zgłaszanie usterek istnieje (Dbam o Miasto, Naprawmy To, mMieszkaniec, Warszawa 19115), ale to formularz do urzędu bez kontekstu.
- Narzędzia AI dla samorządów w USA (Citizen Portal AI, Civic Sunlight, Hamlet) streszczają posiedzenia, ale nie przypinają dokumentów do miejsc na mapie.
- **Nikt nie łączy zgłoszeń mieszkańców z tym, co miasto już obiecało w danym miejscu, ani nie odpowiada mieszkańcowi od razu, co jest zaplanowane.**

## 5. Zakres na hackathon

**Pokazujemy (MVP):**
1. Zgłoszenie: zdjęcie + opis (tekst lub głos) + lokalizacja → AI rozpoznaje problem albo pomysł, zwraca kategorię, adresata, pilność i łączy z podobnymi.
2. **Natychmiastowa odpowiedź** dla mieszkańca: co miasto w tym miejscu planuje lub już zrobiło, ze źródłem.
3. Mapa: zgłoszenia + dokumenty z BIP + przeterminowane zobowiązania; widok historii miejsca.
4. Panel radnego: lista spraw według pilności + szkic interpelacji ze źródłami.
5. **Oś powiadomień sprawy** (symulowana na demo: przycisk „pojawił się nowy dokument”) i pytanie po remoncie „Czy problem rozwiązany?”.
6. Przycisk „Zweryfikuj przez mObywatel” (symulacja) i znaczek.

Pomysł na okolicę (np. ławka) pokazujemy jako drugi, krótki przykład w demo na żywo (ok. 15 s), nie w filmie.

**Poza zakresem (roadmapa, najwyżej jeden slajd):** obserwowanie całej okolicy (nie tylko własnych zgłoszeń), generator wniosków dla mieszkańców, pełne powiązanie z budżetem obywatelskim, zgłoszenia w innych językach, rozmazywanie twarzy i tablic, własność działek, panel dla jednostek miejskich, automatyczne zgłaszanie usterek gwarancyjnych, inne miasta.

**Zasada:** dokumenty z BIP przetwarzamy przed demo. Na żywo działa tylko zgłoszenie i przeglądanie mapy. Obszar demo: **jedno osiedle**.

## 6. Integracja z mObywatelem: jak to zrobić teraz i w przyszłości

### Co da się dostać
- mObywatel nie daje „UUID” użytkownika. Stabilnym identyfikatorem osoby jest **PESEL**.
- W weryfikacji tożsamości kodem QR w mObywatelu firma może otrzymać m.in. imię i nazwisko, PESEL, numer dowodu i **adres zameldowania** ([Autopay](https://pomoc.autopay.pl/weryfikacje/mobywatel)). Dane pochodzą z rejestrów państwowych i są podpisane certyfikatem ([IDENTT](https://identt.io/solution/mobywatel/)).

### Nasz projekt danych (minimalizacja, RODO)
1. Weryfikacja zwraca PESEL i adres zameldowania.
2. Liczymy **pseudonim mieszkańca = HMAC-SHA256(PESEL, tajny klucz serwera)**. To nasz stabilny identyfikator („UUID”): ta sama osoba zawsze dostaje ten sam pseudonim, więc jedna osoba to jedno konto, a PESEL-u nie przechowujemy.
3. Z adresu zapisujemy tylko **tak/nie: zameldowany w Toruniu** (i ewentualnie okręg).
4. Imię, nazwisko, PESEL i adres usuwamy od razu po weryfikacji.
5. Zapisujemy: pseudonim, flagę „zweryfikowany”, flagę „Toruń”, datę weryfikacji.

Uwaga: zameldowanie to nie to samo co zamieszkanie (np. studenci). Dlatego weryfikacja daje znaczek, a nie blokuje zgłoszeń.

### Trzy ścieżki wdrożenia
| Ścieżka | Kiedy | Jak | Uwagi |
|---|---|---|---|
| **A. Certyfikowany integrator** (np. Autopay, IDENTT, Authologic) | Pilotaż, tygodnie | Kod QR na stronie → użytkownik skanuje w mObywatelu → integrator zwraca podpisane dane | Firmy łączą się przez integratorów, nie bezpośrednio (wg [Authologic](https://mobywatel.authologic.com/pl/)); opłata za weryfikację |
| **B. login.gov.pl (Węzeł Krajowy)** | Gdy aplikację wdroży miasto | Logowanie mObywatelem / profilem zaufanym / bankiem przez SAML 2.0 | Przeznaczone głównie dla podmiotów publicznych; integracja ok. 1,5 miesiąca ([przewodnik](https://www.gov.pl/attachment/3d21beab-aa2e-426b-90f8-2fa300916891)) |
| **C. Europejski portfel tożsamości (mObywatel Europa, EUDI Wallet)** | Przyszłość | Mieszkaniec przekazuje tylko potrzebny atrybut, np. „mieszka w Toruniu”, bez ujawniania nazwiska | Sandbox planowany od VIII 2026, pełne wdrożenie na XII 2026 (wg [COI](https://www.coi.gov.pl/aktualnosci/europejski-portfel-tozsamosci-cyfrowej-zmierza-do-mobywatela), [tmt.expert](https://tmt.expert/mobywatel-europa-sandbox-i-eidas-2-0-kluczowe-wnioski-z-warsztatow-w-coi-2998/)); terminy do potwierdzenia |

### Na hackathonie
- W kodzie interfejs `VerificationProvider` z metodą `verify() → {pesel, address}`.
- Implementacja `MockProvider` (symulowany kod QR i odpowiedź testowa).
- Miejsca na `IntegratorProvider`, `LoginGovProvider`, `EudiWalletProvider` opisane w README.
- Na pitchu jedno zdanie: „Weryfikacja przez mObywatel jest gotowa architektonicznie. Prawdziwe podłączenie to umowa z integratorem, a docelowo europejski portfel, który pozwoli potwierdzić, że ktoś mieszka w Toruniu, bez ujawniania nazwiska.”

## 6a. Jak budujemy na hackathon: wersja demonstracyjna

- **Cel:** jury i widzowie mają mieć wrażenie, że wszystko działa. Nie ma przeglądu kodu, pytania techniczne obsługuje zespół.
- **Technologia:** TypeScript, prosta aplikacja webowa uruchamiana jednym poleceniem (`npm install && npm run dev`), bez własnego serwera. Stan w przeglądarce, dane startowe w plikach JSON.
- **AI symulowane:** odpowiedzi przygotowane dla scenariuszy demo, z animacją „AI analizuje…” i realistycznym opóźnieniem. Dla nieprzewidzianych zgłoszeń proste reguły (słowa kluczowe → kategoria i adresat), żeby aplikacja nigdy nie pokazała pustego ekranu.
- **Mapa prawdziwa:** podkład OpenStreetMap, prawdziwe ulice Torunia na osiedlu demo.
- **Dane startowe demonstracyjne:** zgłoszenia, dokumenty i zobowiązania wyglądają realistycznie, ale są przykładowe i oznaczone w kodzie jako demo. Bez prawdziwych nazwisk radnych. Przed prezentacją zespół podmienia je na prawdziwe przypadki z BIP.
- **Panel demo:** ukryty panel (skrót klawiszowy) do przełączania widoków, dopisywania zdarzeń („pojawiła się odpowiedź urzędu”, „remont wykonany”) i resetu demo.
- **mObywatel:** symulowany kod QR i odpowiedź „zweryfikowano”.

## 7. Docelowa architektura (do odpowiedzi na pytania jury)

- **Backend:** Python + FastAPI.
- **Baza:** PostgreSQL + PostGIS + pgvector (na szybko: SQLite + SpatiaLite).
- **Frontend:** aplikacja webowa (PWA), np. React + Vite + MapLibre GL.
- **AI:** model LLM z obsługą obrazu (kategoria, adresat, pilność, ekstrakcja z PDF, szkic interpelacji), model mowa → tekst, osadzenia obrazu i tekstu do łączenia duplikatów. Konkretne modele: do ustalenia.

**Potoki:**
1. *Dokumenty (przed demo):* BIP (interpelacje, odpowiedzi; PDF) → tekst → LLM wyciąga temat, miejsca, zobowiązanie i termin → dopasowanie nazw ulic (polska odmiana) do punktów adresowych PRG i ulic OSM → baza.
2. *Zgłoszenie (na żywo):* zdjęcie + opis + lokalizacja → LLM: problem czy pomysł, kategoria, adresat, pilność → wyszukanie podobnych w promieniu → nowa sprawa albo dołączenie do istniejącej.
3. *Natychmiastowa odpowiedź:* dokumenty i plany w promieniu oraz na tej samej ulicy → LLM formułuje 1–2 zdania dla mieszkańca, z linkiem do źródła; gdy nic nie ma, mówi wprost, dokąd trafia zgłoszenie.
4. *Powiadomienia:* każde zgłoszenie ma oś zdarzeń (zgłoszone → połączone z innymi → interpelacja → odpowiedź → remont zaplanowany → remont wykonany → „czy rozwiązane?”). Nowy dokument przypisany do miejsca dopisuje zdarzenie i powiadamia zgłaszających w pobliżu. Na demo zdarzenia dopisuje przycisk symulacji.
5. *Szkic interpelacji:* sprawa + dokumenty z tego miejsca → LLM z szablonem → tekst z przypisami.

**Główne encje:** `report` (zgłoszenie: typ problem/pomysł, zdjęcie, opis, geom, kategoria, adresat, pilność, sprawa), `case` (sprawa: zgrupowane zgłoszenia), `document` (dokument z BIP lub plan remontu, z miejscami i zobowiązaniami), `event` (zdarzenie na osi sprawy), `resident` (pseudonim, zweryfikowany, Toruń).

**Dane:**
| Dane | Źródło |
|---|---|
| Interpelacje i odpowiedzi | https://bip.torun.pl/interpelacje/29500 (treść w PDF) |
| Plany inwestycji i remontów (do sprawdzenia: budżet, WPF, komunikaty MZD) | torun.pl, bip.torun.pl, mzd.torun.pl |
| Punkty adresowe | PRG, https://www.geoportal.gov.pl/pl/dane/panstwowy-rejestr-granic |
| Ulice, punkty, kategorie dróg | OpenStreetMap |
| Rozkład autobusów (do pilności) | https://mkuran.pl/gtfs/torun.zip |

## 8. Zasady
- **Każda informacja ze źródłem**; AI nie wymyśla faktów.
- **Neutralność:** wszyscy radni okręgu widzą to samo.
- **RODO:** brak danych osobowych w zgłoszeniu; weryfikacja zostawia tylko pseudonim i flagi.
- **Dostępność:** duże przyciski, kontrast, czytniki ekranu, opis głosem (WCAG 2.1 AA).

## 9. Podział pracy (4 osoby)
| Osoba | Zadanie |
|---|---|
| A | Dokumenty z BIP: pobranie, ekstrakcja LLM, **znalezienie 2–3 prawdziwych przeterminowanych zobowiązań** na osiedlu demo |
| B | Geodane i backend: PRG + OSM, dopasowanie nazw ulic, baza, API |
| C | Frontend: ekran zgłoszenia, mapa, historia miejsca, panel radnego, przycisk mObywatel |
| D | AI zgłoszeń: kategoria, adresat, duplikaty, pilność, szkic interpelacji; potem film i pitch |

## 10. Film (2 min) i pitch (4 min)

**Film:**
| Czas | Treść |
|---|---|
| 0:00–0:20 | Sonda: „Gdzie zgłosiłbyś dziurę?” → „nie wiem” |
| 0:20–0:40 | Liczby: 716 zgłoszeń rocznie, 546 wiszących, co czwarty nie wie, jak rozwiązać problem |
| 0:40–1:40 | Demo: zdjęcie + jedno zdanie → od razu odpowiedź „remont zaplanowany, termin minął” → radny jednym kliknięciem ma szkic interpelacji → mieszkaniec dostaje powiadomienie o odpowiedzi urzędu → po remoncie „Czy problem rozwiązany?” |
| 1:40–2:00 | „Zgłoszenia, które nie giną. Twój głos jest zauważony.” |

**Pitch:**
| Czas | Treść |
|---|---|
| 0:00–0:30 | Problem: liczby i jeden cytat z sondy |
| 0:30–2:00 | Demo na żywo: te same kroki co w filmie + drugi przykład „ławka przed blokiem” (pomysł, nie skarga) |
| 2:00–2:45 | Jak to działa: AI + dokumenty z BIP na mapie + weryfikacja mObywatel |
| 2:45–3:30 | Co nowego i jak wdrożyć: pilotaż na jednym osiedlu, płaci miasto (budżet na partycypację), nie mieszkaniec |
| 3:30–4:00 | Prośba do jury i miasta |

**Sonda uliczna:** 3–4 pytania („Gdzie zgłosiłbyś dziurę w chodniku?”, „Słyszałeś o Dbam o Miasto?”, „Jak się nazywa Twój radny?”); na planszy „sonda BKIhack, n=…, niereprezentatywna”; pisemna zgoda na wizerunek.

## 11. Odrzucone (nie wracamy bez nowego argumentu)
Punkty i renoma, swobodne komentarze, głosy na nie, płatna wersja dla mieszkańców, nagrody i rabaty, logowanie wymagane do zgłoszenia, blockchain, AR, ogólny czatbot.

## 12. Otwarte pytania
1. Nazwa produktu.
2. Które osiedle na demo i które 2–3 przeterminowane zobowiązania pokazujemy?
3. Czy znajdziemy plan remontów w formie, którą da się przetworzyć?
4. Jakie modele AI?
5. Kto robi film, a kto prowadzi demo na żywo?

## 13. Pierwsze kroki w nowym czacie
Szczegółowa instrukcja jest w `PROMPT.md`. W skrócie:
1. Szkielet aplikacji w TypeScript i dane startowe dla osiedla demo.
2. Widok mieszkańca: zgłoszenie, „AI analizuje”, natychmiastowa odpowiedź, moje sprawy z osią zdarzeń, „Czy problem rozwiązany?”, mObywatel.
3. Widok radnego: mapa, lista według pilności, historia miejsca, szkic interpelacji.
4. Panel demo i trzy scenariusze z sekcji 10.
5. Dopracowanie wyglądu, nagranie zapasowe.

Po hackathonie, w prawdziwej wersji: potok BIP → JSON, PRG + OSM, baza i API, prawdziwe modele AI, `VerificationProvider` z integratorem mObywatela.
