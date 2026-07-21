// Next.js Instrumentation - runs on server startup
export async function register() {
  // Only run in Node.js environment (server-side)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { assertProductionEnvironment } = await import("@/lib/runtime-env");
    assertProductionEnvironment();
    console.log("[Instrumentation] Server starting up...");

    // Dynamically import to avoid bundling in edge runtime
    if (process.env.ENABLE_IN_PROCESS_CRON === "true") {
      const { initCronJobs } = await import("@/lib/cron");
      initCronJobs();
    }

    console.log("[Instrumentation] Server initialization complete");
  }
}
