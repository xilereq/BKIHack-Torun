# Prompt startowy: budowa wersji demonstracyjnej „Głos Osiedla”

> Wklej poniższy tekst jako pierwszą wiadomość w nowej rozmowie i dołącz pliki `PROJEKT.md` oraz `mapa-pomyslu.html`.

---

Budujemy na 24-godzinny hackathon BKIhack 2026 w Toruniu aplikację **„Głos Osiedla”** (nazwa robocza). Pełny opis pomysłu jest w załączonym `PROJEKT.md`, a wizualna mapa pomysłu w `mapa-pomyslu.html`. Przeczytaj oba pliki, zanim zaczniesz.

## Twoje zadanie

Zbuduj **kompletną wersję demonstracyjną (mock)** aplikacji. Na hackathonie wygrywa 2-minutowy film i 4-minutowy pitch z demo na żywo, więc liczy się to, jak aplikacja **wygląda i zachowuje się**, a nie to, co jest pod spodem.

- Widz ma mieć wrażenie, że wszystko działa: AI analizuje, mapa pokazuje dokumenty miasta, przychodzą powiadomienia.
- Dane i odpowiedzi AI mogą być przygotowane wcześniej lub symulowane. Nie ma przeglądu kodu, a pytania techniczne jury obsługujemy sami.
- **Najważniejsze, żeby demo nigdy się nie zepsuło na scenie:** żadnych pustych ekranów, błędów w konsoli widocznych dla użytkownika ani zależności od internetu poza podkładem mapy.

## Technologia

- **TypeScript.** Proponuję Vite + React + Tailwind CSS, mapa Leaflet albo MapLibre z podkładem OpenStreetMap. Możesz wybrać inaczej, jeśli będzie prościej, ale trzymaj się prostych rozwiązań.
- **Bez własnego serwera i bazy danych.** Dane startowe w plikach JSON w repozytorium, stan w pamięci i w `localStorage`.
- Uruchomienie jednym poleceniem: `npm install && npm run dev`.
- Interfejs w całości **po polsku**.

## Co ma się znaleźć w aplikacji

### Widok mieszkańca (mobilny; na komputerze wyświetlany w ramce telefonu)
1. **Start:** duży przycisk „Zgłoś”, mapa okolicy z kilkoma zgłoszeniami, przycisk „Moje sprawy”.
2. **Zgłoszenie:** zdjęcie (wybór pliku albo jedno z przygotowanych zdjęć demo), opis tekstem albo przycisk mikrofonu z symulowaną transkrypcją (tekst „pisze się” na ekranie), lokalizacja ustawiona automatycznie z pinezką do przesunięcia. Bez logowania.
3. **„AI analizuje…”:** animacja 2–3 sekund z kolejno odhaczanymi krokami, np. „Rozpoznaję zdjęcie”, „Szukam podobnych zgłoszeń”, „Sprawdzam dokumenty miasta”.
4. **Wynik:** rodzaj (problem albo pomysł), kategoria, kto odpowiada i dlaczego („To droga miejska, odpowiada Miejski Zarząd Dróg”), „Połączono z 6 podobnymi zgłoszeniami”, oraz **natychmiastowa odpowiedź** z linkiem do źródła, np. „Remont tego odcinka zapowiedziano na VI 2026. Termin minął, sprawa trafia do radnych okręgu.”
5. **Moje sprawy:** lista spraw i **oś zdarzeń** każdej z nich (zgłoszone → połączone z innymi → interpelacja → odpowiedź urzędu → remont zaplanowany → remont wykonany). Nowe zdarzenia pojawiają się jako powiadomienia.
6. **„Czy problem rozwiązany?”** po zdarzeniu „remont wykonany”: „Tak” zamyka sprawę z podziękowaniem, „Nie” tworzy nowe zgłoszenie powiązane z poprzednim i pokazuje komunikat, że po świeżym remoncie urząd dostaje sygnał o możliwej gwarancji wykonawcy.
7. **„Zweryfikuj przez mObywatel” (opcjonalnie):** okno z symulowanym kodem QR, po chwili „Zweryfikowano” i znaczek „zweryfikowany mieszkaniec”. Nie blokuje zgłaszania.

### Widok radnego i urzędu (komputer)
1. **Mapa okręgu** z warstwami: zgłoszenia (problemy), pomysły, dokumenty miasta, zobowiązania (przeterminowane wyraźnie wyróżnione). Filtr „tylko zweryfikowani mieszkańcy”.
2. **Lista spraw według pilności** z krótkim uzasadnieniem w formie etykiet, np. „6 zgłoszeń”, „214 kursów autobusów dziennie”, „obietnica przeterminowana o 4 miesiące”, „w pobliżu szkoła”.
3. **Historia miejsca** po kliknięciu sprawy: zdjęcia, liczba zgłoszeń, dokumenty (interpelacje, odpowiedzi, plany remontów) z linkami, zobowiązania z terminami.
4. **„Przygotuj interpelację”:** tekst generuje się na oczach widza (efekt pisania), z przypisami [1], [2] do dokumentów i zgłoszeń, w edytowalnym polu. Przyciski „Kopiuj” i „Wyślij” (wysyłka symulowana).
5. Pomysły pogrupowane, np. „12 osób prosi o ławkę przy bloku”.

