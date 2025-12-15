// Cron Job Scheduler using node-cron
import cron from "node-cron";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const CRON_SECRET = process.env.CRON_SECRET;

// Track if cron is already initialized (prevent duplicate scheduling)
let isInitialized = false;

// Process reminders by calling the API endpoint
async function processReminders() {
  console.log(`[Cron] Starting reminder processing at ${new Date().toISOString()}`);

  try {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Add auth header if CRON_SECRET is configured
    if (CRON_SECRET) {
      headers["Authorization"] = `Bearer ${CRON_SECRET}`;
    }

    const response = await fetch(`${APP_URL}/api/cron/reminders`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`[Cron] Reminder processing completed:`, {
      total: result.total,
      sms: result.sms,
      email: result.email,
      call: result.call,
    });

    return result;
  } catch (error) {
    console.error("[Cron] Error processing reminders:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// Initialize the cron scheduler
export function initCronJobs() {
  if (isInitialized) {
    console.log("[Cron] Already initialized, skipping...");
    return;
  }

  console.log("[Cron] Initializing cron jobs...");

  // Run every hour at minute 0
  // Format: minute hour day-of-month month day-of-week
  const reminderJob = cron.schedule("0 * * * *", async () => {
    console.log("[Cron] Hourly reminder job triggered");
    await processReminders();
  });

  // Also run immediately on startup (after a small delay to ensure server is ready)
  setTimeout(async () => {
    console.log("[Cron] Running initial reminder check on startup...");
    await processReminders();
  }, 5000);

  isInitialized = true;
  console.log("[Cron] Cron jobs initialized successfully");

  return reminderJob;
}

// Stop all cron jobs
export function stopCronJobs() {
  cron.getTasks().forEach((task) => {
    task.stop();
  });
  isInitialized = false;
  console.log("[Cron] All cron jobs stopped");
}

// Get cron status
export function getCronStatus() {
  return {
    initialized: isInitialized,
    tasks: cron.getTasks().size,
    timezone: process.env.TZ || "America/New_York",
  };
}

// Export for manual triggering
export { processReminders };
