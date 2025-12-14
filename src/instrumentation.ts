// Next.js Instrumentation - runs on server startup
export async function register() {
  // Only run in Node.js environment (server-side)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[Instrumentation] Server starting up...");

    // Dynamically import to avoid bundling in edge runtime
    const { initCronJobs } = await import("@/lib/cron");

    // Initialize cron jobs
    initCronJobs();

    console.log("[Instrumentation] Server initialization complete");
  }
}