### Panel demo (ukryty, dla zespołu)
- Otwierany skrótem klawiszowym (np. `Ctrl+Shift+D`), niewidoczny dla widza.
- Przełączanie widoku mieszkaniec / radny.
- Przyciski dopisujące zdarzenia do sprawy demo: „Radny złożył interpelację”, „Odpowiedź urzędu”, „Remont zaplanowany”, „Remont wykonany”.
- „Reset demo” przywracający stan początkowy.

## Scenariusze demo (muszą działać bezbłędnie)

1. **Dziura na drodze (główny, do filmu):** mieszkaniec zgłasza dziurę przy przystanku → AI łączy z 6 zgłoszeniami i pokazuje przeterminowane zobowiązanie remontowe → radny otwiera sprawę i generuje interpelację → panel demo dopisuje „Odpowiedź urzędu” i „Remont zaplanowany na 2027 r.” → mieszkaniec dostaje powiadomienia → „Remont wykonany” → „Czy problem rozwiązany?”.
2. **Ławka przed blokiem (pomysł):** mieszkanka zgłasza „Przydałaby się tu ławka dla seniorów” → AI rozpoznaje pomysł, a nie usterkę → „12 osób prosi o to samo” → wskazuje jednostkę. Przy większym pomyśle (np. plac zabaw) wspomina też budżet obywatelski.
3. **Weryfikacja mObywatel:** kod QR → „Zweryfikowano” → znaczek przy zgłoszeniu w panelu radnego.

Dla zgłoszeń spoza scenariuszy użyj prostych reguł (słowa kluczowe → kategoria i adresat), żeby aplikacja zawsze odpowiedziała sensownie.

## Dane startowe

- **Obszar demo:** jedno osiedle w Toruniu (proponuję okolice Szosy Chełmińskiej; prawdziwe ulice i współrzędne z OpenStreetMap).
- Około 25–40 zgłoszeń (problemy i pomysły), 8–12 dokumentów miasta (interpelacje, odpowiedzi, plany remontów) z miejscami i terminami, w tym 2–3 przeterminowane zobowiązania.
- **Dane są przykładowe:** oznacz je w kodzie jako demonstracyjne, trzymaj w osobnych plikach JSON, żeby zespół mógł podmienić je na prawdziwe przypadki z BIP. Nie używaj nazwisk prawdziwych radnych ani urzędników, tylko wyraźnie fikcyjnych. Linki do źródeł mogą prowadzić do ogólnej strony interpelacji: https://bip.torun.pl/interpelacje/29500
- Zdjęcia: kilka lokalnych obrazów demo albo neutralne grafiki zastępcze (bez zależności od zewnętrznych serwisów ze zdjęciami).

## Wygląd

- Ma wyglądać jak dopracowany produkt, a nie prototyp: spójna kolorystyka, czytelna typografia, płynne przejścia, sensowne stany ładowania.
- Dostępność na poziomie zbliżonym do WCAG 2.1 AA: duży tekst i przyciski, dobry kontrast, opisy dla czytników ekranu. Widz ma uwierzyć, że z aplikacji skorzysta senior.
- Hasło produktu: „Zgłoszenia, które nie giną.”

## Czego nie robić

- Nie buduj prawdziwego pobierania z BIP, bazy danych, logowania ani integracji z mObywatelem. Wszystko to jest symulowane.
- Nie dodawaj funkcji spoza listy (komentarzy, punktów, głosów na nie, czatu, generatora wniosków dla mieszkańców). Lista odrzuconych jest w `PROJEKT.md`, sekcja 11.

## Jak pracować

1. Na start pokaż krótki plan: strukturę projektu, listę ekranów i format danych startowych. Potem buduj bez czekania na akceptację, chyba że coś jest niejasne.
2. Buduj w kolejności: dane startowe → widok mieszkańca → widok radnego → panel demo → dopracowanie wyglądu.
3. Po każdym większym etapie uruchom aplikację i sprawdź, że scenariusze działają.
4. Na koniec dopisz:
   - `README.md`: jak uruchomić, skrót panelu demo, gdzie są dane do podmiany,
   - `DEMO.md`: scenariusz kliknięć krok po kroku dla trzech scenariuszy, do nagrania filmu i demo na żywo.

## Kryteria „gotowe”

- [ ] `npm install && npm run dev` uruchamia aplikację bez błędów.
- [ ] Trzy scenariusze przechodzą od początku do końca, także po „Reset demo”.
- [ ] Widok mieszkańca dobrze wygląda w ramce telefonu, widok radnego na ekranie laptopa i projektora.
- [ ] Żaden ekran nie jest pusty ani nie pokazuje błędu.
- [ ] Interfejs w całości po polsku.
