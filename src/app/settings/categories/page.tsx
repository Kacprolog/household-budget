import { Trash2 } from "lucide-react";
import { AppFrame } from "@/components/app/app-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory, deleteCategory } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await prisma.category.findMany({
    where: { householdId: user.householdId },
    include: { _count: { select: { transactions: true } } },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return (
    <AppFrame title="Kategorie">
      <Card>
        <CardHeader><CardTitle>Dodaj lub edytuj kategorię</CardTitle></CardHeader>
        <CardContent>
          <form action={createCategory} className="grid gap-3 md:grid-cols-5">
            <div className="space-y-2"><Label htmlFor="name">Nazwa</Label><Input id="name" name="name" required /></div>
            <div className="space-y-2">
              <Label htmlFor="type">Typ</Label>
              <select id="type" name="type" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950">
                <option value="expense">Wydatek</option><option value="income">Przychód</option>
              </select>
            </div>
            <div className="space-y-2"><Label htmlFor="color">Kolor</Label><Input id="color" name="color" type="color" defaultValue="#2563eb" /></div>
            <div className="space-y-2"><Label htmlFor="icon">Ikona lucide</Label><Input id="icon" name="icon" defaultValue="CircleHelp" /></div>
            <div className="flex items-end"><Button type="submit">Zapisz</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent className="divide-y divide-slate-100 pt-4 dark:divide-slate-800">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-3 py-3">
              <div className="flex items-center gap-3">
                <span className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }} />
                <div><div className="font-medium">{category.name}</div><div className="text-xs text-slate-500">{category.type === "income" ? "Przychód" : "Wydatek"} · {category.icon} · transakcje: {category._count.transactions}</div></div>
              </div>
              <form action={deleteCategory}>
                <input type="hidden" name="id" value={category.id} />
                <Button variant="ghost" size="icon" disabled={category._count.transactions > 0} title={category._count.transactions > 0 ? "Najpierw przenieś transakcje" : "Usuń"}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </AppFrame>
  );
}
