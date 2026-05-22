import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const userAgent = request.headers.get("user-agent");
  if (userAgent !== "vercel-cron/1.0" && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const connections = await prisma.bankConnection.findMany({
    where: { status: { in: ["connected", "draft"] } },
  });

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

  return NextResponse.json({ ok: true, checked: connections.length });
}
