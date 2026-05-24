import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function markBankConnectionsSynced(where: Prisma.BankConnectionWhereInput) {
  const now = new Date();
  const connections = await prisma.bankConnection.findMany({
    where,
    select: {
      id: true,
      provider: true,
      consentExpiresAt: true,
    },
  });

  const summary = {
    checked: connections.length,
    synced: 0,
    needsProvider: 0,
    expired: 0,
  };

  for (const connection of connections) {
    if (connection.consentExpiresAt && connection.consentExpiresAt < now) {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: {
          status: "expired",
          errorMessage: "Zgoda bankowa wygasła. Odnów połączenie, gdy dostawca PSD2 będzie skonfigurowany.",
        },
      });
      summary.expired += 1;
      continue;
    }

    if (connection.provider !== "csv_only") {
      await prisma.bankConnection.update({
        where: { id: connection.id },
        data: {
          status: "error",
          errorMessage: "Automatyczna synchronizacja PSD2 wymaga podłączenia konkretnego dostawcy i kluczy API.",
        },
      });
      summary.needsProvider += 1;
      continue;
    }

    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: now,
        errorMessage: null,
      },
    });
    summary.synced += 1;
  }

  return summary;
}
