import { differenceInCalendarDays } from "date-fns";
import { AppFrame } from "@/components/app/app-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { contributeGoal, createGoal } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { money, plDate, toNumber } from "@/lib/utils";

export default async function GoalsPage() {
  const user = await requireUser();
  const [goals, categories, methods] = await Promise.all([
    prisma.goal.findMany({ where: { householdId: user.householdId }, include: { contributions: true }, orderBy: { createdAt: "desc" } }),
    prisma.category.findMany({ where: { householdId: user.householdId, type: "expense" }, orderBy: { name: "asc" } }),
    prisma.paymentMethod.findMany({ where: { householdId: user.householdId }, orderBy: { name: "asc" } }),
  ]);
  const savingsCategory = categories.find((category) => category.name === "Oszczędności") ?? categories[0];

  return (
    <AppFrame title="Cele">
      <Card>
        <CardHeader><CardTitle>Nowy cel</CardTitle></CardHeader>
        <CardContent>
          <form action={createGoal} className="grid gap-3 md:grid-cols-4">
            <div className="space-y-2"><Label htmlFor="name">Nazwa</Label><Input id="name" name="name" required placeholder="Wesele, wakacje..." /></div>
            <div className="space-y-2"><Label htmlFor="targetAmount">Kwota docelowa</Label><Input id="targetAmount" name="targetAmount" type="number" step="0.01" min="0.01" required /></div>
            <div className="space-y-2"><Label htmlFor="deadline">Deadline</Label><Input id="deadline" name="deadline" type="date" /></div>
            <div className="space-y-2"><Label htmlFor="color">Kolor</Label><Input id="color" name="color" type="color" defaultValue="#22c55e" /></div>
            <div className="md:col-span-4"><Button type="submit">Dodaj cel</Button></div>
          </form>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {!goals.length ? (
          <Card className="lg:col-span-2">
            <CardContent className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              Brak celów. Dodaj pierwszy cel oszczędnościowy powyżej.
            </CardContent>
          </Card>
        ) : null}
        {goals.map((goal) => {
          const current = toNumber(goal.currentAmount);
          const target = toNumber(goal.targetAmount);
          const avgDaily = goal.contributions.length
            ? goal.contributions.reduce((sum, item) => sum + toNumber(item.amount), 0) / Math.max(1, differenceInCalendarDays(new Date(), goal.createdAt))
            : 0;
          const etaDays = avgDaily ? Math.ceil((target - current) / avgDaily) : null;
          return (
            <Card key={goal.id}>
              <CardHeader><CardTitle>{goal.name}</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm"><span>{money(current)}</span><span>{money(target)}</span></div>
                  <Progress value={(current / target) * 100} />
                  <div className="text-sm text-slate-500">
                    Deadline: {goal.deadline ? plDate(goal.deadline) : "brak"} · Prognoza: {etaDays ? `za ${etaDays} dni` : "brak tempa"}
                  </div>
                </div>
                <form action={contributeGoal} className="grid gap-2 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="goalId" value={goal.id} />
                  <input type="hidden" name="categoryId" value={savingsCategory?.id} />
                  <select name="paymentMethodId" className="hidden" defaultValue={methods[0]?.id}>{methods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}</select>
                  <Input name="amount" type="number" step="0.01" min="0.01" placeholder="Kwota wpłaty" required />
                  <Button type="submit">Dorzuć</Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppFrame>
  );
}
