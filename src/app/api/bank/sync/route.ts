import { NextRequest, NextResponse } from "next/server";
import { markBankConnectionsSynced } from "@/lib/bank-sync";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const userAgent = request.headers.get("user-agent");
  if (userAgent !== "vercel-cron/1.0" && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await markBankConnectionsSynced({ status: { in: ["connected", "draft", "error"] } });

  return NextResponse.json({ ok: true, ...result });
}
