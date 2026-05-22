# Roadmapa i lista zadan

Ta lista zbiera rzeczy do poprawy, rozbudowy i utwardzenia po pierwszym dzialajacym deployu aplikacji budzetowej.

## Priorytet 0: rzeczy obowiazkowe przed regularnym uzywaniem

- [ ] Zmienic hasla tymczasowe obu kont w aplikacji: **Ustawienia -> Konto**.
- [ ] Dodac wlasna domene albo zostawic obecny adres Vercel jako oficjalny adres aplikacji.
- [ ] Upewnic sie, ze Vercel GitHub App jest zainstalowany dla repo, jesli ma byc natywne polaczenie GitHub -> Vercel w panelu Vercela.
- [x] Dodac obejscie auto-deploy przez GitHub Actions.
- [ ] Dodac cron/scheduler dla `/api/recurring/run`, zeby transakcje cykliczne wykonywaly sie automatycznie.
- [ ] Dodac automatyczny backup bazy, np. tygodniowy `pg_dump`.
- [ ] Dodac prosty ekran/status ostatniego backupu.
- [ ] Przejrzec dane seed i usunac/przerobic przykladowe transakcje, gdy zaczniecie uzywac aplikacji realnie.

## Priorytet 1: integracja z realnymi wydatkami z konta

- [ ] Dodac integracje z realnymi transakcjami bankowymi.
- [ ] Wybrac dostawce Open Banking / PSD2 dla Polski:
  - Kontomatik jako preferowany wariant polski,
  - Fizen jako wariant lokalny/CEE,
  - Enable Banking, Neonomics albo Salt Edge jako alternatywy,
  - GoCardless Bank Account Data tylko po potwierdzeniu aktualnej dostepnosci kont/API.
- [ ] Dodac model Prisma `BankConnection`.
- [ ] Dodac model Prisma `BankAccount`.
- [ ] Dodac model Prisma `BankTransaction`.
- [ ] Dodac szyfrowanie tokenow dostepu dostawcy PSD2 w bazie.
- [ ] Dodac ekran **Ustawienia -> Banki**.
- [ ] Dodac flow: `Polacz bank` -> redirect do dostawcy -> powrot do aplikacji -> zapis zgody.
- [ ] Dodac reczne odswiezanie transakcji z banku.
- [ ] Dodac automatyczne odswiezanie transakcji przez cron, np. raz dziennie.
- [ ] Dodac deduplikacje po `externalTransactionId`, kwocie, dacie i opisie.
- [ ] Dodac mapowanie transakcji bankowych na kategorie.
- [ ] Dodac reguly automatycznej kategoryzacji, np. `Biedronka -> Jedzenie`.
- [ ] Dodac tryb przegladu importu: nowe transakcje trafiaja najpierw do zatwierdzenia.
- [ ] Dodac oznaczenie zrodla transakcji: reczna / CSV / bank.
- [ ] Dodac mozliwosc ukrycia albo polaczenia duplikatow miedzy CSV a bank sync.
- [ ] Nigdy nie przechowywac loginu ani hasla do banku.

## Priorytet 2: import CSV pod konkretne banki

- [ ] Dodac profile importu CSV dla najpopularniejszych bankow:
  - mBank,
  - PKO BP / Inteligo,
  - ING,
  - Santander,
  - Millennium,
  - Alior,
  - Pekao,
  - Revolut.
- [ ] Dodac ekran mapowania kolumn CSV przed importem.
- [ ] Dodac podglad 10 pierwszych wierszy przed zatwierdzeniem importu.
- [ ] Dodac wykrywanie separatora, kodowania i formatu kwoty.
- [ ] Dodac raport po imporcie: dodane, pominiete, zdublowane, wymagajace uwagi.
- [ ] Dodac reguly kategoryzacji na podstawie odbiorcy/nadawcy/opisu.

## Priorytet 3: poprawki funkcjonalne w aplikacji

- [ ] Dodac pelna edycje transakcji w UI, nie tylko dodawanie i usuwanie.
- [ ] Dodac przywracanie soft-delete transakcji.
- [ ] Dodac przenoszenie transakcji miedzy kategoriami.
- [ ] Dodac masowe operacje na transakcjach.
- [ ] Dodac tagi transakcji.
- [ ] Dodac notatki do kategorii i celow.
- [ ] Dodac powtarzalne transakcje z ekranem zarzadzania cyklicznoscia.
- [ ] Dodac widok przyszlych transakcji cyklicznych.
- [ ] Dodac obsluge nieregularnych cykli, np. co 2 tygodnie albo ostatni dzien miesiaca.
- [ ] Dodac miesieczne zamkniecie budzetu.
- [ ] Dodac porownanie plan vs wykonanie.
- [ ] Dodac budzety rolowane, gdzie niewykorzystana kwota przechodzi na kolejny miesiac.
- [ ] Dodac osobne limity per autor, opcjonalnie.
- [ ] Dodac eksport calego household do jednego archiwum.

