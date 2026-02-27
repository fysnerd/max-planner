export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const cron = await import("node-cron");
    const { runPoll } = await import("@/lib/cron/poller");

    console.log("[Cron] Starting poller (every 10 minutes)...");

    // Run first poll after 30s to let the server fully start
    setTimeout(() => {
      runPoll().catch(console.error);
    }, 30_000);

    // Then every 10 minutes (avoids SNCF rate-limiting with many routes)
    cron.default.schedule("*/10 * * * *", () => {
      runPoll().catch(console.error);
    });
  }
}
