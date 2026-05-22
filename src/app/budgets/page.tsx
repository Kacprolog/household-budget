import { format, startOfMonth } from "date-fns";
import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { updateBudget } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { money, percent, toNumber } from "@/lib/utils";

export default async function BudgetsPage() {
  const user = await requireUser();
  const month = startOfMonth(new Date());
  const [categories, budgets, spending] = await Promise.all([
    prisma.category.findMany({ where: { householdId: user.householdId, type: "expense" }, orderBy: { name: "asc" } }),
    prisma.budget.findMany({ where: { householdId: user.householdId, month }, include: { category: true } }),
    prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { householdId: user.householdId, deletedAt: null, type: { not: "income" }, date: { gte: month } },
      _sum: { amount: true },
    }),
  ]);
  const budgetByCategory = new Map(budgets.map((budget) => [budget.categoryId, budget]));
  const spentByCategory = new Map(spending.map((item) => [item.categoryId, toNumber(item._sum.amount)]));
  const monthValue = format(month, "yyyy-MM");

  return (
    <AppFrame title="Budżety">
      <div className="grid gap-4 lg:grid-cols-2">
        {categories.map((category) => {
          const budget = budgetByCategory.get(category.id);
          const limit = budget ? toNumber(budget.limitAmount) : 0;
          const spent = spentByCategory.get(category.id) ?? 0;
          const ratio = limit ? spent / limit : 0;
          return (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <CardTitle>{category.name}</CardTitle>
                  {ratio >= 1 ? <Badge className="border-red-300 text-red-700">100%+</Badge> : ratio >= 0.8 ? <Badge className="border-amber-300 text-amber-700">80%+</Badge> : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{money(spent)} wydane</span>
                    <span>{limit ? `${money(limit)} limit` : "Brak limitu"}</span>
                  </div>
                  <Progress value={ratio * 100} />
                  <div className="text-sm text-slate-500">Zostało: {money(Math.max(limit - spent, 0))} · {percent(ratio)}</div>
                </div>
                <form action={updateBudget} className="flex items-end gap-2">
                  <input type="hidden" name="categoryId" value={category.id} />
                  <input type="hidden" name="month" value={monthValue} />
                  <div className="flex-1 space-y-2">
                    <Label htmlFor={`limit-${category.id}`}>Limit miesięczny</Label>
                    <Input id={`limit-${category.id}`} name="limitAmount" type="number" min="0.01" step="0.01" defaultValue={limit || ""} />
                  </div>
                  <Button type="submit">Zapisz</Button>
                </form>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppFrame>
  );
}
