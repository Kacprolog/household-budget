import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { Activity, Database, Settings, ShieldCheck } from "lucide-react";
import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function ActivityPage() {
  const user = await requireUser();
  const logs = await prisma.auditLog.findMany({
    where: { householdId: user.householdId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      action: true,
      entity: true,
      summary: true,
      createdAt: true,
      user: { select: { displayName: true, color: true } },
    },
  });

  return (
    <AppFrame title="Aktywność">
      <Card>
        <CardHeader>
          <CardTitle>Ostatnie zmiany</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="flex gap-3 rounded-md border border-slate-100 p-3 dark:border-slate-800">
                <div className="mt-1 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-slate-100 dark:bg-slate-900">
                  <ActivityIcon entity={log.entity} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{log.summary}</span>
                    <Badge>{actionLabel(log.action)}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>{format(log.createdAt, "dd.MM.yyyy HH:mm", { locale: pl })}</span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      {log.user?.color ? <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: log.user.color }} /> : null}
                      {log.user?.displayName ?? "System"}
                    </span>
                    <span>·</span>
                    <span>{entityLabel(log.entity)}</span>
                  </div>
                </div>
              </div>
            ))}
            {!logs.length ? <p className="py-8 text-sm text-slate-500">Brak zapisanej aktywności. Nowe zmiany zaczną pojawiać się tutaj od teraz.</p> : null}
          </div>
        </CardContent>
      </Card>
    </AppFrame>
  );
}

function ActivityIcon({ entity }: { entity: string }) {
  if (entity.includes("bank") || entity === "importBatch") return <Database className="h-4 w-4" />;
  if (entity === "user") return <ShieldCheck className="h-4 w-4" />;
  if (entity.includes("Rule") || entity === "category" || entity === "paymentMethod" || entity === "budget") return <Settings className="h-4 w-4" />;
  return <Activity className="h-4 w-4" />;
}

function actionLabel(action: string) {
  if (action.includes("create")) return "Dodanie";
  if (action.includes("update") || action.includes("upsert")) return "Zmiana";
  if (action.includes("delete")) return "Usunięcie";
  if (action.includes("restore")) return "Przywrócenie";
  if (action.includes("import")) return "Import";
  if (action.includes("sync")) return "Synchronizacja";
  return "Akcja";
}

function entityLabel(entity: string) {
  const labels: Record<string, string> = {
    transaction: "Transakcje",
    budget: "Budżety",
    goal: "Cele",
    category: "Kategorie",
    paymentMethod: "Metody płatności",
    categorizationRule: "Reguły",
    bankConnection: "Banki",
    importBatch: "Import CSV",
    user: "Konto",
  };
  return labels[entity] ?? entity;
}
