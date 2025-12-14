import { NextRequest, NextResponse } from "next/server";
import { initCronJobs, getCronStatus, processReminders } from "@/lib/cron";

// Initialize cron jobs when this endpoint is first called
let initialized = false;

function ensureCronInitialized() {
  if (!initialized) {
    initCronJobs();
    initialized = true;
  }
}

// GET /api/cron/status - Check cron job status
export async function GET() {
  ensureCronInitialized();

  const status = getCronStatus();

  return NextResponse.json({
    success: true,
    ...status,
    message: "Cron jobs are running",
  });
}

// POST /api/cron/status - Manually trigger reminder processing
export async function POST(request: NextRequest) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  ensureCronInitialized();

  console.log("[Cron] Manual trigger requested");
  const result = await processReminders();

  return NextResponse.json({
    success: true,
    message: "Reminders processed manually",
    result,
  });
}
