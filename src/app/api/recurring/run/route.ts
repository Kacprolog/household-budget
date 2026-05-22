import { NextRequest, NextResponse } from "next/server";
import { runRecurringTransactions } from "@/lib/actions";

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  return !process.env.CRON_SECRET || authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await runRecurringTransactions();
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
