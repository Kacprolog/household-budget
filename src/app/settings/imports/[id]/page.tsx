import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, FileWarning, UploadCloud, XCircle } from "lucide-react";
import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelCsvImportBatch, confirmCsvImportBatch } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { money, plDate, toNumber } from "@/lib/utils";

const statusLabels: Record<string, string> = {
  ready: "Gotowe",
  duplicate: "Duplikat",
  invalid: "Błędne",
  imported: "Zaimportowane",
  skipped: "Pominięte",
};

export default async function ImportPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, requireUser()]);
  const batch = await prisma.importBatch.findFirst({
    where: { id, householdId: user.householdId },
    include: {
      rows: {
        orderBy: { rowIndex: "asc" },
        take: 50,
      },
    },
  });
  if (!batch) notFound();

  return (
    <AppFrame title="Podgląd importu CSV">
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{batch.filename}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <Metric label="Gotowe" value={batch.readyRows} tone="green" />
              <Metric label="Duplikaty" value={batch.duplicateRows} tone="amber" />
              <Metric label="Błędne" value={batch.invalidRows} tone="red" />
              <Metric label="Razem" value={batch.totalRows} tone="slate" />
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <Badge>{batch.profile}</Badge>
              <span>Utworzono: {plDate(batch.createdAt)}</span>
              <span>Status: {batch.status === "pending" ? "oczekuje" : batch.status}</span>
            </div>
            {batch.status === "pending" ? (
              <div className="flex flex-wrap gap-2">
                <form action={confirmCsvImportBatch}>
                  <input type="hidden" name="id" value={batch.id} />
                  <Button disabled={batch.readyRows === 0}><UploadCloud className="h-4 w-4" /> Importuj gotowe</Button>
                </form>
                <form action={cancelCsvImportBatch}>
                  <input type="hidden" name="id" value={batch.id} />
                  <Button variant="outline"><XCircle className="h-4 w-4" /> Anuluj</Button>
                </form>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pierwsze 50 wierszy</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-left text-slate-500">
                <tr>
                  <th className="py-2">#</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Typ</th>
                  <th>Kwota</th>
                  <th>Opis</th>
                  <th>Uwagi</th>
                </tr>
              </thead>
              <tbody>
                {batch.rows.map((row) => (
                  <tr key={row.id} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2">{row.rowIndex}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>{row.date ? plDate(row.date) : "-"}</td>
                    <td>{row.type === "income" ? "Przychód" : row.type === "expense" ? "Wydatek" : "-"}</td>
                    <td>{row.amount ? money(toNumber(row.amount)) : "-"}</td>
                    <td className="max-w-[260px] truncate">{row.description ?? "-"}</td>
                    <td className="max-w-[260px] text-slate-500">{row.reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </AppFrame>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: "green" | "amber" | "red" | "slate" }) {
  const colors = {
    green: "text-green-700",
    amber: "text-amber-700",
    red: "text-red-700",
    slate: "text-slate-700 dark:text-slate-200",
  };
  return (
    <div className="rounded-md border border-slate-100 p-3 dark:border-slate-800">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${colors[tone]}`}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "ready") return <Badge className="text-green-700"><CheckCircle2 className="h-3 w-3" /> {statusLabels[status]}</Badge>;
  if (status === "duplicate") return <Badge className="text-amber-700"><AlertTriangle className="h-3 w-3" /> {statusLabels[status]}</Badge>;
  if (status === "invalid") return <Badge className="text-red-700"><FileWarning className="h-3 w-3" /> {statusLabels[status]}</Badge>;
  return <Badge>{statusLabels[status] ?? status}</Badge>;
}
