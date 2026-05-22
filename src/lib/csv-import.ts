import { createHash } from "node:crypto";

export type CsvProfile = "auto" | "mbank" | "pko" | "ing" | "santander" | "millennium" | "alior" | "pekao" | "revolut";

export type NormalizedCsvTransaction = {
  date: string;
  type: "income" | "expense";
  amount: number;
  categoryName: string;
  methodName: string;
  description: string | null;
  externalId: string;
};

type CsvRow = Record<string, string | undefined>;

const profileColumns: Record<CsvProfile, Partial<Record<"date" | "amount" | "description" | "category" | "method" | "type", string[]>>> = {
  auto: {},
  mbank: {
    date: ["Data operacji", "Data księgowania", "data"],
    amount: ["Kwota", "kwota"],
    description: ["Opis operacji", "Tytuł", "opis"],
  },
  pko: {
    date: ["Data transakcji", "Data waluty", "data"],
    amount: ["Kwota", "kwota"],
    description: ["Opis transakcji", "Nadawca / odbiorca", "opis"],
  },
  ing: {
    date: ["Data transakcji", "Data księgowania", "data"],
    amount: ["Kwota transakcji", "Kwota", "kwota"],
    description: ["Dane kontrahenta", "Tytuł", "Opis", "opis"],
  },
  santander: {
    date: ["Data operacji", "Data księgowania", "data"],
    amount: ["Kwota", "kwota"],
    description: ["Opis operacji", "opis"],
  },
  millennium: {
    date: ["Data operacji", "Data księgowania", "data"],
    amount: ["Kwota", "kwota"],
    description: ["Opis", "opis"],
  },
  alior: {
    date: ["Data operacji", "Data księgowania", "data"],
    amount: ["Kwota", "kwota"],
    description: ["Opis operacji", "opis"],
  },
  pekao: {
    date: ["Data operacji", "Data księgowania", "data"],
    amount: ["Kwota", "kwota"],
    description: ["Opis operacji", "opis"],
  },
  revolut: {
    date: ["Started Date", "Completed Date", "Date", "data"],
    amount: ["Amount", "kwota"],
    description: ["Description", "Reference", "opis"],
    type: ["Type", "typ"],
  },
};

export const csvProfiles: { value: CsvProfile; label: string }[] = [
  { value: "auto", label: "Automatycznie" },
  { value: "mbank", label: "mBank" },
  { value: "pko", label: "PKO BP / Inteligo" },
  { value: "ing", label: "ING" },
  { value: "santander", label: "Santander" },
  { value: "millennium", label: "Millennium" },
  { value: "alior", label: "Alior" },
  { value: "pekao", label: "Pekao" },
  { value: "revolut", label: "Revolut" },
];

export function normalizeCsvRow(row: CsvRow, profile: CsvProfile): NormalizedCsvTransaction | null {
  const date = normalizeDate(pick(row, profile, "date") ?? row.data ?? row.date);
  const rawAmount = pick(row, profile, "amount") ?? row.kwota ?? row.amount;
  const amount = parseAmount(rawAmount);
  if (!date || !amount) return null;

  const rawType = (pick(row, profile, "type") ?? row.typ ?? row.type ?? "").toLowerCase();
  const type = rawType.includes("income") || rawType.includes("przych") || amount > 0 ? "income" : "expense";
  const description = cleanText(pick(row, profile, "description") ?? row.opis ?? row.description ?? row.tytul ?? row["Tytuł"]);
  const categoryName = cleanText(pick(row, profile, "category") ?? row.kategoria ?? row.category) ?? "";
  const methodName = cleanText(pick(row, profile, "method") ?? row.metoda ?? row.method) ?? "";
  const absoluteAmount = Math.abs(amount);
  const externalId = fingerprint([profile, date, absoluteAmount.toFixed(2), description ?? "", categoryName, methodName]);

  return {
    date,
    type,
    amount: absoluteAmount,
    categoryName,
    methodName,
    description,
    externalId,
  };
}

function pick(row: CsvRow, profile: CsvProfile, field: "date" | "amount" | "description" | "category" | "method" | "type") {
  const names = [...(profileColumns[profile][field] ?? []), ...(profileColumns.auto[field] ?? [])];
  for (const name of names) {
    const value = row[name] ?? row[name.toLowerCase()] ?? row[name.toUpperCase()];
    if (value) return value;
  }
  return undefined;
}

function parseAmount(value?: string) {
  if (!value) return 0;
  const normalized = value
    .replace(/\s/g, "")
    .replace("zł", "")
    .replace("PLN", "")
    .replace(",", ".");
  return Number(normalized);
}

function normalizeDate(value?: string) {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
  const match = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})/);
  if (!match) return null;
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function cleanText(value?: string) {
  const text = value?.replace(/\s+/g, " ").trim();
  return text || null;
}

function fingerprint(parts: string[]) {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 48);
}
