import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

type CsvRow = {
  data?: string;
  date?: string;
  typ?: string;
  type?: string;
  kwota?: string;
  amount?: string;
  kategoria?: string;
  category?: string;
  metoda?: string;
  method?: string;
  opis?: string;
  description?: string;
};

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
  const text = await file.text();
  const parsed = Papa.parse<CsvRow>(text, { header: true, skipEmptyLines: true });

  const [categories, methods] = await Promise.all([
    prisma.category.findMany({ where: { householdId: user.householdId } }),
    prisma.paymentMethod.findMany({ where: { householdId: user.householdId } }),
  ]);
  const fallbackExpense = categories.find((item) => item.type === "expense" && item.name === "Inne") ?? categories.find((item) => item.type === "expense");
  const fallbackIncome = categories.find((item) => item.type === "income" && item.name === "Inne") ?? categories.find((item) => item.type === "income");
  const fallbackMethod = methods.find((item) => item.name === "Gotówka") ?? methods[0];

  let imported = 0;
  for (const row of parsed.data) {
    const type = (row.typ ?? row.type) === "income" || (row.typ ?? row.type) === "przychód" ? "income" : "expense";
    const amount = Number(String(row.kwota ?? row.amount ?? "0").replace(",", "."));
    if (!amount || !Number.isFinite(amount)) continue;
    const categoryName = row.kategoria ?? row.category ?? "";
    const methodName = row.metoda ?? row.method ?? "";
    const category = categories.find((item) => item.type === type && item.name.toLowerCase() === categoryName.toLowerCase()) ?? (type === "income" ? fallbackIncome : fallbackExpense);
    const method = methods.find((item) => item.name.toLowerCase() === methodName.toLowerCase()) ?? fallbackMethod;
    if (!category || !method) continue;
    await prisma.transaction.create({
      data: {
        householdId: user.householdId,
        type,
        amount,
        date: new Date(`${row.data ?? row.date ?? new Date().toISOString().slice(0, 10)}T12:00:00`),
        categoryId: category.id,
        paymentMethodId: method.id,
        addedById: user.id,
        description: row.opis ?? row.description ?? null,
      },
    });
    imported += 1;
  }

  return NextResponse.redirect(new URL(`/transactions?imported=${imported}`, request.url));
}
