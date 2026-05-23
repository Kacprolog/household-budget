import { Fragment } from "react";
import { differenceInCalendarDays, eachDayOfInterval, format, getDay, isSameMonth } from "date-fns";
import { AppFrame } from "@/components/app/app-frame";
import { CategoryDonut, IncomeExpenseLine, SavingsLine } from "@/components/app/charts";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { money, rangeFromPreset, toNumber } from "@/lib/utils";

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const user = await requireUser();
  const range = rangeFromPreset(params.range, params.from, params.to);
  const excludeCommon = params.excludeCommon === "on";
  const commonNames = ["Mieszkanie (czynsz/kredyt)", "Rachunki", "Oszczędności"];

  const transactions = await prisma.transaction.findMany({
    where: { householdId: user.householdId, deletedAt: null, date: { gte: range.from, lte: range.to } },
    include: { category: true, addedBy: true },
    orderBy: { date: "asc" },
  });

  const expenses = transactions.filter((item) => item.type !== "income");
  const incomes = transactions.filter((item) => item.type === "income");
  const days = eachDayOfInterval({ start: range.from, end: range.to });
  const totalsByDay = new Map<string, { przychody: number; wydatki: number }>();
  for (const item of transactions) {
    const key = format(item.date, "yyyy-MM-dd");
    const bucket = totalsByDay.get(key) ?? { przychody: 0, wydatki: 0 };
    if (item.type === "income") bucket.przychody += toNumber(item.amount);
    else bucket.wydatki += toNumber(item.amount);
    totalsByDay.set(key, bucket);
  }
  const byDay = days.map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const bucket = totalsByDay.get(key) ?? { przychody: 0, wydatki: 0 };
    return {
      label: format(day, "dd.MM"),
      przychody: bucket.przychody,
      wydatki: bucket.wydatki,
    };
  });

  const savings = byDay.reduce<{ data: { label: string; oszczednosci: number }[]; cumulative: number }>(
    (acc, item) => {
      acc.cumulative += item.przychody - item.wydatki;
      acc.data.push({ label: item.label, oszczednosci: acc.cumulative });
      return acc;
    },
    { data: [], cumulative: 0 },
  ).data;

  const dailyExpenseValues = byDay.map((item) => item.wydatki).filter((value) => value > 0).sort((a, b) => a - b);
  const totalExpense = expenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const totalIncome = incomes.reduce((sum, item) => sum + toNumber(item.amount), 0);
  const median = dailyExpenseValues.length ? dailyExpenseValues[Math.floor(dailyExpenseValues.length / 2)] : 0;
  const maxDay = byDay.reduce((best, item) => (item.wydatki > best.wydatki ? item : best), byDay[0] ?? { label: "-", wydatki: 0 });
  const minDay = byDay.filter((item) => item.wydatki > 0).reduce((best, item) => (item.wydatki < best.wydatki ? item : best), { label: "-", wydatki: 0 });
  const dayCount = Math.max(1, differenceInCalendarDays(range.to, range.from) + 1);

  const byAuthor = new Map<string, { name: string; value: number; color: string }>();
  for (const item of expenses) {
    if (excludeCommon && commonNames.includes(item.category.name)) continue;
    const existing = byAuthor.get(item.addedById) ?? { name: item.addedBy.displayName, value: 0, color: item.addedBy.color };
    existing.value += toNumber(item.amount);
    byAuthor.set(item.addedById, existing);
  }

  const topTransactions = [...expenses].sort((a, b) => toNumber(b.amount) - toNumber(a.amount)).slice(0, 10);
  const byCategory = new Map<string, { name: string; current: number; previous: number; color: string }>();
  for (const item of expenses) {
    const bucket = byCategory.get(item.categoryId) ?? { name: item.category.name, current: 0, previous: 0, color: item.category.color };
    if (isSameMonth(item.date, new Date())) bucket.current += toNumber(item.amount);
    else bucket.previous += toNumber(item.amount);
    byCategory.set(item.categoryId, bucket);
  }
  const trends = [...byCategory.values()].sort((a, b) => b.current - a.current).slice(0, 8);
  const forecast = new Date().getDate() ? (expenses.filter((item) => isSameMonth(item.date, new Date())).reduce((sum, item) => sum + toNumber(item.amount), 0) / new Date().getDate()) * new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() : 0;

  const heatmapCategories = commonNames.concat(["Jedzenie", "Transport", "Rozrywka"]);
  const heatmapValues = new Map<string, number>();
  for (const item of expenses) {
    const key = `${getDay(item.date)}:${item.category.name}`;
    heatmapValues.set(key, (heatmapValues.get(key) ?? 0) + toNumber(item.amount));
  }
  const heatmap = Array.from({ length: 7 }, (_, day) => ({
    day,
    values: heatmapCategories.map((name) => heatmapValues.get(`${day}:${name}`) ?? 0),
  }));
  const maxHeat = Math.max(1, ...heatmap.flatMap((row) => row.values));

  return (
    <AppFrame title="Analityka">
      <Card>
        <CardContent className="pt-4">
          <form className="grid gap-3 md:grid-cols-5">
            <Select name="range" defaultValue={params.range ?? "current"} options={[["current", "Ten miesiąc"], ["previous", "Poprzedni"], ["3m", "3 miesiące"], ["6m", "6 miesięcy"], ["year", "Rok"], ["all", "Cały czas"], ["custom", "Custom"]]} />
            <div className="space-y-2"><Label htmlFor="from">Od</Label><Input id="from" name="from" type="date" defaultValue={params.from} /></div>
            <div className="space-y-2"><Label htmlFor="to">Do</Label><Input id="to" name="to" type="date" defaultValue={params.to} /></div>
            <label className="flex items-end gap-2 text-sm"><input type="checkbox" name="excludeCommon" defaultChecked={excludeCommon} className="mb-3 h-4 w-4" /> Wyłącz wspólne</label>
            <div className="flex items-end"><button className="h-10 rounded-md bg-slate-950 px-4 text-sm font-medium text-white dark:bg-white dark:text-slate-950">Pokaż</button></div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="Średnia dzienna" value={money(totalExpense / dayCount)} />
        <Stat title="Mediana dnia" value={money(median)} />
        <Stat title="Najdroższy dzień" value={`${maxDay.label}: ${money(maxDay.wydatki)}`} />
        <Stat title="Prognoza miesiąca" value={money(forecast)} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card><CardHeader><CardTitle>Przychody vs wydatki</CardTitle></CardHeader><CardContent><IncomeExpenseLine data={byDay} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Skumulowane oszczędności</CardTitle></CardHeader><CardContent><SavingsLine data={savings} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Wydatki per autor</CardTitle></CardHeader><CardContent><CategoryDonut data={[...byAuthor.values()]} /></CardContent></Card>
        <Card>
          <CardHeader><CardTitle>Heatmap wydatków</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-[80px_repeat(6,1fr)] gap-1 text-xs">
              <div />
              {heatmapCategories.map((name) => <div key={name} className="truncate text-slate-500">{name}</div>)}
              {heatmap.map((row) => (
                <Fragment key={row.day}>
                  <div key={`label-${row.day}`} className="py-2 text-slate-500">{["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "Sb"][row.day]}</div>
                  {row.values.map((value, index) => (
                    <div key={`${row.day}-${index}`} className="grid h-9 place-items-center rounded-sm text-[10px]" style={{ backgroundColor: `rgba(37, 99, 235, ${Math.max(0.08, value / maxHeat)})` }}>
                      {value ? Math.round(value) : ""}
                    </div>
                  ))}
                </Fragment>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top 10 transakcji</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {topTransactions.map((item) => (
              <div key={item.id} className="flex justify-between rounded-md border border-slate-100 p-3 text-sm dark:border-slate-800">
                <span>{format(item.date, "dd.MM.yyyy")} · {item.category.name} · {item.description || "-"}</span>
                <strong>{money(toNumber(item.amount))}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Trend kategorii</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {trends.map((item) => {
              const diff = item.current - item.previous;
              return (
                <div key={item.name} className="flex items-center justify-between gap-3">
                  <span>{item.name}</span>
                  <Badge className={diff >= 0 ? "text-red-600" : "text-green-600"}>{diff >= 0 ? "rośnie" : "maleje"} {money(Math.abs(diff))}</Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
      <p className="mt-4 text-sm text-slate-500">Burn rate: {money(totalExpense / dayCount)} dziennie. Przychody w zakresie: {money(totalIncome)}. Najtańszy aktywny dzień: {minDay.label}.</p>
    </AppFrame>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <Card><CardContent className="pt-4"><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-xl font-semibold">{value}</p></CardContent></Card>;
}

function Select({ name, defaultValue, options }: { name: string; defaultValue: string; options: [string, string][] }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>Zakres</Label>
      <select id={name} name={name} defaultValue={defaultValue} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
        {options.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </div>
  );
}
