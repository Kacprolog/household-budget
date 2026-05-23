import { Prisma } from "@prisma/client";

type AuditWriter = Prisma.TransactionClient | typeof import("@/lib/prisma").prisma;

type AuditInput = {
  householdId: string;
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export async function writeAudit(writer: AuditWriter, input: AuditInput) {
  await writer.auditLog.create({
    data: {
      householdId: input.householdId,
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      summary: input.summary,
      metadata: input.metadata ?? undefined,
    },
  });
}
