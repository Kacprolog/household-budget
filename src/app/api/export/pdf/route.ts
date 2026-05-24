import React from "react";
import { NextRequest } from "next/server";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { transactionWhereFromParams } from "@/lib/transaction-filters";
import { money, plDate, toNumber } from "@/lib/utils";

export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 20, marginBottom: 12 },
  section: { marginTop: 14 },
  row: { flexDirection: "row", borderBottom: "1px solid #e5e7eb", paddingVertical: 6 },
  cell: { flex: 1 },
  strong: { fontSize: 13, marginBottom: 6 },
});

export async function GET(request: NextRequest) {
  const user = await requireUser();
  const where = transactionWhereFromParams(request.nextUrl.searchParams, user.householdId);
  const [transactions, totals] = await Promise.all([
    prisma.transaction.findMany({
      where,
      select: {
        id: true,
        type: true,
        amount: true,
        date: true,
        category: { select: { name: true } },
        addedBy: { select: { displayName: true } },
      },
      orderBy: { date: "desc" },
      take: 80,
    }),
    prisma.transaction.groupBy({
      by: ["type"],
      where,
      _sum: { amount: true },
    }),
  ]);
  const income = totals.filter((item) => item.type === "income").reduce((sum, item) => sum + toNumber(item._sum.amount), 0);
  const expenses = totals.filter((item) => item.type !== "income").reduce((sum, item) => sum + toNumber(item._sum.amount), 0);

  const doc = React.createElement(
    Document,
    null,
    React.createElement(
      Page,
      { size: "A4", style: styles.page },
      React.createElement(Text, { style: styles.title }, "Raport budżetu domowego"),
      React.createElement(Text, null, `Wygenerowano: ${plDate(new Date())}`),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.strong }, `Przychody: ${money(income)}   Wydatki: ${money(expenses)}   Saldo: ${money(income - expenses)}`),
      ),
      React.createElement(
        View,
        { style: styles.section },
        React.createElement(Text, { style: styles.strong }, "Ostatnie transakcje"),
        ...transactions.map((item) =>
          React.createElement(
            View,
            { style: styles.row, key: item.id },
            React.createElement(Text, { style: styles.cell }, plDate(item.date)),
            React.createElement(Text, { style: styles.cell }, item.category.name),
            React.createElement(Text, { style: styles.cell }, item.addedBy.displayName),
            React.createElement(Text, { style: styles.cell }, money(toNumber(item.amount))),
          ),
        ),
      ),
    ),
  );

  const buffer = await pdf(doc).toBuffer();
  return new Response(buffer as unknown as BodyInit, {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="raport-budzetu.pdf"`,
    },
  });
}
