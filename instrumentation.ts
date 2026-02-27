export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { runPoll } = await import("@/lib/cron/poller");

    console.log("[Cron] Starting poller (every 5 minutes)...");

    // Run first poll after 30s to let the server fully start
    setTimeout(() => {
      runPoll().catch(console.error);
    }, 30_000);

    // Then every 5 minutes
    cron.default.schedule("*/5 * * * *", () => {
      runPoll().catch(console.error);
    });
  }
}
