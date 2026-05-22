import { AppFrame } from "@/components/app/app-frame";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPaymentMethod } from "@/lib/actions";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

export default async function PaymentMethodsPage() {
  const user = await requireUser();
  const methods = await prisma.paymentMethod.findMany({ where: { householdId: user.householdId }, orderBy: { name: "asc" } });
  return (
    <AppFrame title="Metody płatności">
      <Card>
        <CardHeader><CardTitle>Dodaj lub edytuj metodę</CardTitle></CardHeader>
        <CardContent>
          <form action={createPaymentMethod} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <div className="space-y-2"><Label htmlFor="name">Nazwa</Label><Input id="name" name="name" required /></div>
            <div className="space-y-2"><Label htmlFor="icon">Ikona lucide</Label><Input id="icon" name="icon" defaultValue="Wallet" /></div>
            <div className="flex items-end"><Button type="submit">Zapisz</Button></div>
          </form>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardContent className="divide-y divide-slate-100 pt-4 dark:divide-slate-800">
          {methods.map((method) => (
            <div key={method.id} className="flex justify-between py-3"><span>{method.name}</span><span className="text-sm text-slate-500">{method.icon}</span></div>
          ))}
        </CardContent>
      </Card>
    </AppFrame>
  );
}
