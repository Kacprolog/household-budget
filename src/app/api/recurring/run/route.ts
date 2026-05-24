import { NextRequest, NextResponse } from "next/server";
import { runRecurringTransactions } from "@/lib/actions";

function isAuthorized(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const userAgent = request.headers.get("user-agent");
  return userAgent === "vercel-cron/1.0" || !process.env.CRON_SECRET || authHeader === `Bearer ${process.env.CRON_SECRET}`;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runRecurringTransactions();
  return NextResponse.json({ ok: true, ...result });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
