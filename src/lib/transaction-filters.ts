import { TransactionType, type Prisma } from "@prisma/client";

type FilterInput = URLSearchParams | Record<string, string | undefined>;

const transactionTypes = new Set<string>(Object.values(TransactionType));

function readParam(params: FilterInput, key: string) {
  if (params instanceof URLSearchParams) return params.get(key) ?? undefined;
  return params[key];
}

function dayStart(value: string) {
  return new Date(`${value}T00:00:00`);
}

function dayEnd(value: string) {
  return new Date(`${value}T23:59:59`);
}

export function transactionWhereFromParams(params: FilterInput, householdId: string): Prisma.TransactionWhereInput {
  const deleted = readParam(params, "deleted");
  const type = readParam(params, "type");
  const from = readParam(params, "from");
  const to = readParam(params, "to");
  const q = readParam(params, "q")?.trim();

  return {
    householdId,
    ...(deleted === "all" ? {} : deleted === "only" ? { deletedAt: { not: null } } : { deletedAt: null }),
    ...(type && transactionTypes.has(type) ? { type: type as TransactionType } : {}),
    ...(readParam(params, "categoryId") ? { categoryId: readParam(params, "categoryId") } : {}),
    ...(readParam(params, "addedById") ? { addedById: readParam(params, "addedById") } : {}),
    ...(readParam(params, "paymentMethodId") ? { paymentMethodId: readParam(params, "paymentMethodId") } : {}),
    ...(from || to
      ? {
          date: {
            ...(from ? { gte: dayStart(from) } : {}),
            ...(to ? { lte: dayEnd(to) } : {}),
          },
        }
      : {}),
    ...(q ? { description: { contains: q, mode: "insensitive" } } : {}),
  };
}
