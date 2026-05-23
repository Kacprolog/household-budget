import { Power, Trash2 } from "lucide-react";
import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategorizationRule, deleteCategorizationRule, toggleCategorizationRule } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { plDate } from "@/lib/utils";

export default async function RulesPage() {
  const user = await requireUser();
  const [rules, categories, methods] = await Promise.all([
    prisma.categorizationRule.findMany({
      where: { householdId: user.householdId },
      include: { category: true, paymentMethod: true },
      orderBy: [{ priority: "asc" }, { createdAt: "desc" }],
    }),
    prisma.category.findMany({ where: { householdId: user.householdId }, orderBy: [{ type: "asc" }, { name: "asc" }] }),
    prisma.paymentMethod.findMany({ where: { householdId: user.householdId }, orderBy: { name: "asc" } }),
  ]);

  return (
    <AppFrame title="Reguły kategoryzacji">
      <Card>
        <CardHeader><CardTitle>Nowa reguła</CardTitle></CardHeader>
        <CardContent>
          <form action={createCategorizationRule} className="grid gap-3 md:grid-cols-[1fr_160px_1fr_1fr_120px_auto]">
            <div className="space-y-2">
              <Label htmlFor="phrase">Fraza w opisie</Label>
              <Input id="phrase" name="phrase" placeholder="np. biedronka, netflix, czynsz" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <select id="type" name="type" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950" defaultValue="expense">
                <option value="expense">Wydatek</option>
                <option value="income">Przychód</option>
                <option value="all">Dowolny</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoryId">Kategoria</Label>
              <select id="categoryId" name="categoryId" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950" required>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.type === "income" ? "Przychód" : "Wydatek"} · {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethodId">Metoda</Label>
              <select id="paymentMethodId" name="paymentMethodId" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                <option value="">Bez zmiany</option>
                {methods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priorytet</Label>
              <Input id="priority" name="priority" type="number" min="1" max="999" defaultValue="100" />
            </div>
            <div className="flex items-end"><Button type="submit">Zapisz</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="divide-y divide-slate-100 pt-4 dark:divide-slate-800">
          {rules.map((rule) => (
            <div key={rule.id} className="flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{rule.phrase}</span>
                  <Badge>{rule.isActive ? "Aktywna" : "Wyłączona"}</Badge>
                  <Badge>{rule.type === "income" ? "Przychód" : rule.type === "expense" ? "Wydatek" : "Dowolny"}</Badge>
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {rule.category.name} · {rule.paymentMethod?.name ?? "metoda bez zmian"} · priorytet {rule.priority} · trafienia {rule.matchCount}
                  {rule.lastMatchedAt ? ` · ostatnio ${plDate(rule.lastMatchedAt)}` : ""}
                </div>
              </div>
              <div className="flex gap-2">
                <form action={toggleCategorizationRule}>
                  <input type="hidden" name="id" value={rule.id} />
                  <input type="hidden" name="isActive" value={String(!rule.isActive)} />
                  <Button variant="outline" size="sm"><Power className="h-4 w-4" /> {rule.isActive ? "Wyłącz" : "Włącz"}</Button>
                </form>
                <form action={deleteCategorizationRule}>
                  <input type="hidden" name="id" value={rule.id} />
                  <Button variant="ghost" size="icon" aria-label="Usuń"><Trash2 className="h-4 w-4" /></Button>
                </form>
              </div>
            </div>
          ))}
          {!rules.length ? <p className="py-6 text-sm text-slate-500">Brak reguł. Dodaj pierwszą, żeby import CSV sam dobierał kategorie.</p> : null}
        </CardContent>
      </Card>
    </AppFrame>
  );
}
