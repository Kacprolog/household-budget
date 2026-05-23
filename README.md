# Budżet domowy

Pełna aplikacja Next.js do wspólnego zarządzania budżetem dla dwóch osób. UI jest po polsku, działa responsywnie, ma dark mode, Auth.js Credentials, Prisma/PostgreSQL, dashboard, analitykę, budżety, cele, import CSV oraz eksport CSV/PDF.

Projekt jest obecnie domykany jako prywatna wersja v1 dla jednego wspólnego household. Funkcje SaaS, takie jak subskrypcje, billing, onboarding wielu par i publiczny landing page, są poza zakresem tej wersji.

## Konta seed

| Login | Hasło tymczasowe | Rola |
| --- | --- | --- |
| `kacper` | `KacperBudzet2026!` | owner |
| `narzeczona` | `PartnerkaBudzet2026!` | partner |

Po pierwszym logowaniu aplikacja pokaże ostrzeżenie o haśle tymczasowym. Wejdź w **Ustawienia → Konto** i zmień hasło; po poprawnej zmianie ostrzeżenie zniknie.

## Lokalny start

1. Skopiuj `.env.example` do `.env` i ustaw `DATABASE_URL`.
2. Wygeneruj sekret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
   ```
3. Wklej wynik jako `AUTH_SECRET` i `NEXTAUTH_SECRET`.
4. Uruchom:
   ```bash
   npm install
   npm run db:generate
   npm run db:deploy
   npm run db:seed
   npm run dev
   ```
5. Otwórz `http://localhost:3000`.

## Smoke test produkcji

Najważniejszy przepływ prywatnej v1 można sprawdzić Playwrightem bez dopisywania testowych transakcji do budżetu:

```bash
$env:E2E_LOGIN="kacper"
$env:E2E_PASSWORD="twoje_aktualne_haslo"
npm run e2e:prod
```

Test loguje się, sprawdza Dashboard, Transakcje, modal szybkiego dodawania oraz eksport CSV/PDF. W GitHub Actions jest ręczny workflow **Production Smoke**; używa sekretów `E2E_LOGIN` i `E2E_PASSWORD`.

## Deployment: Supabase + Vercel

