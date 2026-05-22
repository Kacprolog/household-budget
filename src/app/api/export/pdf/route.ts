import React from "react";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
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

export async function GET() {
  const user = await requireUser();
  const transactions = await prisma.transaction.findMany({
    where: { householdId: user.householdId, deletedAt: null },
    include: { category: true, addedBy: true },
    orderBy: { date: "desc" },
    take: 80,
  });
  const income = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + toNumber(item.amount), 0);
  const expenses = transactions.filter((item) => item.type !== "income").reduce((sum, item) => sum + toNumber(item.amount), 0);

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
