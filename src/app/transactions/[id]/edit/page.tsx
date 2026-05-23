import { format } from "date-fns";
import { notFound } from "next/navigation";
import { AppFrame } from "@/components/app/app-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateTransaction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { toNumber } from "@/lib/utils";

export default async function EditTransactionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  const [transaction, categories, methods] = await Promise.all([
    prisma.transaction.findFirst({
      where: { id, householdId: user.householdId, deletedAt: null },
      select: {
        id: true,
        type: true,
        amount: true,
        description: true,
        date: true,
        categoryId: true,
        paymentMethodId: true,
        category: { select: { name: true } },
      },
    }),
    prisma.category.findMany({ where: { householdId: user.householdId }, orderBy: [{ type: "asc" }, { name: "asc" }], select: { id: true, name: true, type: true } }),
    prisma.paymentMethod.findMany({ where: { householdId: user.householdId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!transaction) notFound();

  return (
    <AppFrame title="Edycja transakcji">
      <Card className="max-w-3xl">
        <CardHeader><CardTitle>{transaction.description || transaction.category.name}</CardTitle></CardHeader>
        <CardContent>
          <form action={updateTransaction} className="grid gap-4">
            <input type="hidden" name="id" value={transaction.id} />
            <div className="grid gap-3 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="type">Typ</Label>
                <select id="type" name="type" defaultValue={transaction.type} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                  <option value="expense">Wydatek</option>
                  <option value="income">Przychód</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="amount">Kwota</Label>
                <Input id="amount" name="amount" type="number" min="0.01" step="0.01" defaultValue={toNumber(transaction.amount)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Data</Label>
                <Input id="date" name="date" type="date" defaultValue={format(transaction.date, "yyyy-MM-dd")} required />
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Kategoria</Label>
                <select id="categoryId" name="categoryId" defaultValue={transaction.categoryId} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.type === "income" ? "Przychód" : "Wydatek"} · {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethodId">Metoda</Label>
                <select id="paymentMethodId" name="paymentMethodId" defaultValue={transaction.paymentMethodId} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                  {methods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Opis</Label>
              <Textarea id="description" name="description" defaultValue={transaction.description ?? ""} />
            </div>
            <div className="flex gap-2">
              <Button type="submit">Zapisz zmiany</Button>
              <Button asChild variant="outline"><a href="/transactions">Anuluj</a></Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AppFrame>
  );
}
