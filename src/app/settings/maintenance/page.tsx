import { ExternalLink, ShieldCheck, Trash2 } from "lucide-react";
import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmSubmitButton } from "@/components/ui/confirm-submit-button";
import { cleanupDemoTransactions } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { plDate } from "@/lib/utils";

const repo = "Kacprolog/household-budget";
const productionUrl = "https://household-budget-gray.vercel.app";

type WorkflowRun = {
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  display_title: string;
};

async function latestWorkflowRun(workflow: string) {
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/${workflow}/runs?per_page=1`, {
      next: { revalidate: 300 },
      headers: { "Accept": "application/vnd.github+json" },
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { workflow_runs?: WorkflowRun[] };
    return data.workflow_runs?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function MaintenancePage() {
  const user = await requireUser();
  const [backupRun, deployRun, demoCount] = await Promise.all([
    latestWorkflowRun("database-backup.yml"),
    latestWorkflowRun("vercel-production.yml"),
    prisma.transaction.count({
      where: { householdId: user.householdId, id: { startsWith: "sample-" }, deletedAt: null },
    }),
  ]);

  return (
    <AppFrame title="Utrzymanie">
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Produkcja</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="text-green-700">Oficjalny URL</Badge>
              <a className="inline-flex items-center gap-1 text-sm font-medium text-blue-600" href={productionUrl} target="_blank">
                {productionUrl}<ExternalLink className="h-4 w-4" />
              </a>
            </div>
            <div className="text-sm text-slate-500">
              Własna domena nie jest wymagana; obecny alias Vercel jest ustawiony jako oficjalny adres aplikacji.
            </div>
            <div className="rounded-md border border-slate-100 p-3 text-sm dark:border-slate-800">
              <div className="font-medium">Deploy</div>
              <WorkflowStatus run={deployRun} fallback="Brak danych o deployu" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Backup bazy</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              Harmonogram: niedziela, 03:15 UTC. Retencja artifactu: 30 dni.
            </div>
            <div className="rounded-md border border-slate-100 p-3 text-sm dark:border-slate-800">
              <div className="font-medium">Ostatni backup</div>
              <WorkflowStatus run={backupRun} fallback="Brak danych o backupie" />
            </div>
            <Button asChild variant="outline" size="sm">
              <a href={`https://github.com/${repo}/actions/workflows/database-backup.yml`} target="_blank">
                Otwórz backupy <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Dane demo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-slate-500">
              Aktywne przykładowe transakcje z seeda: {demoCount}. Gdy zaczniecie używać aplikacji realnie, można je ukryć soft-delete.
            </p>
            <form action={cleanupDemoTransactions}>
              <ConfirmSubmitButton variant="destructive" disabled={demoCount === 0} message="Ukryć wszystkie przykładowe transakcje demo? Te wpisy zostaną oznaczone jako usunięte.">
                <Trash2 className="h-4 w-4" />
                Usuń dane demo
              </ConfirmSubmitButton>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Bezpieczeństwo kont</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-slate-500">
            <p>
              Hasła tymczasowe powinny być zmienione ręcznie przez każdego użytkownika w Ustawienia → Konto.
              Aplikacja nie zna jawnych haseł po zmianie, zapisuje wyłącznie hash bcrypt.
            </p>
            <Badge className={user.mustChangePassword ? "text-amber-700" : "text-green-700"}>
              {user.mustChangePassword ? "Twoje konto wymaga zmiany hasła" : "Twoje konto ma zmienione hasło"}
            </Badge>
            <Button asChild variant="outline" size="sm"><a href="/settings/account">Przejdź do konta</a></Button>
          </CardContent>
        </Card>
      </div>
    </AppFrame>
  );
}

function WorkflowStatus({ run, fallback }: { run: WorkflowRun | null; fallback: string }) {
  if (!run) return <div className="mt-1 text-slate-500">{fallback}</div>;
  const ok = run.conclusion === "success";
  const pending = run.status !== "completed";
  return (
    <div className="mt-2 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={ok ? "text-green-700" : pending ? "text-amber-700" : "text-red-700"}>
          {pending ? "W toku" : ok ? "OK" : "Błąd"}
        </Badge>
        <span className="text-slate-500">Aktualizacja: {plDate(run.updated_at)}</span>
      </div>
      <a className="inline-flex items-center gap-1 text-blue-600" href={run.html_url} target="_blank">
        {run.display_title}<ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
