import { eachDayOfInterval, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Gauge, WalletCards } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AppFrame } from "@/components/app/app-frame";
import { BalanceLine, CategoryDonut, CompareBars, HorizontalBars } from "@/components/app/charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { money, percent, plDate, toNumber } from "@/lib/utils";

export default async function DashboardPage() {
  const user = await requireUser();
  const now = new Date();
  const currentFrom = startOfMonth(now);
  const currentTo = endOfMonth(now);
  const previousFrom = startOfMonth(subMonths(now, 1));
  const previousTo = endOfMonth(subMonths(now, 1));

  const [current, previous, budgets, recent, goals] = await Promise.all([
    prisma.transaction.findMany({
      where: { householdId: user.householdId, deletedAt: null, date: { gte: currentFrom, lte: currentTo } },
      select: {
        type: true,
        amount: true,
        date: true,
        categoryId: true,
        category: { select: { name: true, color: true } },
      },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.findMany({
      where: { householdId: user.householdId, deletedAt: null, date: { gte: previousFrom, lte: previousTo } },
      select: { type: true, amount: true, category: { select: { name: true } } },
    }),
    prisma.budget.findMany({
      where: { householdId: user.householdId, month: currentFrom },
      select: { categoryId: true, limitAmount: true, category: { select: { name: true } } },
      orderBy: { category: { name: "asc" } },
    }),
    prisma.transaction.findMany({
      where: { householdId: user.householdId, deletedAt: null },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        category: { select: { name: true } },
        addedBy: { select: { displayName: true } },
      },
      orderBy: { date: "desc" },
      take: 5,
    }),
    prisma.goal.findMany({ where: { householdId: user.householdId }, orderBy: { deadline: "asc" }, take: 4 }),
  ]);

  const income = current.filter((item) => item.type === "income").reduce((sum, item) => sum + toNumber(item.amount), 0);
  const expenses = current.filter((item) => item.type !== "income").reduce((sum, item) => sum + toNumber(item.amount), 0);
  const saldo = income - expenses;
  const totalBudget = budgets.reduce((sum, budget) => sum + toNumber(budget.limitAmount), 0);
  const budgetUse = totalBudget ? expenses / totalBudget : 0;

  const byCategory = new Map<string, { name: string; value: number; color: string }>();
  for (const item of current.filter((transaction) => transaction.type !== "income")) {
    const existing = byCategory.get(item.categoryId) ?? { name: item.category.name, value: 0, color: item.category.color };
    existing.value += toNumber(item.amount);
    byCategory.set(item.categoryId, existing);
  }
  const topCategories = [...byCategory.values()].sort((a, b) => b.value - a.value).slice(0, 5);

  const days = eachDayOfInterval({ start: currentFrom, end: now });
  const netByDay = new Map<string, number>();
  for (const item of current) {
    const key = format(item.date, "yyyy-MM-dd");
    netByDay.set(key, (netByDay.get(key) ?? 0) + (item.type === "income" ? toNumber(item.amount) : -toNumber(item.amount)));
  }
  const dailyNet = days.map((day) => netByDay.get(format(day, "yyyy-MM-dd")) ?? 0);
  const balanceLine = dailyNet.reduce<{ data: { day: string; saldo: number; trend: number }[]; running: number }>(
    (acc, value, index) => {
      const running = acc.running + value;
      acc.running = running;
      acc.data.push({
        day: format(days[index], "dd.MM"),
        saldo: running,
        trend: days.length > 1 ? (running / (index + 1)) * days.length : running,
      });
      return acc;
    },
    { data: [], running: 0 },
  ).data;

  const previousByCategory = new Map<string, number>();
  for (const item of previous.filter((transaction) => transaction.type !== "income")) {
    previousByCategory.set(item.category.name, (previousByCategory.get(item.category.name) ?? 0) + toNumber(item.amount));
  }
  const compare = [...new Set([...topCategories.map((item) => item.name), ...previousByCategory.keys()])]
    .slice(0, 8)
    .map((name) => ({
      name,
      current: topCategories.find((item) => item.name === name)?.value ?? 0,
      previous: previousByCategory.get(name) ?? 0,
    }));

  const alerts = budgets
    .map((budget) => {
      const spent = byCategory.get(budget.categoryId)?.value ?? 0;
      const limit = toNumber(budget.limitAmount);
      return { name: budget.category.name, spent, limit, ratio: limit ? spent / limit : 0 };
    })
    .filter((item) => item.ratio >= 0.8);

  return (
    <AppFrame title="Dashboard">
      <div className="grid gap-4 lg:grid-cols-4">
        <Metric title="Przychody" value={money(income)} tone="green" icon={ArrowUpRight} hint="Bieżący miesiąc" />
        <Metric title="Wydatki" value={money(expenses)} tone="red" icon={ArrowDownRight} hint="Bieżący miesiąc" />
        <Metric title="Saldo" value={money(saldo)} tone={saldo >= 0 ? "green" : "red"} icon={WalletCards} hint="Przychody minus wydatki" />
        <Metric title="Budżet wykorzystany" value={percent(budgetUse)} tone={budgetUse >= 1 ? "red" : budgetUse >= 0.8 ? "amber" : "neutral"} icon={Gauge} hint={totalBudget ? `Limit: ${money(totalBudget)}` : "Brak limitów"} />
      </div>

      {alerts.length ? (
        <Card className="mt-4 border-red-200/80 bg-red-50/90 dark:border-red-900/80 dark:bg-red-950/30">
          <CardContent className="flex flex-wrap items-center gap-2 pt-4">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            {alerts.map((alert) => (
              <Badge key={alert.name} className="border-red-300 text-red-700 dark:border-red-800 dark:text-red-300">
                {alert.name}: {percent(alert.ratio)}
              </Badge>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top 5 kategorii wydatków</CardTitle></CardHeader>
          <CardContent><HorizontalBars data={topCategories} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Saldo dzień po dniu</CardTitle></CardHeader>
          <CardContent><BalanceLine data={balanceLine} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Podział wydatków</CardTitle></CardHeader>
          <CardContent><CategoryDonut data={[...byCategory.values()]} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ten miesiąc vs poprzedni</CardTitle></CardHeader>
          <CardContent><CompareBars data={compare} /></CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Ostatnie transakcje</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/70 bg-white/60 p-3 shadow-sm transition-colors hover:bg-white/90 dark:border-slate-800/80 dark:bg-slate-950/40 dark:hover:bg-slate-900/70">
                <div className="min-w-0">
                  <div className="font-medium">{item.description || item.category.name}</div>
                  <div className="truncate text-xs text-slate-500 dark:text-slate-400">{plDate(item.date)} · {item.addedBy.displayName} · {item.category.name}</div>
                </div>
                <div className={item.type === "income" ? "shrink-0 font-semibold text-green-600" : "shrink-0 font-semibold text-red-600"}>{money(toNumber(item.amount))}</div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Status celów</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {goals.map((goal) => {
              const currentAmount = toNumber(goal.currentAmount);
              const target = toNumber(goal.targetAmount);
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{goal.name}</span>
                    <span>{money(currentAmount)} / {money(target)}</span>
                  </div>
                  <Progress value={(currentAmount / target) * 100} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </AppFrame>
  );
}

function Metric({ title, value, tone, icon: Icon, hint }: { title: string; value: string; tone: "green" | "red" | "amber" | "neutral"; icon: LucideIcon; hint: string }) {
  const styles = {
    green: {
      text: "text-emerald-600 dark:text-emerald-400",
      icon: "bg-emerald-50 text-emerald-600 ring-emerald-200/70 dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-900/70",
      rail: "from-emerald-400 to-teal-500",
    },
    red: {
      text: "text-rose-600 dark:text-rose-400",
      icon: "bg-rose-50 text-rose-600 ring-rose-200/70 dark:bg-rose-950/30 dark:text-rose-300 dark:ring-rose-900/70",
      rail: "from-rose-400 to-orange-400",
    },
    amber: {
      text: "text-amber-600 dark:text-amber-400",
      icon: "bg-amber-50 text-amber-600 ring-amber-200/70 dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-900/70",
      rail: "from-amber-300 to-yellow-500",
    },
    neutral: {
      text: "text-slate-950 dark:text-slate-50",
      icon: "bg-blue-50 text-blue-600 ring-blue-200/70 dark:bg-blue-950/30 dark:text-blue-300 dark:ring-blue-900/70",
      rail: "from-blue-400 to-cyan-400",
    },
  }[tone];

  return (
    <Card className="group overflow-hidden">
      <CardContent className="relative p-4">
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.rail}`} />
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
            <p className={`mt-2 truncate text-2xl font-semibold ${styles.text}`}>{value}</p>
          </div>
          <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ring-1 ${styles.icon}`}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </div>
        <p className="mt-3 truncate text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      </CardContent>
    </Card>
  );
}
