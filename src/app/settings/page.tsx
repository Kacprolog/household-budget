import Link from "next/link";
import { AppFrame } from "@/components/app/app-frame";
import { CsvImportForm } from "@/components/settings/csv-import-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { csvProfiles } from "@/lib/csv-import";

const items = [
  ["Konto", "/settings/account", "Nazwa wyświetlana, kolor i zmiana hasła."],
  ["Kategorie", "/settings/categories", "Lista kategorii przychodów i wydatków."],
  ["Reguły", "/settings/rules", "Automatyczna kategoryzacja opisów i merchantów."],
  ["Metody płatności", "/settings/payment-methods", "Gotówka, karta, przelew, BLIK i własne metody."],
  ["Banki", "/settings/banks", "PSD2/Open Banking i status synchronizacji."],
  ["Utrzymanie", "/settings/maintenance", "Backupy, URL produkcyjny, deploy i dane demo."],
  ["Aktywność", "/settings/activity", "Historia zmian w budżecie i ustawieniach."],
];

export default function SettingsPage() {
  return (
    <AppFrame title="Ustawienia">
      <div className="grid gap-4 md:grid-cols-4 xl:grid-cols-5">
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
          <CsvImportForm profiles={csvProfiles} />
          <p className="mt-2 text-sm text-slate-500">Obsługiwane kolumny: data, typ, kwota, kategoria, metoda, opis. Domyślnie zobaczysz podgląd 50 pierwszych wierszy i raport duplikatów przed zapisem.</p>
        </CardContent>
      </Card>
    </AppFrame>
  );
}
