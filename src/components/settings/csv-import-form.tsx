"use client";

import Papa from "papaparse";
import { useId, useState } from "react";

type CsvProfileOption = {
  value: string;
  label: string;
};

const mappingFields = [
  ["map_date", "Data"],
  ["map_amount", "Kwota"],
  ["map_description", "Opis"],
  ["map_category", "Kategoria"],
  ["map_method", "Metoda"],
  ["map_type", "Typ"],
] as const;

export function CsvImportForm({ profiles }: { profiles: CsvProfileOption[] }) {
  const fileId = useId();
  const [columns, setColumns] = useState<string[]>([]);

  async function detectColumns(file?: File) {
    if (!file) {
      setColumns([]);
      return;
    }
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string | undefined>>(text, { header: true, preview: 1, skipEmptyLines: true });
    setColumns(parsed.meta.fields?.filter(Boolean) ?? []);
  }

  return (
    <form action="/api/import/csv" method="post" encType="multipart/form-data" className="grid gap-3">
      <div className="grid gap-3 lg:grid-cols-[220px_1fr_auto_auto]">
        <select name="profile" className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950" defaultValue="auto">
          {profiles.map((profile) => (
            <option key={profile.value} value={profile.value}>
              {profile.label}
            </option>
          ))}
        </select>
        <input
          id={fileId}
          name="file"
          type="file"
          accept=".csv,text/csv"
          required
          onChange={(event) => detectColumns(event.currentTarget.files?.[0])}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-950"
        />
        <button name="mode" value="preview" className="rounded-md bg-slate-950 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-slate-950">Podgląd</button>
        <button name="mode" value="import" className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-800">Importuj od razu</button>
      </div>

      {columns.length ? (
        <div className="grid gap-3 rounded-md border border-slate-100 p-3 dark:border-slate-800 md:grid-cols-2 xl:grid-cols-3">
          {mappingFields.map(([name, label]) => (
            <label key={name} className="grid gap-1 text-sm">
              <span className="text-slate-500">{label}</span>
              <select name={name} className="rounded-md border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-950" defaultValue="">
                <option value="">Automatycznie</option>
                {columns.map((column) => (
                  <option key={column} value={column}>
                    {column}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
    </form>
  );
}
