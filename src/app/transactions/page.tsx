import Link from "next/link";
import { ArrowDownUp, Download, FileText, Pencil, RotateCcw, Search, Trash2, Upload } from "lucide-react";
import { AppFrame } from "@/components/app/app-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteTransaction, restoreTransaction } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { money, plDate, toNumber } from "@/lib/utils";

const sortable = new Set(["date", "amount", "type", "description"]);

export default async function TransactionsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const user = await requireUser();
  const page = Math.max(Number(params.page ?? 1), 1);
  const take = 20;
  const sort = sortable.has(params.sort ?? "") ? params.sort! : "date";
  const dir = params.dir === "asc" ? "asc" : "desc";
  const deletedFilter = params.deleted === "only" ? "only" : params.deleted === "all" ? "all" : "active";

  const where = {
    householdId: user.householdId,
    ...(deletedFilter === "active" ? { deletedAt: null } : deletedFilter === "only" ? { deletedAt: { not: null } } : {}),
    ...(params.type ? { type: params.type as "income" | "expense" } : {}),
    ...(params.categoryId ? { categoryId: params.categoryId } : {}),
    ...(params.addedById ? { addedById: params.addedById } : {}),
    ...(params.paymentMethodId ? { paymentMethodId: params.paymentMethodId } : {}),
    ...(params.from || params.to
      ? {
          date: {
            ...(params.from ? { gte: new Date(`${params.from}T00:00:00`) } : {}),
            ...(params.to ? { lte: new Date(`${params.to}T23:59:59`) } : {}),
          },
        }
      : {}),
    ...(params.q ? { description: { contains: params.q, mode: "insensitive" as const } } : {}),
  };

  const [transactions, total, categories, users, methods] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true, addedBy: true, paymentMethod: true },
      orderBy: { [sort]: dir },
      skip: (page - 1) * take,
      take,
    }),
    prisma.transaction.count({ where }),
    prisma.category.findMany({ where: { householdId: user.householdId }, orderBy: { name: "asc" } }),
    prisma.user.findMany({ where: { householdId: user.householdId }, orderBy: { displayName: "asc" } }),
    prisma.paymentMethod.findMany({ where: { householdId: user.householdId }, orderBy: { name: "asc" } }),
  ]);

  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value) as [string, string][]);

  return (
    <AppFrame title="Transakcje">
      <Card>
        <CardHeader>
          <CardTitle>Filtry</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="q">Szukaj</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input id="q" name="q" defaultValue={params.q} className="pl-9" placeholder="Opis" />
              </div>
            </div>
            <Select label="Typ" name="type" defaultValue={params.type} options={[["", "Wszystkie"], ["income", "Przychód"], ["expense", "Wydatek"]]} />
            <Select label="Kategoria" name="categoryId" defaultValue={params.categoryId} options={[["", "Wszystkie"], ...categories.map((item) => [item.id, item.name] as [string, string])]} />
            <Select label="Autor" name="addedById" defaultValue={params.addedById} options={[["", "Wszyscy"], ...users.map((item) => [item.id, item.displayName] as [string, string])]} />
            <Select label="Metoda" name="paymentMethodId" defaultValue={params.paymentMethodId} options={[["", "Wszystkie"], ...methods.map((item) => [item.id, item.name] as [string, string])]} />
            <Select label="Widok" name="deleted" defaultValue={deletedFilter === "active" ? "" : deletedFilter} options={[["", "Aktywne"], ["only", "Usunięte"], ["all", "Wszystkie"]]} />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2"><Label htmlFor="from">Od</Label><Input id="from" name="from" type="date" defaultValue={params.from} /></div>
              <div className="space-y-2"><Label htmlFor="to">Do</Label><Input id="to" name="to" type="date" defaultValue={params.to} /></div>
            </div>
            <div className="flex items-end gap-2 md:col-span-3 xl:col-span-6">
              <Button type="submit">Zastosuj</Button>
              <Button asChild variant="outline"><a href={`/api/export/csv?${query}`}><Download className="h-4 w-4" /> CSV</a></Button>
              <Button asChild variant="outline"><a href={`/api/export/pdf?${query}`}><FileText className="h-4 w-4" /> PDF</a></Button>
              <Button asChild variant="outline"><a href="/settings#csv"><Upload className="h-4 w-4" /> Import</a></Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-sm">
            <thead className="bg-slate-100 text-left dark:bg-slate-900">
              <tr>
                {[
                  ["date", "Data"],
                  ["type", "Typ"],
                  ["amount", "Kwota"],
                  ["description", "Opis"],
                ].map(([key, label]) => (
                  <th key={key} className="p-3 font-medium">
                    <a href={`/transactions?${sortUrl(params, key)}`} className="inline-flex items-center gap-1">
                      {label}<ArrowDownUp className="h-3 w-3" />
                    </a>
                  </th>
                ))}
                <th className="p-3 font-medium">Kategoria</th>
                <th className="p-3 font-medium">Autor</th>
                <th className="p-3 font-medium">Metoda</th>
                <th className="p-3 font-medium">Źródło</th>
                <th className="p-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="p-3">{plDate(item.date)}</td>
                  <td className="p-3">{item.type === "income" ? "Przychód" : "Wydatek"}</td>
                  <td className={`p-3 font-medium ${item.type === "income" ? "text-green-600" : "text-red-600"}`}>{money(toNumber(item.amount))}</td>
                  <td className="p-3">{item.description || "-"}</td>
                  <td className="p-3">{item.category.name}</td>
                  <td className="p-3">{item.addedBy.displayName}</td>
                  <td className="p-3">{item.paymentMethod.name}</td>
                  <td className="p-3">{item.deletedAt ? "Usunięta" : sourceLabel(item.source)}</td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      {item.deletedAt ? (
                        <form action={restoreTransaction}>
                          <input type="hidden" name="id" value={item.id} />
                          <Button variant="ghost" size="icon" aria-label="Przywróć"><RotateCcw className="h-4 w-4" /></Button>
                        </form>
                      ) : (
                        <>
                          <Button asChild variant="ghost" size="icon" aria-label="Edytuj">
                            <Link href={`/transactions/${item.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                          </Button>
                          <form action={deleteTransaction}>
                            <input type="hidden" name="id" value={item.id} />
                            <Button variant="ghost" size="icon" aria-label="Usuń"><Trash2 className="h-4 w-4" /></Button>
                          </form>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <CardContent className="flex items-center justify-between pt-4">
          <span className="text-sm text-slate-500">Wyniki: {total}</span>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><a href={`/transactions?${pageUrl(params, page - 1)}`}>Poprzednia</a></Button>
            <Button asChild variant="outline" size="sm"><a href={`/transactions?${pageUrl(params, page + 1)}`}>Następna</a></Button>
          </div>
        </CardContent>
      </Card>
    </AppFrame>
  );
}

function sourceLabel(source: string) {
  if (source === "csv") return "CSV";
  if (source === "bank") return "Bank";
  if (source === "recurring") return "Cykliczna";
  return "Ręczna";
}

function Select({ label, name, defaultValue, options }: { label: string; name: string; defaultValue?: string; options: [string, string][] }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select id={name} name={name} defaultValue={defaultValue} className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
        {options.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
      </select>
    </div>
  );
}

function sortUrl(params: Record<string, string | undefined>, sort: string) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value) as [string, string][]);
  query.set("sort", sort);
  query.set("dir", params.sort === sort && params.dir !== "asc" ? "asc" : "desc");
  return query.toString();
}

function pageUrl(params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value) as [string, string][]);
  query.set("page", String(Math.max(page, 1)));
  return query.toString();
}
