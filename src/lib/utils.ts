import { clsx, type ClassValue } from "clsx";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear } from "date-fns";
import { pl } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function money(value: number | string) {
  return new Intl.NumberFormat("pl-PL", {
    style: "currency",
    currency: "PLN",
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function percent(value: number) {
  return new Intl.NumberFormat("pl-PL", {
    style: "percent",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);
}

export function plDate(date: Date | string) {
  return format(new Date(date), "dd.MM.yyyy", { locale: pl });
}

export function monthKey(date: Date) {
  return format(date, "yyyy-MM");
}

export function rangeFromPreset(preset?: string, from?: string | null, to?: string | null) {
  const now = new Date();
  if (preset === "custom" && from && to) {
    return { from: new Date(`${from}T00:00:00`), to: new Date(`${to}T23:59:59`) };
  }
  if (preset === "previous") {
    const previous = subMonths(now, 1);
    return { from: startOfMonth(previous), to: endOfMonth(previous) };
  }
  if (preset === "3m") return { from: startOfMonth(subMonths(now, 2)), to: endOfMonth(now) };
  if (preset === "6m") return { from: startOfMonth(subMonths(now, 5)), to: endOfMonth(now) };
  if (preset === "year") return { from: startOfYear(now), to: endOfMonth(now) };
  if (preset === "all") return { from: new Date("2000-01-01"), to: endOfMonth(now) };
  return { from: startOfMonth(now), to: endOfMonth(now) };
}

export function toNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (value && typeof value === "object" && "toNumber" in value && typeof value.toNumber === "function") {
    return value.toNumber();
  }
  return Number(value ?? 0);
}

export function nextRunDate(date: Date, frequency: "weekly" | "monthly" | "yearly") {
  const next = new Date(date);
  if (frequency === "weekly") next.setDate(next.getDate() + 7);
  if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
  if (frequency === "yearly") next.setFullYear(next.getFullYear() + 1);
  return next;
}
