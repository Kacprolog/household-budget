import Papa from "papaparse";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { findRuleMatch } from "@/lib/categorization";
import { normalizeCsvRow, type CsvColumnMapping, type CsvProfile } from "@/lib/csv-import";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export async function POST(request: NextRequest) {
  const user = await requireUser();
  const form = await request.formData();
  const file = form.get("file");
  const profile = String(form.get("profile") ?? "auto") as CsvProfile;
  const mode = String(form.get("mode") ?? "preview");
  const mapping = readColumnMapping(form);
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

  if (mode === "preview") {
    const normalizedRows = parsed.data.map((row, index) => ({ row, index, normalized: normalizeCsvRow(row, profile, mapping) }));
    const externalIds = normalizedRows
      .map((item) => item.normalized?.externalId)
      .filter(Boolean)
      .map((id) => `csv:${id}`);
    const existing = await prisma.transaction.findMany({
      where: { householdId: user.householdId, source: "csv", externalId: { in: externalIds } },
      select: { externalId: true },
    });
    const existingIds = new Set(existing.map((item) => item.externalId));

    const rows = normalizedRows.map(({ row, index, normalized }) => {
      if (!normalized) {
        return {
          rowIndex: index + 1,
          status: "invalid" as const,
          reason: "Nie udało się odczytać daty albo kwoty.",
          raw: sanitizeRow(row),
        };
      }

      const rule = findRuleMatch(
        rules.filter((item) => item.type === normalized.type || item.type === null),
        normalized.description?.toLowerCase() ?? "",
      );
      const category = rule?.category ?? categories.find((item) => item.type === normalized.type && item.name.toLowerCase() === normalized.categoryName.toLowerCase()) ?? (normalized.type === "income" ? fallbackIncome : fallbackExpense);
      const method = rule?.paymentMethod ?? methods.find((item) => item.name.toLowerCase() === normalized.methodName.toLowerCase()) ?? fallbackMethod;
      const externalId = `csv:${normalized.externalId}`;
      if (!category || !method) {
        return {
          rowIndex: index + 1,
          status: "invalid" as const,
          reason: "Brak pasującej kategorii albo metody płatności.",
          type: normalized.type,
          amount: normalized.amount,
          date: new Date(`${normalized.date}T12:00:00`),
          description: normalized.description,
          externalId,
          raw: sanitizeRow(row),
        };
      }

      return {
        rowIndex: index + 1,
        status: existingIds.has(externalId) ? "duplicate" as const : "ready" as const,
        reason: existingIds.has(externalId) ? "Transakcja już istnieje w imporcie CSV." : null,
        type: normalized.type,
        amount: normalized.amount,
        date: new Date(`${normalized.date}T12:00:00`),
        description: normalized.description,
        categoryId: category.id,
        paymentMethodId: method.id,
        externalId,
        matchedRuleId: rule?.id ?? null,
        raw: sanitizeRow(row),
      };
    });

    const readyRows = rows.filter((row) => row.status === "ready").length;
    const duplicateRows = rows.filter((row) => row.status === "duplicate").length;
    const invalidRows = rows.filter((row) => row.status === "invalid").length;
    const batch = await prisma.importBatch.create({
      data: {
        householdId: user.householdId,
        uploadedById: user.id,
        filename: file.name,
        profile: mappingLabel(profile, mapping),
        totalRows: rows.length,
        readyRows,
        duplicateRows,
        invalidRows,
        rows: { createMany: { data: rows } },
      },
    });

    return NextResponse.redirect(new URL(`/settings/imports/${batch.id}`, request.url));
  }

  let imported = 0;
  let skipped = 0;
  for (const row of parsed.data) {
    const normalized = normalizeCsvRow(row, profile, mapping);
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

function sanitizeRow(row: Record<string, string | undefined>) {
  return Object.fromEntries(Object.entries(row).filter((entry): entry is [string, string] => typeof entry[1] === "string"));
}

function readColumnMapping(form: FormData): CsvColumnMapping {
  return {
    date: formValue(form, "map_date"),
    amount: formValue(form, "map_amount"),
    description: formValue(form, "map_description"),
    category: formValue(form, "map_category"),
    method: formValue(form, "map_method"),
    type: formValue(form, "map_type"),
  };
}

function formValue(form: FormData, key: string) {
  const value = String(form.get(key) ?? "").trim();
  return value || undefined;
}

function mappingLabel(profile: CsvProfile, mapping: CsvColumnMapping) {
  const active = Object.entries(mapping).filter(([, column]) => Boolean(column));
  if (!active.length) return profile;
  return `${profile}: ${active.map(([field, column]) => `${field}=${column}`).join(", ")}`;
}
