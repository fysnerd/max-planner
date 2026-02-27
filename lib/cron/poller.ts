import { db } from "@/lib/db";
import { watchedRoutes, trainSnapshots, pollLogs } from "@/lib/db/schema";
import { fetchTrainsRaw } from "@/lib/sncf/client";
import { getDatesForDaysOfWeek } from "@/lib/utils";
import { eq, and, lt, sql } from "drizzle-orm";

let isPolling = false;

/** Delay between sequential fetches (Camoufox opens a full browser each time). */
const FETCH_DELAY_MS = 2000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runPoll(): Promise<void> {
  if (isPolling) {
    console.log("[Poller] Already polling, skipping...");
    return;
  }

  isPolling = true;
  const startedAt = new Date().toISOString();

  const logEntry = db
    .insert(pollLogs)
    .values({ startedAt, status: "running" })
    .returning()
    .get();

  let routesPolled = 0;
  let trainsFound = 0;

  try {
    const routes = db
      .select()
      .from(watchedRoutes)
      .where(eq(watchedRoutes.isActive, true))
      .all();

    if (routes.length === 0) {
      console.log("[Poller] No active routes to poll.");
      db.update(pollLogs)
        .set({
          completedAt: new Date().toISOString(),
          status: "completed",
          routesPolled: 0,
          trainsFound: 0,
        })
        .where(eq(pollLogs.id, logEntry.id))
        .run();
      isPolling = false;
      return;
    }

    // Build all fetch tasks
    const tasks: {
      route: typeof routes[0];
      date: Date;
    }[] = [];

    for (const route of routes) {
      const days: number[] = JSON.parse(route.daysOfWeek || "[]");
      if (days.length === 0) continue;
      const dates = getDatesForDaysOfWeek(days, 30);
      for (const date of dates) {
        tasks.push({ route, date });
      }
    }

    console.log(
      `[Poller] ${tasks.length} route-date combinations to fetch (sequential).`
    );

    // Process tasks SEQUENTIALLY (Camoufox opens a whole browser per call)
    for (let i = 0; i < tasks.length; i++) {
      const { route, date } = tasks[i];
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

      console.log(
        `[Poller] [${i + 1}/${tasks.length}] ${route.originCode} -> ${route.destinationCode} on ${dateStr}`
      );

      try {
        const result = await fetchTrainsRaw(
          route.originCode,
          route.destinationCode,
          dateStr
        );

        console.log(
          `[Poller]   source=${result.source}, ${result.trains.length} trains returned`
        );

        // Filter by date (API can return adjacent days), time window, and day of week
        const allowedDays: number[] = JSON.parse(route.daysOfWeek || "[]");
        const filtered = result.trains.filter((t) => {
          // Check date matches requested date (API sometimes returns neighboring days)
          const trainDate = t.departureTime.split("T")[0];
          if (trainDate !== dateStr) return false;
          // Check day of week
          const d = new Date(trainDate + "T12:00:00");
          if (!allowedDays.includes(d.getDay())) return false;
          // Check time window
          const hhmm = t.departureTime.split("T")[1]?.substring(0, 5) || "00:00";
          return hhmm >= route.departureTimeMin && hhmm <= route.departureTimeMax;
        });

        // Delete old snapshots for this route+date, then insert new
        db.delete(trainSnapshots)
          .where(
            and(
              eq(trainSnapshots.routeId, route.id),
              sql`date(${trainSnapshots.departureTime}) = ${dateStr}`
            )
          )
          .run();

        for (const train of filtered) {
          db.insert(trainSnapshots)
            .values({
              routeId: route.id,
              trainNumber: train.trainNumber,
              trainType: train.trainType,
              departureTime: train.departureTime,
              arrivalTime: train.arrivalTime,
              seatsAvailable: train.seatsAvailable,
            })
            .run();
        }

        trainsFound += filtered.length;
      } catch (err) {
        console.error(
          `[Poller]   FAILED ${route.originCode}->${route.destinationCode} ${dateStr}:`,
          err instanceof Error ? err.message : err
        );
        // Continue with next task even if one fails
      }

      routesPolled++;

      // Delay between calls (skip after the last one)
      if (i < tasks.length - 1) {
        await sleep(FETCH_DELAY_MS);
      }
    }

    // Cleanup: remove snapshots older than 7 days past departure
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 7);
    db.delete(trainSnapshots)
      .where(lt(trainSnapshots.departureTime, cutoff.toISOString()))
      .run();

    db.update(pollLogs)
      .set({
        completedAt: new Date().toISOString(),
        status: "completed",
        routesPolled,
        trainsFound,
      })
      .where(eq(pollLogs.id, logEntry.id))
      .run();

    console.log(
      `[Poller] Done: ${routesPolled} route-dates polled, ${trainsFound} trains found.`
    );
  } catch (err) {
    console.error("[Poller] Error:", err);
    db.update(pollLogs)
      .set({
        completedAt: new Date().toISOString(),
        status: "error",
        routesPolled,
        trainsFound,
        error: err instanceof Error ? err.message : String(err),
      })
      .where(eq(pollLogs.id, logEntry.id))
      .run();
  } finally {
    isPolling = false;
  }
}
