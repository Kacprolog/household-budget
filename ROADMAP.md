# Roadmapa i lista zadan

Ta lista zbiera rzeczy do poprawy, rozbudowy i utwardzenia po pierwszym dzialajacym deployu aplikacji budzetowej.

Aktualny zakres: prywatna wersja v1 dla dwoch uzytkownikow i jednego wspolnego household. SaaS, subskrypcje, multi-tenant, publiczny onboarding i landing page zostaja odlozone.

## Priorytet 0: rzeczy obowiazkowe przed regularnym uzywaniem

- [x] Wymusic i oznaczyc zmiane hasel tymczasowych obu kont w aplikacji: **Ustawienia -> Konto**.
- [x] Dodac wlasna domene albo zostawic obecny adres Vercel jako oficjalny adres aplikacji.
- [ ] Upewnic sie, ze Vercel GitHub App jest zainstalowany dla repo, jesli ma byc natywne polaczenie GitHub -> Vercel w panelu Vercela.
- [x] Dodac obejscie auto-deploy przez GitHub Actions.
- [x] Dodac cron/scheduler dla `/api/recurring/run`, zeby transakcje cykliczne wykonywaly sie automatycznie.
- [x] Dodac automatyczny backup bazy, np. tygodniowy `pg_dump`.
- [x] Dodac prosty ekran/status ostatniego backupu.
- [x] Przejrzec dane seed i usunac/przerobic przykladowe transakcje, gdy zaczniecie uzywac aplikacji realnie.

## Priorytet 1: integracja z realnymi wydatkami z konta

- [ ] Dodac integracje z realnymi transakcjami bankowymi.
- [ ] Wybrac dostawce Open Banking / PSD2 dla Polski:
  - Kontomatik jako preferowany wariant polski,
  - Fizen jako wariant lokalny/CEE,
  - Enable Banking, Neonomics albo Salt Edge jako alternatywy,
  - GoCardless Bank Account Data tylko po potwierdzeniu aktualnej dostepnosci kont/API.
- [x] Dodac model Prisma `BankConnection`.
- [x] Dodac model Prisma `BankAccount`.
- [x] Dodac model Prisma `BankTransaction`.
- [x] Dodac szyfrowanie tokenow dostepu dostawcy PSD2 w bazie.
- [x] Dodac ekran **Ustawienia -> Banki**.
- [ ] Dodac flow: `Polacz bank` -> redirect do dostawcy -> powrot do aplikacji -> zapis zgody.
- [x] Dodac reczne odswiezanie transakcji z banku.
- [x] Dodac automatyczne odswiezanie transakcji przez cron, np. raz dziennie.
- [x] Dodac deduplikacje po `externalTransactionId`, kwocie, dacie i opisie.
- [x] Dodac mapowanie transakcji bankowych na kategorie.
- [x] Dodac reguly automatycznej kategoryzacji, np. `Biedronka -> Jedzenie`.
- [x] Dodac tryb przegladu importu: nowe transakcje trafiaja najpierw do zatwierdzenia.
- [x] Dodac oznaczenie zrodla transakcji: reczna / CSV / bank.
- [ ] Dodac mozliwosc ukrycia albo polaczenia duplikatow miedzy CSV a bank sync.
- [x] Nigdy nie przechowywac loginu ani hasla do banku.

## Priorytet 2: import CSV pod konkretne banki

- [x] Dodac profile importu CSV dla najpopularniejszych bankow:
  - mBank,
  - PKO BP / Inteligo,
  - ING,
  - Santander,
  - Millennium,
  - Alior,
  - Pekao,
  - Revolut.
- [x] Dodac ekran mapowania kolumn CSV przed importem.
- [x] Dodac podglad 10 pierwszych wierszy przed zatwierdzeniem importu.
- [x] Dodac wykrywanie separatora i formatu kwoty.
- [x] Dodac raport po imporcie: dodane, pominiete, zdublowane, wymagajace uwagi.
- [x] Dodac reguly kategoryzacji na podstawie odbiorcy/nadawcy/opisu.

## Priorytet 3: poprawki funkcjonalne w aplikacji

- [x] Dodac pelna edycje transakcji w UI, nie tylko dodawanie i usuwanie.
- [x] Dodac przywracanie soft-delete transakcji.
- [ ] Dodac przenoszenie transakcji miedzy kategoriami.
- [x] Dodac masowe operacje na transakcjach.
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

- [x] Dodac PWA, zeby aplikacje mozna bylo zainstalowac na telefonie.
- [x] Dodac manifest, ikony i service worker.
- [ ] Dodac lepszy pusty stan dla nowych kont bez danych.
- [ ] Dodac skeleton loading dla wykresow.
- [ ] Dodac toast po dodaniu/edycji/usunieciu danych.
- [x] Dodac potwierdzenia dla usuwania transakcji/kategorii/regul/danych demo.
- [ ] Dodac wyszukiwarke globalna.
- [ ] Dodac szybkie akcje na mobile.
- [ ] Dodac widget "dodaj wydatek" z minimalnym formularzem.
- [ ] Dopiescic accessibility: focus states, opisy ikon, kontrast, obsluga klawiatury.

## Priorytet 6: bezpieczenstwo i stabilnosc

- [x] Zrobic pierwszy pass wydajnosci: cache sesji/uzytkownika, indeksy transakcji i lzejsze agregacje dashboard/analityka.
- [x] Dodac testy jednostkowe dla funkcji finansowych i normalizacji CSV.
- [ ] Dodac testy integracyjne dla server actions.
- [x] Dodac bezpieczny smoke e2e Playwright: login, core views, quick-add, eksport CSV/PDF bez modyfikowania danych.
- [ ] Dodac osobny test e2e na dodanie transakcji w bazie testowej/staging.
- [ ] Dodac walidacje uprawnien we wszystkich akcjach modyfikujacych dane.
- [ ] Dodac audyt zdarzen: kto co dodal/zmienil/usunal.
- [ ] Dodac rate limiting dla innych wrazliwych endpointow, nie tylko loginu.
- [x] Dodac szyfrowanie wrazliwych danych integracji bankowej.
- [ ] Dodac rotacje sekretow.
- [ ] Dodac monitoring bledow, np. Sentry.
- [ ] Dodac logi audytowe bez danych wrazliwych.
- [ ] Dodac polityke retencji danych.

## Priorytet 7: infrastruktura i utrzymanie

- [ ] Przeniesc deployment na natywne GitHub -> Vercel po instalacji GitHub App.
- [x] Ustawic GitHub Actions deployujacy na Vercel jako alternatywe.
- [x] Dodac Vercel cron dla transakcji cyklicznych.
- [x] Dodac Vercel cron dla synchronizacji bankowej.
- [x] Dodac GitHub Actions scheduler dla backupow.
- [ ] Dodac osobne srodowisko preview/staging.
- [ ] Dodac baze staging.
- [ ] Dodac instrukcje odtwarzania backupu krok po kroku.
- [x] Dodac check schematu Prisma w CI.
- [x] Przelaczyc runtime GitHub Actions na Node 24 przed wymuszeniem przez GitHub.
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
