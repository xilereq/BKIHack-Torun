# Scenariusz demo: krok po kroku

Do nagrania filmu (2 min) i demo na żywo (4 min). Panel demo otwiera **Ctrl+Shift+D** (zapasowo Alt+Shift+D albo trzy kliknięcia w lewy dolny róg ekranu).

## Przygotowanie (przed każdym przebiegiem)

1. `npm run dev`, otwórz http://localhost:5173/#/mieszkaniec. Podkład mapy potrzebuje internetu.
2. Otwórz panel demo, kliknij **Reset demo** dwa razy i zamknij panel (Esc).
3. Na projektor: przeglądarka na pełnym ekranie (F11), zoom 100%.
4. Opcjonalnie: druga karta z `#/radny`. Obie karty widzą zmiany na bieżąco.

> Wskazówka: panel demo przykrywa lewy dolny róg. Ramka telefonu jest na środku, więc widz go nie widzi, o ile zamkniesz panel przed przełączeniem widoku.

---

## Scenariusz 1: dziura na drodze (główny, do filmu)

| # | Kliknięcie | Co widzi widz | Co mówimy |
|---|---|---|---|
| 1 | Start mieszkańca | Mapa Rubinkowa ze zgłoszeniami, duży przycisk „Zgłoś” | „Mieszkanka widzi dziurę przy przystanku.” |
| 2 | **Zgłoś** | Ekran zgłoszenia | |
| 3 | Zdjęcie **„Dziura przy przystanku”** | Zdjęcie dodane, pinezka przeskakuje na przystanek Rubinkowo Centrum („Lokalizacja odczytana ze zdjęcia”) | „Zdjęcie i lokalizacja, bez logowania.” |
| 4 | Przycisk **Powiedz** (mikrofon) | „Słucham…”, potem tekst pisze się sam | „Jedno zdanie, mówione.” |
| 5 | **Wyślij zgłoszenie** | „AI analizuje…”, 5 kroków odhaczanych po kolei (~3 s) | |
| 6 | (automatycznie) | Wynik: **Termin minął**, „Miasto zapowiedziało tu remont… do VI 2026”, link do BIP, MZD, „Połączono z 6 podobnymi zgłoszeniami” | „Od razu wie, że miasto to obiecało i termin minął.” |
| 7 | Panel demo → **Radny** | Panel radnego: sprawa na górze listy z pilnością 99 i etykietami „obietnica przeterminowana o 4 mies.”, „214 kursów autobusów dziennie”, „w pobliżu: Zespół Szkół nr 8” | „Radna widzi sprawy według pilności, z uzasadnieniem.” |
| 8 | Klik w sprawę „Dziura w jezdni przy przystanku” | Historia miejsca: zdjęcia, zgłoszenia, dokumenty, przeterminowane zobowiązanie | |
| 9 | **Przygotuj interpelację** | Tekst pisze się na oczach widza, z przypisami [1]–[4] i listą źródeł | „Jedno kliknięcie, szkic ze źródłami. Radna poprawia i wysyła sama.” |
| 10 | **Wyślij** | „Wysłano do Biura Rady Miasta (symulacja)” | |
| 11 | **Zamknij**, panel demo → **Mieszkaniec** | Powiadomienie u góry telefonu: „Interpelacja w Twojej sprawie” | „Mieszkanka dostaje informację.” |
| 12 | Panel demo → **2. Odpowiedź urzędu** | Powiadomienie „Urząd odpowiedział” | |
| 13 | Panel demo → **3. Remont zaplanowany** | Powiadomienie „Remont zaplanowany na 2027 r.” | |
| 14 | Klik w powiadomienie (albo panel → „Pokaż tę sprawę u mieszkańca”) | Sprawa z osią zdarzeń, nowe zdarzenia na górze | „Zgłoszenia, które nie giną.” |
| 15 | Panel demo → **4. Remont wykonany** | Na górze sprawy pytanie: „Remont wykonany. Czy Twój problem jest rozwiązany?” | |
| 16a | **Tak** | „Dziękujemy! Sprawa zamknięta. Twój głos został zauważony.” | Wersja do filmu |
| 16b | **Nie** | „Utworzyliśmy nowe zgłoszenie… sygnał o gwarancji wykonawcy” | Wersja na pytania jury |

Skrót do filmu: w kroku 11 można pominąć przełączanie widoków i dodać zdarzenia od razu z panelu demo (**1. Radny złożył interpelację**).

---

## Scenariusz 2: ławka przed blokiem (pomysł, ok. 15 s na żywo)

1. Panel demo → **Ławka** (otwiera zgłoszenie ze zdjęciem trawnika przed blokiem przy przystanku Manhattan).
2. **Powiedz** → „Przydałaby się tu ławka dla seniorów…”.
3. **Wyślij zgłoszenie**.
4. Wynik: etykieta **Pomysł** (nie usterka), „12 osób prosi o to samo”, „Radny okręgu pytał o to już w XI 2024, ale urząd nie podał terminu”, adresat: Wydział Gospodarki Komunalnej.
5. Opcjonalnie panel radnego → zakładka **Pomysły**: „12 osób prosi: ławka dla seniorów przed blokiem”.

Większy pomysł (budżet obywatelski): w zgłoszeniu wpisz np. „Przydałby się plac zabaw dla dzieci”. Odpowiedź podpowie nabór do budżetu obywatelskiego 2027.

---

## Scenariusz 3: weryfikacja mObywatel

1. Na ekranie wyniku zgłoszenia (albo w „Moje sprawy”) kliknij **Zweryfikuj przez mObywatel**.
2. **Pokaż kod QR** → symulowany kod i „Czekam na potwierdzenie…” (~3 s).
3. „Zweryfikowano” + znaczek **Zweryfikowany mieszkaniec** → **Gotowe**.
4. Panel radnego → sprawa mieszkańca: przy zgłoszeniu znaczek „Zweryfikowany mieszkaniec”. Przełącznik **Tylko zweryfikowani mieszkańcy** w nagłówku filtruje listę i mapę.

Co mówimy: „Weryfikacja przez mObywatel jest gotowa architektonicznie. Zapisujemy tylko pseudonim i flagę »mieszka w Toruniu«. Prawdziwe podłączenie to umowa z integratorem, a docelowo europejski portfel tożsamości.”

---

## Gdy coś pójdzie nie tak

- **Mapa bez podkładu (brak internetu):** znaczniki i cała reszta działają, tło jest jednolite. Mówimy dalej.
- **Coś się zacięło:** panel demo → **Reset demo** (dwa kliknięcia), potem szybki start „Dziura”.
- **Pusty ekran albo komunikat „Chwileczkę…”:** przycisk „Wróć do startu”, w razie potrzeby odśwież stronę (F5). Stan demo zostaje.
- **Panel demo nie otwiera się skrótem:** Alt+Shift+D, trzy kliknięcia w lewy dolny róg albo dopisz `?demo` w adresie.
- **Zapasowo:** nagranie ekranu z przebiegu scenariusza 1.
