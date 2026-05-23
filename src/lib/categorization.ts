import type { CategorizationRule, Category, PaymentMethod, TransactionType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type RuleWithTargets = CategorizationRule & {
  category: Category;
  paymentMethod: PaymentMethod | null;
};

export type RuleMatchInput = {
  householdId: string;
  type: TransactionType;
  description: string | null;
};

export async function matchCategorizationRule({ householdId, type, description }: RuleMatchInput) {
  if (!description) return null;
  const normalized = description.toLowerCase();
  const rules = await prisma.categorizationRule.findMany({
    where: {
      householdId,
      isActive: true,
      OR: [{ type }, { type: null }],
    },
    include: { category: true, paymentMethod: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
  return findRuleMatch(rules, normalized);
}

export function findRuleMatch(rules: RuleWithTargets[], normalizedDescription: string) {
  return rules.find((rule) => normalizedDescription.includes(rule.phrase.toLowerCase())) ?? null;
}
