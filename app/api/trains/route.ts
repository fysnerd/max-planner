import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { trainSnapshots, watchedRoutes } from "@/lib/db/schema";
import { eq, asc, desc, and, gte, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const routeId = req.nextUrl.searchParams.get("routeId");
  const date = req.nextUrl.searchParams.get("date"); // YYYY-MM-DD
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "200");

  const now = new Date().toISOString();

  const conditions = [gte(trainSnapshots.departureTime, now)];

  if (routeId) {
    conditions.push(eq(trainSnapshots.routeId, parseInt(routeId)));
  }

  if (date) {
    conditions.push(
      sql`date(${trainSnapshots.departureTime}) = ${date}`
    );
  }

  const trains = db
    .select({
      id: trainSnapshots.id,
      routeId: trainSnapshots.routeId,
      trainNumber: trainSnapshots.trainNumber,
      trainType: trainSnapshots.trainType,
      departureTime: trainSnapshots.departureTime,
      arrivalTime: trainSnapshots.arrivalTime,
      seatsAvailable: trainSnapshots.seatsAvailable,
      fetchedAt: trainSnapshots.fetchedAt,
      routeLabel: watchedRoutes.label,
      originCode: watchedRoutes.originCode,
      destinationCode: watchedRoutes.destinationCode,
      originName: sql<string>`(SELECT name FROM stations WHERE code = ${watchedRoutes.originCode})`,
      destinationName: sql<string>`(SELECT name FROM stations WHERE code = ${watchedRoutes.destinationCode})`,
      alertThreshold: watchedRoutes.alertThreshold,
    })
    .from(trainSnapshots)
    .innerJoin(watchedRoutes, eq(trainSnapshots.routeId, watchedRoutes.id))
    .where(and(...conditions))
    .orderBy(asc(trainSnapshots.seatsAvailable))
    .limit(limit)
    .all();

  return NextResponse.json(trains);
}
