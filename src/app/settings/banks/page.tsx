import { Building2, Power, RefreshCw } from "lucide-react";
import { AppFrame } from "@/components/app/app-frame";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBankConnection, disableBankConnection, syncBankConnections } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { money, plDate, toNumber } from "@/lib/utils";

const providers = [
  ["kontomatik", "Kontomatik"],
  ["fizen", "Fizen"],
  ["enable_banking", "Enable Banking"],
  ["neonomics", "Neonomics"],
  ["salt_edge", "Salt Edge"],
  ["gocardless", "GoCardless"],
  ["csv_only", "Tylko CSV"],
] as const;

const statusLabels: Record<string, string> = {
  draft: "Do konfiguracji",
  connected: "Połączone",
  expired: "Zgoda wygasła",
  error: "Błąd",
  disabled: "Wyłączone",
};

export default async function BanksPage() {
  const user = await requireUser();
  const connections = await prisma.bankConnection.findMany({
    where: { householdId: user.householdId },
    include: { accounts: { include: { transactions: { orderBy: { bookedAt: "desc" }, take: 5 } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AppFrame title="Banki">
      <Card>
        <CardHeader>
          <CardTitle>Dodaj źródło danych bankowych</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBankConnection} className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="provider">Dostawca</Label>
              <select id="provider" name="provider" className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950" defaultValue="kontomatik">
                {providers.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="displayName">Nazwa</Label>
              <Input id="displayName" name="displayName" placeholder="np. Konto wspólne, mBank Kacper" required />
            </div>
            <div className="flex items-end">
              <Button type="submit">Dodaj</Button>
            </div>
          </form>
          <p className="mt-3 text-sm text-slate-500">
            Ten ekran jest przygotowany pod PSD2/Open Banking. Do czasu podpięcia kluczy dostawcy realne dane można importować przez CSV z deduplikacją.
          </p>
        </CardContent>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {connections.map((connection) => (
          <Card key={connection.id}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {connection.displayName}
                </CardTitle>
                <Badge>{statusLabels[connection.status]}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2 text-sm text-slate-500">
                <div>Dostawca: {providerLabel(connection.provider)}</div>
                <div>Ostatnia synchronizacja: {connection.lastSyncedAt ? plDate(connection.lastSyncedAt) : "brak"}</div>
                <div>Zgoda ważna do: {connection.consentExpiresAt ? plDate(connection.consentExpiresAt) : "brak"}</div>
                {connection.errorMessage ? <div className="text-amber-600">{connection.errorMessage}</div> : null}
              </div>
              {connection.accounts.length ? (
                <div className="space-y-3">
                  {connection.accounts.map((account) => (
                    <div key={account.id} className="rounded-md border border-slate-100 p-3 dark:border-slate-800">
                      <div className="flex justify-between gap-3">
                        <span className="font-medium">{account.name}</span>
                        <span>{account.balance == null ? "-" : money(toNumber(account.balance))}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">{account.ibanMasked ?? "brak IBAN"} · transakcje: {account.transactions.length}</div>
                    </div>
                  ))}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-2">
                <form action={syncBankConnections}>
                  <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4" /> Synchronizuj</Button>
                </form>
                <form action={disableBankConnection}>
                  <input type="hidden" name="id" value={connection.id} />
                  <Button variant="outline" size="sm"><Power className="h-4 w-4" /> Wyłącz</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppFrame>
  );
}

function providerLabel(provider: string) {
  return providers.find(([value]) => value === provider)?.[1] ?? provider;
}
