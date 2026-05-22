import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { toNumber } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const params = request.nextUrl.searchParams;
  const transactions = await prisma.transaction.findMany({
    where: {
      householdId: user.householdId,
      deletedAt: null,
      ...(params.get("type") ? { type: params.get("type") as "income" | "expense" } : {}),
      ...(params.get("categoryId") ? { categoryId: params.get("categoryId")! } : {}),
      ...(params.get("addedById") ? { addedById: params.get("addedById")! } : {}),
      ...(params.get("paymentMethodId") ? { paymentMethodId: params.get("paymentMethodId")! } : {}),
    },
    include: { category: true, paymentMethod: true, addedBy: true },
    orderBy: { date: "desc" },
  });

  const rows = [
    ["data", "typ", "kwota", "kategoria", "metoda", "autor", "zrodlo", "externalId", "opis"],
    ...transactions.map((item) => [
      item.date.toISOString().slice(0, 10),
      item.type,
      toNumber(item.amount).toFixed(2),
      item.category.name,
      item.paymentMethod.name,
      item.addedBy.displayName,
      item.source,
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