## Priorytet 4: analityka i raporty

- [ ] Ulepszyc heatmap wydatkow.
- [ ] Dodac analize merchantow/odbiorcow po opisie transakcji.
- [ ] Dodac wykrywanie subskrypcji.
- [ ] Dodac alerty o nietypowo wysokich wydatkach.
- [ ] Dodac prognoze salda na koniec miesiaca.
- [ ] Dodac cashflow forecast na 3 miesiace.
- [ ] Dodac porownanie miesiac do miesiaca dla wszystkich kategorii.
- [ ] Dodac raport miesieczny PDF z pelniejszym layoutem i tabelami.
- [ ] Dodac eksport wykresow do PDF jako obrazy.
- [ ] Dodac wysylke raportu email w niedziele wieczorem.

## Priorytet 5: UX i mobile

- [ ] Dodac PWA, zeby aplikacje mozna bylo zainstalowac na telefonie.
- [ ] Dodac manifest, ikony i service worker.
- [ ] Dodac lepszy pusty stan dla nowych kont bez danych.
- [ ] Dodac skeleton loading dla wykresow.
- [ ] Dodac toast po dodaniu/edycji/usunieciu danych.
- [ ] Dodac potwierdzenia dla usuwania transakcji/kategorii/celow.
- [ ] Dodac wyszukiwarke globalna.
- [ ] Dodac szybkie akcje na mobile.
- [ ] Dodac widget "dodaj wydatek" z minimalnym formularzem.
- [ ] Dopiescic accessibility: focus states, opisy ikon, kontrast, obsluga klawiatury.

## Priorytet 6: bezpieczenstwo i stabilnosc

- [ ] Dodac testy jednostkowe dla funkcji finansowych.
- [ ] Dodac testy integracyjne dla server actions.
- [ ] Dodac testy e2e Playwright: login, dodanie transakcji, eksport CSV/PDF.
- [ ] Dodac walidacje uprawnien we wszystkich akcjach modyfikujacych dane.
- [ ] Dodac audyt zdarzen: kto co dodal/zmienil/usunal.
- [ ] Dodac rate limiting dla innych wrazliwych endpointow, nie tylko loginu.
- [ ] Dodac szyfrowanie wrazliwych danych integracji bankowej.
- [ ] Dodac rotacje sekretow.
- [ ] Dodac monitoring bledow, np. Sentry.
- [ ] Dodac logi audytowe bez danych wrazliwych.
- [ ] Dodac polityke retencji danych.

## Priorytet 7: infrastruktura i utrzymanie

- [ ] Przeniesc deployment na natywne GitHub -> Vercel po instalacji GitHub App.
- [x] Ustawic GitHub Actions deployujacy na Vercel jako alternatywe.
- [ ] Dodac Vercel cron dla transakcji cyklicznych.
- [ ] Dodac Vercel cron dla synchronizacji bankowej.
- [ ] Dodac Vercel cron dla backupow.
- [ ] Dodac osobne srodowisko preview/staging.
- [ ] Dodac baze staging.
- [ ] Dodac instrukcje odtwarzania backupu krok po kroku.
- [ ] Dodac check migracji Prisma w CI.
- [ ] Dodac automatyczne dependency updates.

## Priorytet 8: nice to have

- [ ] Zalaczniki do transakcji, np. zdjecia paragonow.
- [ ] Upload paragonow do Supabase Storage albo Vercel Blob.
- [ ] OCR paragonow i automatyczne tworzenie transakcji.
- [ ] Tryb podzialu rachunkow: kto komu ile jest winien.
- [ ] Import z maili/faktur.
- [ ] Integracja z Revolut CSV/API, jesli bedzie praktyczna.
- [ ] Cele oszczednosciowe z automatycznymi wplatami.
- [ ] Powiadomienia push po przekroczeniu limitow.
- [ ] Tryb wakacyjny/weselny jako osobne widoki budzetu.
- [ ] AI podpowiedzi kategorii i oszczednosci, ale dopiero po uporzadkowaniu danych.
