import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, BarChart3, Gauge, ListChecks, PiggyBank, Settings, Target } from "lucide-react";
import { auth } from "@/auth";
import { QuickAddModal } from "@/components/app/quick-add-modal";
import { SignOutButton } from "@/components/app/sign-out-button";
import { ThemeToggle } from "@/components/app/theme-toggle";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/transactions", label: "Transakcje", icon: ListChecks },
  { href: "/budgets", label: "Budżety", icon: PiggyBank },
  { href: "/goals", label: "Cele", icon: Target },
  { href: "/analytics", label: "Analityka", icon: BarChart3 },
  { href: "/settings", label: "Ustawienia", icon: Settings },
];

export async function AppFrame({ children, title }: { children: React.ReactNode; title: string }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [user, categories, paymentMethods, descriptions] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.category.findMany({ where: { householdId: session.user.householdId }, orderBy: [{ type: "asc" }, { name: "asc" }] }),
    prisma.paymentMethod.findMany({ where: { householdId: session.user.householdId }, orderBy: { name: "asc" } }),
    prisma.transaction.findMany({
      where: { householdId: session.user.householdId, deletedAt: null, description: { not: null } },
      distinct: ["description"],
      take: 30,
      orderBy: { createdAt: "desc" },
      select: { description: true },
    }),
  ]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-slate-200 bg-white px-3 py-4 dark:border-slate-800 dark:bg-slate-950 md:block">
        <Link href="/" className="mb-6 flex items-center gap-3 px-3">
          <div className="grid h-10 w-10 place-items-center rounded-md bg-slate-950 text-white dark:bg-white dark:text-slate-950">
            <PiggyBank className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Budżet domowy</div>
            <div className="text-xs text-slate-500">Wspólne finanse</div>
          </div>
        </Link>
        <nav className="space-y-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-900")}>
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            <p className="text-xs text-slate-500">Zalogowano jako {user.displayName}</p>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <SignOutButton />
          </div>
        </header>
        <main className="px-4 py-5 pb-28 md:px-6 md:pb-8">{children}</main>
        {user.mustChangePassword ? (
          <div className="fixed inset-x-4 bottom-20 z-40 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 shadow-lg dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100 md:left-auto md:right-6 md:bottom-6 md:max-w-md">
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
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:hidden">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="flex h-16 flex-col items-center justify-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
            <item.icon className="h-5 w-5" />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        ))}
      </nav>
      <QuickAddModal
        categories={categories
          .filter((category) => category.type === "income" || category.type === "expense")
          .map((category) => ({ id: category.id, name: category.name, type: category.type as "income" | "expense", color: category.color }))}
        paymentMethods={paymentMethods.map((method) => ({ id: method.id, name: method.name }))}
        descriptions={descriptions.map((item) => item.description).filter(Boolean) as string[]}
      />
    </div>
  );
}
