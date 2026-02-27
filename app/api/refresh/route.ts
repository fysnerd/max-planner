import { NextResponse } from "next/server";
import { runPoll } from "@/lib/cron/poller";

export async function POST() {
  try {
    await runPoll();
    return NextResponse.json({ ok: true, message: "Refresh completed" });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
