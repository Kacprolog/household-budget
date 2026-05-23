import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { findRuleMatch } from "@/lib/categorization";
import { normalizeCsvRow, type CsvProfile } from "@/lib/csv-import";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const form = await request.formData();
  const file = form.get("file");
  const profile = String(form.get("profile") ?? "auto") as CsvProfile;
  if (!(file instanceof File)) return NextResponse.json({ error: "Brak pliku" }, { status: 400 });
  const text = await file.text();
  const parsed = Papa.parse<Record<string, string | undefined>>(text, { header: true, skipEmptyLines: true });

  const [categories, methods, rules] = await Promise.all([
    prisma.category.findMany({ where: { householdId: user.householdId } }),
    prisma.paymentMethod.findMany({ where: { householdId: user.householdId } }),
    prisma.categorizationRule.findMany({
      where: { householdId: user.householdId, isActive: true },
      include: { category: true, paymentMethod: true },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    }),
  ]);
  const fallbackExpense = categories.find((item) => item.type === "expense" && item.name === "Inne") ?? categories.find((item) => item.type === "expense");
  const fallbackIncome = categories.find((item) => item.type === "income" && item.name === "Inne") ?? categories.find((item) => item.type === "income");
  const fallbackMethod = methods.find((item) => item.name === "Gotówka") ?? methods[0];

  let imported = 0;
  let skipped = 0;
  for (const row of parsed.data) {
    const normalized = normalizeCsvRow(row, profile);
    if (!normalized) {
      skipped += 1;
      continue;
    }
    const rule = findRuleMatch(
      rules.filter((item) => item.type === normalized.type || item.type === null),
      normalized.description?.toLowerCase() ?? "",
    );
    const category = rule?.category ?? categories.find((item) => item.type === normalized.type && item.name.toLowerCase() === normalized.categoryName.toLowerCase()) ?? (normalized.type === "income" ? fallbackIncome : fallbackExpense);
    const method = rule?.paymentMethod ?? methods.find((item) => item.name.toLowerCase() === normalized.methodName.toLowerCase()) ?? fallbackMethod;
    if (!category || !method) continue;
    try {
      await prisma.transaction.create({
        data: {
          householdId: user.householdId,
          type: normalized.type,
          amount: normalized.amount,
          date: new Date(`${normalized.date}T12:00:00`),
          categoryId: category.id,
          paymentMethodId: method.id,
          addedById: user.id,
          description: normalized.description,
          source: "csv",
          externalId: `csv:${normalized.externalId}`,
        },
      });
      if (rule) {
        await prisma.categorizationRule.update({
          where: { id: rule.id },
          data: { matchCount: { increment: 1 }, lastMatchedAt: new Date() },
        });
      }
      imported += 1;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        skipped += 1;
        continue;
      }
      throw error;
    }
  }

  return NextResponse.redirect(new URL(`/transactions?imported=${imported}&skipped=${skipped}`, request.url));
}
