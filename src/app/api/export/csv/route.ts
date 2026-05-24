import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { transactionWhereFromParams } from "@/lib/transaction-filters";
import { toNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const params = request.nextUrl.searchParams;
  const where = transactionWhereFromParams(params, user.householdId);
  const transactions = await prisma.transaction.findMany({
    where,
    select: {
      date: true,
      type: true,
      amount: true,
      source: true,
      externalId: true,
      description: true,
      deletedAt: true,
      category: { select: { name: true } },
      paymentMethod: { select: { name: true } },
      addedBy: { select: { displayName: true } },
    },
    orderBy: { date: "desc" },
  });

  const rows = [
    ["data", "typ", "kwota", "kategoria", "metoda", "autor", "zrodlo", "status", "externalId", "opis"],
    ...transactions.map((item) => [
      item.date.toISOString().slice(0, 10),
      item.type,
      toNumber(item.amount).toFixed(2),
      item.category.name,
      item.paymentMethod.name,
      item.addedBy.displayName,
      item.source,
      item.deletedAt ? "usunieta" : "aktywna",
      item.externalId ?? "",
      item.description ?? "",
    ]),
  ];
  const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\n");
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="budzet-transakcje.csv"`,
    },
  });
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}