1. Supabase: utwórz projekt na [supabase.com](https://supabase.com), wejdź w **Project Settings → Database → Connection string** i skopiuj connection string PostgreSQL. Do Vercela najlepiej wklej pooler/transaction URL, jeśli Supabase go pokazuje.
2. Vercel: zaimportuj repo GitHub, ustaw zmienne:
   - `DATABASE_URL`
   - `AUTH_SECRET`
   - `NEXTAUTH_SECRET`
   - `AUTH_URL=https://twoj-projekt.vercel.app`
   - `NEXTAUTH_URL=https://twoj-projekt.vercel.app`
   - `CRON_SECRET`
   - `BANK_TOKEN_ENCRYPTION_KEY` opcjonalnie, zalecane jako oddzielny klucz dla tokenów PSD2
3. Build command: `npm run build`. Install command: `npm ci`.
4. Po pierwszym deployu uruchom lokalnie lub w Vercel CLI:
   ```bash
   npx vercel env pull .env.production.local
   $env:DATABASE_URL="wklej_produkcyjny_url"
   npm run db:deploy
   npm run db:seed
   ```

## GitHub i Vercel CLI

Repo można utworzyć poleceniami:

```bash
git add .
git commit -m "Initial household budget app"
gh repo create household-budget --private --source . --remote origin --push
npx vercel login
npx vercel --prod
```

Jeśli chcesz repo publiczne, zamień `--private` na `--public`.

## Zmiana haseł

Najprościej w aplikacji: **Ustawienia → Konto → Zmiana hasła**. Konta seed są oznaczone jako wymagające zmiany hasła, a po zapisaniu nowego hasła status zmienia się na „Zmienione”. Hasła są hashowane przez bcrypt z cost 12.

Awaryjnie przez Prisma Studio:

```bash
npm run db:generate
npx prisma studio
```

Nie wpisuj hasła ręcznie w bazie jako tekst jawny. Wygeneruj hash bcrypt i podmień `passwordHash`.

## Kategorie i metody płatności

Kategorie: **Ustawienia → Kategorie**. Usunięcie jest blokowane, jeśli do kategorii są przypisane transakcje. Najpierw przenieś transakcje do innej kategorii.

Metody płatności: **Ustawienia → Metody płatności**. Domyślnie seed zawiera Gotówka, Karta, Przelew i BLIK.

## Backup bazy

Automatyczny backup jest w GitHub Actions: workflow **Database Backup** odpala sie w niedziele o 03:15 UTC i mozna go uruchomic recznie przez **Actions -> Database Backup -> Run workflow**. Backup jest wrzucany jako artifact na 30 dni.
Status ostatniego backupu jest widoczny w aplikacji: **Ustawienia -> Utrzymanie**.

Reczny backup przez `pg_dump`:

```bash
pg_dump "$DATABASE_URL" > backup.sql
```

Przywrócenie:

```bash
psql "$DATABASE_URL" < backup.sql
```

## Limity darmowych tierów

Stan na 22.05.2026, sprawdź aktualne tabele przed produkcyjnym użyciem:

- Supabase Free: 2 darmowe projekty, 500 MB database size per project, 5 GB egress, 1 GB storage, 50 000 MAU. Źródło: [Supabase billing docs](https://supabase.com/docs/guides/platform/billing-on-supabase).
- Vercel Hobby: personal/non-commercial use, 1 000 000 function invocations, 100 GB-hours function duration, 4 CPU-hours, 200 projektów, 100 deployów dziennie, domyślnie 10 s dla Vercel Functions. Źródło: [Vercel Hobby Plan](https://vercel.com/docs/plans/hobby) i [Vercel limits](https://vercel.com/docs/limits).
- Neon Free jako alternatywa: 100 CU-hours miesięcznie per projekt i scale-to-zero przy bezczynności. Źródło: [Neon pricing](https://neon.com/pricing).

Dla budżetu dwóch osób największe ryzyko limitów to zwykle baza 500 MB przy dużej liczbie załączników/importów, limity funkcji PDF przy bardzo długich raportach oraz bezczynność/free-tier policies dostawcy.

## Funkcje

- Dashboard: przychody, wydatki, saldo, wykorzystanie budżetu, top kategorie, wykres salda, donut kategorii, porównanie miesięcy, ostatnie transakcje, status celów i alerty 80/100%.
- Transakcje: dodawanie przez FAB, filtry, sortowanie, paginacja, soft delete, cykliczność.
- Budżety: limity miesięczne per kategoria i progress bars.
- Cele: tworzenie celów, ręczne wpłaty, transakcja oszczędnościowa i prognoza.
- Analityka: zakresy, przychody vs wydatki, oszczędności, heatmap, statystyki, autorzy, top transakcje, trendy, forecast, burn rate.
- Eksport/import: CSV server-side, PDF server-side, import CSV z profilami bankow, ręczne mapowanie kolumn, deduplikacja, podglad przed zatwierdzeniem i raport gotowe/duplikaty/bledne.
- Bank sync: fundament danych i ekran **Ustawienia -> Banki** pod PSD2/Open Banking.
- Tokeny bankowe: opcjonalny token dostawcy PSD2 jest szyfrowany AES-256-GCM przed zapisem; aplikacja nigdy nie prosi o login ani hasło do banku.
- Reguly kategoryzacji: **Ustawienia -> Reguly** pozwala mapowac frazy z opisow transakcji na kategorie i metody platnosci, a import CSV korzysta z tych regul.
- Cykliczne: **Ustawienia -> Cykliczne** pokazuje stale transakcje, kolejne terminy i pozwala je wstrzymac albo wznowic.
- Edycja transakcji: lista transakcji ma akcje edycji kwoty, daty, opisu, kategorii i metody.
- Kosz transakcji: filtr **Widok -> Usunięte** pozwala przywrócić transakcje po soft-delete.
- Masowe operacje: w tabeli transakcji można zaznaczyć wiele wierszy i zbiorczo usunąć albo przywrócić.
- Utrzymanie: **Ustawienia -> Utrzymanie** pokazuje oficjalny URL, status backupu/deployu i pozwala ukryc dane demo.
- Aktywność: **Ustawienia -> Aktywność** pokazuje ostatnie zmiany w budżecie i ustawieniach, z autorem i czasem.
- PWA: aplikację można dodać do ekranu głównego telefonu; service worker nie cache'uje danych finansowych offline.
- Potwierdzenia usuwania: krytyczne akcje kasowania wymagają potwierdzenia w przeglądarce.
- Smoke test: Playwright sprawdza logowanie, core views, quick-add i eksporty CSV/PDF bez modyfikowania danych.

## Roadmapa

Pelna lista rzeczy do poprawy i zrobienia jest w [ROADMAP.md](./ROADMAP.md). Najwazniejszy kolejny kierunek to integracja z realnymi transakcjami z konta przez PSD2/Open Banking albo dopracowany import CSV z banku.
