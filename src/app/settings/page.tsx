import Link from "next/link";
import { AppFrame } from "@/components/app/app-frame";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { csvProfiles } from "@/lib/csv-import";

const items = [
  ["Konto", "/settings/account", "Nazwa wyświetlana, kolor i zmiana hasła."],
  ["Kategorie", "/settings/categories", "Lista kategorii przychodów i wydatków."],
  ["Metody płatności", "/settings/payment-methods", "Gotówka, karta, przelew, BLIK i własne metody."],
  ["Banki", "/settings/banks", "PSD2/Open Banking i status synchronizacji."],
];

export default function SettingsPage() {
  return (
    <AppFrame title="Ustawienia">
      <div className="grid gap-4 md:grid-cols-4">
        {items.map(([title, href, description]) => (
          <Link key={href} href={href}>
            <Card className="h-full transition hover:-translate-y-0.5 hover:shadow-md">
              <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
              <CardContent className="text-sm text-slate-500">{description}</CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <Card id="csv" className="mt-4">
        <CardHeader><CardTitle>Import CSV</CardTitle></CardHeader>
        <CardContent>
          <form action="/api/import/csv" method="post" encType="multipart/form-data" className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
            <select name="profile" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950" defaultValue="auto">
              {csvProfiles.map((profile) => (
                <option key={profile.value} value={profile.value}>
                  {profile.label}
                </option>
              ))}
            </select>
            <input name="file" type="file" accept=".csv,text/csv" required className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950" />
            <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950">Importuj</button>
          </form>
          <p className="mt-2 text-sm text-slate-500">Obsługiwane kolumny: data, typ, kwota, kategoria, metoda, opis. Import ma deduplikację i profile banków.</p>
        </CardContent>
      </Card>
    </AppFrame>
  );
}
