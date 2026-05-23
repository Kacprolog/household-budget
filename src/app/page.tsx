import { eachDayOfInterval, endOfMonth, format, startOfMonth, subMonths } from "date-fns";
import { AlertTriangle } from "lucide-react";
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
      include: { category: true, addedBy: true, paymentMethod: true },
      orderBy: { date: "asc" },
    }),
    prisma.transaction.findMany({
      where: { householdId: user.householdId, deletedAt: null, date: { gte: previousFrom, lte: previousTo } },
      include: { category: true },
    }),
    prisma.budget.findMany({
      where: { householdId: user.householdId, month: currentFrom },
      include: { category: true },
      orderBy: { category: { name: "asc" } },
    }),
    prisma.transaction.findMany({
      where: { householdId: user.householdId, deletedAt: null },
      include: { category: true, addedBy: true },
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
        <Metric title="Przychody" value={money(income)} tone="green" />
        <Metric title="Wydatki" value={money(expenses)} tone="red" />
        <Metric title="Saldo" value={money(saldo)} tone={saldo >= 0 ? "green" : "red"} />
        <Metric title="Budżet wykorzystany" value={percent(budgetUse)} tone={budgetUse >= 1 ? "red" : budgetUse >= 0.8 ? "amber" : "neutral"} />
      </div>

      {alerts.length ? (
        <Card className="mt-4 border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
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
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-md border border-slate-100 p-3 dark:border-slate-800">
                <div>
                  <div className="font-medium">{item.description || item.category.name}</div>
                  <div className="text-xs text-slate-500">{plDate(item.date)} · {item.addedBy.displayName} · {item.category.name}</div>
                </div>
                <div className={item.type === "income" ? "text-green-600" : "text-red-600"}>{money(toNumber(item.amount))}</div>
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

function Metric({ title, value, tone }: { title: string; value: string; tone: "green" | "red" | "amber" | "neutral" }) {
  const color = tone === "green" ? "text-green-600" : tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-slate-950 dark:text-slate-50";
  return (
    <Card>
      <CardContent className="pt-4">
        <p className="text-sm text-slate-500">{title}</p>
        <p className={`mt-2 text-2xl font-semibold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
