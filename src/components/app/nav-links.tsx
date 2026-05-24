"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Gauge, ListChecks, PiggyBank, Settings, Target } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/transactions", label: "Transakcje", icon: ListChecks },
  { href: "/budgets", label: "Budżety", icon: PiggyBank },
  { href: "/goals", label: "Cele", icon: Target },
  { href: "/analytics", label: "Analityka", icon: BarChart3 },
  { href: "/settings", label: "Ustawienia", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function DesktopNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1.5">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-white/70 hover:text-slate-950 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-slate-300 dark:hover:bg-slate-900/80 dark:hover:text-white dark:focus-visible:ring-offset-slate-950",
              active &&
                "bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.18)] hover:bg-slate-950 hover:text-white dark:bg-white dark:text-slate-950 dark:hover:bg-white dark:hover:text-slate-950",
            )}
          >
            <span
              className={cn(
                "grid h-8 w-8 place-items-center rounded-lg bg-slate-100 text-slate-500 transition-colors dark:bg-slate-900 dark:text-slate-400",
                active && "bg-white/15 text-white dark:bg-slate-950/10 dark:text-slate-950",
              )}
            >
              <item.icon className="h-[18px] w-[18px]" />
            </span>
            <span>{item.label}</span>
            {active ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-teal-300 dark:bg-teal-500" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-30 grid grid-cols-6 rounded-lg border border-white/60 bg-white/90 p-1 shadow-[0_16px_44px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/90 md:hidden">
      {nav.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-lg text-[10px] font-medium text-slate-500 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-400/70 dark:text-slate-400",
              active && "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950",
            )}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            <span className="max-w-full truncate px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
