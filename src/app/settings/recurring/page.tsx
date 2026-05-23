import { CalendarClock, Pause, Play } from "lucide-react";
import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toggleRecurringTransaction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { money, nextRunDate, plDate, toNumber } from "@/lib/utils";

const frequencyLabels = {
  weekly: "Co tydzień",
  monthly: "Co miesiąc",
  yearly: "Co rok",
} as const;

export default async function RecurringSettingsPage() {
  const user = await requireUser();
  const recurring = await prisma.recurringTransaction.findMany({
    where: { householdId: user.householdId },
    orderBy: [{ isActive: "desc" }, { nextRunAt: "asc" }],
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      frequency: true,
      nextRunAt: true,
      lastRunAt: true,
      isActive: true,
      category: { select: { name: true, color: true } },
      paymentMethod: { select: { name: true } },
      addedBy: { select: { displayName: true, color: true } },
      transactions: { select: { id: true }, take: 1 },
    },
  });

  return (
    <AppFrame title="Cykliczne">
      <Card>
        <CardHeader>
          <CardTitle>Transakcje cykliczne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {recurring.map((item) => {
            const dates = upcomingDates(item.nextRunAt, item.frequency, 3);
            return (
              <div key={item.id} className="rounded-md border border-slate-100 p-4 dark:border-slate-800">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold">{item.description || item.category.name}</span>
                      <Badge className={item.isActive ? "text-green-700" : "text-slate-500"}>
                        {item.isActive ? "Aktywna" : "Wstrzymana"}
                      </Badge>
                      <Badge>{frequencyLabels[item.frequency]}</Badge>
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-slate-500 md:grid-cols-2">
                      <span>{item.type === "income" ? "Przychód" : "Wydatek"}: <strong className={item.type === "income" ? "text-green-600" : "text-red-600"}>{money(toNumber(item.amount))}</strong></span>
                      <span>Kategoria: <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.category.color }} />{item.category.name}</span></span>
                      <span>Metoda: {item.paymentMethod.name}</span>
                      <span>Autor: <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.addedBy.color }} />{item.addedBy.displayName}</span></span>
                      <span>Następne wykonanie: {plDate(item.nextRunAt)}</span>
                      <span>Ostatnie wykonanie: {item.lastRunAt ? plDate(item.lastRunAt) : "Jeszcze nie"}</span>
                    </div>
                  </div>
                  <form action={toggleRecurringTransaction}>
                    <input type="hidden" name="id" value={item.id} />
                    <input type="hidden" name="isActive" value={String(!item.isActive)} />
                    <Button variant={item.isActive ? "outline" : "default"} size="sm">
                      {item.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      {item.isActive ? "Wstrzymaj" : "Wznów"}
                    </Button>
                  </form>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-200"><CalendarClock className="h-4 w-4" /> Kolejne terminy:</span>
                  {dates.map((date) => <Badge key={date.toISOString()}>{plDate(date)}</Badge>)}
                </div>
              </div>
            );
          })}
          {!recurring.length ? <p className="py-8 text-sm text-slate-500">Brak transakcji cyklicznych. Dodasz je w formularzu nowej transakcji, wybierając cykliczność tygodniową, miesięczną albo roczną.</p> : null}
        </CardContent>
      </Card>
    </AppFrame>
  );
}

function upcomingDates(start: Date, frequency: "weekly" | "monthly" | "yearly", count: number) {
  const dates: Date[] = [];
  let cursor = new Date(start);
  for (let index = 0; index < count; index += 1) {
    dates.push(cursor);
    cursor = nextRunDate(cursor, frequency);
  }
  return dates;
}
