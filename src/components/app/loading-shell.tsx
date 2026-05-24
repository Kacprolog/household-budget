import { BarChart3, CreditCard, LayoutDashboard, PiggyBank, Settings, Target, WalletCards } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Transakcje", icon: CreditCard },
  { label: "Budżety", icon: WalletCards },
  { label: "Cele", icon: Target },
  { label: "Analityka", icon: BarChart3 },
  { label: "Ustawienia", icon: Settings },
];

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-slate-200/80 dark:bg-slate-800/80",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.35s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/45 before:to-transparent dark:before:via-white/10",
        className,
      )}
    />
  );
}

function Panel({ className, children }: { className?: string; children?: React.ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-white/70 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/60", className)}>
      {children}
    </div>
  );
}

export function LoadingShell({ variant = "dashboard" }: { variant?: "dashboard" | "table" | "analytics" | "settings" }) {
  const tableRows = Array.from({ length: variant === "table" ? 8 : 5 });

  return (
    <div className="min-h-screen bg-transparent text-slate-950 dark:text-slate-50" aria-busy="true" aria-label="Ladowanie">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-white/60 bg-white/70 px-3 py-4 shadow-[16px_0_48px_rgba(15,23,42,0.06)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/70 md:block">
        <div className="mb-7 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-slate-950 text-white shadow-[0_14px_34px_rgba(15,23,42,0.22)] dark:bg-white dark:text-slate-950">
            <PiggyBank className="h-5 w-5" aria-hidden />
          </div>
          <div className="min-w-0 space-y-2">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-3 w-24" />
          </div>
        </div>
        <div className="space-y-1">
          {navItems.map((item, index) => (
            <div key={item.label} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5", index === 0 ? "bg-slate-950/5 dark:bg-white/10" : "")}>
              <item.icon className="h-4 w-4 text-slate-400" aria-hidden />
              <Shimmer className="h-3 w-24" />
            </div>
          ))}
        </div>
        <Panel className="absolute inset-x-3 bottom-4">
          <Shimmer className="h-4 w-28" />
          <Shimmer className="mt-3 h-3 w-full" />
          <Shimmer className="mt-2 h-3 w-4/5" />
        </Panel>
      </aside>
      <div className="md:pl-72">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-white/60 bg-white/70 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/70 md:px-6">
          <div className="space-y-2">
            <Shimmer className="h-5 w-36" />
            <Shimmer className="h-3 w-44" />
          </div>
          <div className="flex items-center gap-2">
            <Shimmer className="h-10 w-10" />
            <Shimmer className="h-10 w-10" />
          </div>
        </header>
        <main className="px-4 py-5 pb-28 md:px-6 md:pb-8">
          {variant === "analytics" ? <AnalyticsSkeleton /> : variant === "table" ? <TableSkeleton rows={tableRows.length} /> : variant === "settings" ? <SettingsSkeleton /> : <DashboardSkeleton />}
        </main>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-6 border-t border-white/60 bg-white/85 px-1 py-2 backdrop-blur-2xl dark:border-slate-800/80 dark:bg-slate-950/85 md:hidden">
        {navItems.map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-1 py-1">
            <item.icon className="h-5 w-5 text-slate-400" aria-hidden />
            <Shimmer className="h-2 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Panel key={index} className="min-h-32">
            <Shimmer className="h-3 w-28" />
            <Shimmer className="mt-5 h-8 w-36" />
            <Shimmer className="mt-5 h-2 w-full" />
          </Panel>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="min-h-80">
          <Shimmer className="h-5 w-40" />
          <Shimmer className="mt-5 h-56 w-full" />
        </Panel>
        <Panel className="min-h-80">
          <Shimmer className="h-5 w-36" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Shimmer key={index} className="h-8 w-full" />
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-5">
      <Panel>
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Shimmer className="h-3 w-16" />
              <Shimmer className="h-10 w-full" />
            </div>
          ))}
        </div>
      </Panel>
      <Panel>
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="grid grid-cols-[1fr_90px] gap-3 md:grid-cols-[1.1fr_0.8fr_0.8fr_0.7fr_90px]">
              <Shimmer className="h-10 w-full" />
              <Shimmer className="h-10 w-full" />
              <Shimmer className="hidden h-10 w-full md:block" />
              <Shimmer className="hidden h-10 w-full md:block" />
              <Shimmer className="hidden h-10 w-full md:block" />
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-5">
      <Panel>
        <div className="grid gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Shimmer key={index} className="h-10 w-full" />
          ))}
        </div>
      </Panel>
      <div className="grid gap-5 xl:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Panel key={index} className="min-h-80">
            <Shimmer className="h-5 w-44" />
            <Shimmer className="mt-5 h-56 w-full" />
          </Panel>
        ))}
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <Panel className="space-y-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <Shimmer key={index} className="h-12 w-full" />
        ))}
      </Panel>
      <Panel className="min-h-96">
        <Shimmer className="h-5 w-40" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Shimmer key={index} className="h-16 w-full" />
          ))}
        </div>
      </Panel>
    </div>
  );
}
