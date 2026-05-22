import { NextRequest, NextResponse } from "next/server";
import { runRecurringTransactions } from "@/lib/actions";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await runRecurringTransactions();
  return NextResponse.json({ ok: true });
}
