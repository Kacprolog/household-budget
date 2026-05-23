import Link from "next/link";
import { AlertTriangle, BarChart3, Gauge, ListChecks, PiggyBank, Settings, Sparkles, Target } from "lucide-react";
import { DesktopNavLinks, MobileNavLinks } from "@/components/app/nav-links";
import { QuickAddModal } from "@/components/app/quick-add-modal";
import { SignOutButton } from "@/components/app/sign-out-button";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { requireUser } from "@/lib/session";

const nav = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/transactions", label: "Transakcje", icon: ListChecks },
  { href: "/budgets", label: "Budżety", icon: PiggyBank },
  { href: "/goals", label: "Cele", icon: Target },
  { href: "/analytics", label: "Analityka", icon: BarChart3 },
  { href: "/settings", label: "Ustawienia", icon: Settings },
];

export async function AppFrame({ children, title }: { children: React.ReactNode; title: string }) {
  const user = await requireUser();

  return (
    <div className="min-h-screen bg-transparent text-slate-950 dark:text-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/60 bg-white/70 px-3 py-4 shadow-[16px_0_48px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/70 md:block">
        <Link href="/" className="mb-7 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/50 dark:hover:bg-slate-900/70">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white shadow-[0_14px_34px_rgba(15,23,42,0.25)] dark:bg-white dark:text-slate-950">
            <PiggyBank className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="font-semibold">Budżet domowy</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Wspólne finanse</div>
          </div>
        </Link>
        <DesktopNavLinks items={nav} />
        <div className="absolute inset-x-3 bottom-4 rounded-lg border border-teal-200/70 bg-teal-50/80 p-3 text-xs text-teal-950 shadow-sm dark:border-teal-900/70 dark:bg-teal-950/30 dark:text-teal-100">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles className="h-4 w-4" aria-hidden />
            Tryb prywatny v1
          </div>
          <p className="mt-1 leading-5 text-teal-800 dark:text-teal-200/80">Dane domowe, szybkie decyzje, bez SaaS-owego hałasu.</p>
        </div>
      </aside>
      <div className="md:pl-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-white/60 bg-white/70 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/70 md:px-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-lg font-semibold tracking-normal">{title}</h1>
              <span className="hidden rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 sm:inline-flex">
                online
              </span>
            </div>
            <p className="truncate text-xs text-slate-500 dark:text-slate-400">Zalogowano jako {user.displayName}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="animate-soft-in px-4 py-5 pb-28 md:px-6 md:pb-8">{children}</main>
        {user.mustChangePassword ? (
          <div className="fixed inset-x-4 bottom-24 z-40 rounded-lg border border-amber-200 bg-amber-50/95 p-3 text-sm text-amber-900 shadow-lg backdrop-blur-xl dark:border-amber-900 dark:bg-amber-950/95 dark:text-amber-100 md:left-auto md:right-6 md:bottom-6 md:max-w-md">
            <div className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <div className="font-medium">Zmień hasło tymczasowe</div>
                <div className="mt-1">To konto nadal wymaga rotacji hasła. Przejdź do <Link href="/settings/account" className="underline">Ustawienia → Konto</Link>.</div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <MobileNavLinks items={nav} />
      <QuickAddModal />
    </div>
  );
}
