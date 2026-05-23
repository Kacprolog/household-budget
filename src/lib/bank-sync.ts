import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function markBankConnectionsSynced(where: Prisma.BankConnectionWhereInput) {
  const connections = await prisma.bankConnection.findMany({ where });

  for (const connection of connections) {
    await prisma.bankConnection.update({
      where: { id: connection.id },
      data: {
        lastSyncedAt: new Date(),
        errorMessage:
          connection.provider === "csv_only"
            ? null
            : "Synchronizacja PSD2 czeka na klucze API i implementację konkretnego dostawcy.",
      },
    });
  }

  return connections.length;
}
