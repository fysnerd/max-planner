import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { watchedRoutes, stations, trainSnapshots } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  const routes = db
    .select({
      id: watchedRoutes.id,
      originCode: watchedRoutes.originCode,
      destinationCode: watchedRoutes.destinationCode,
      label: watchedRoutes.label,
      daysOfWeek: watchedRoutes.daysOfWeek,
      departureTimeMin: watchedRoutes.departureTimeMin,
      departureTimeMax: watchedRoutes.departureTimeMax,
      alertThreshold: watchedRoutes.alertThreshold,
      isActive: watchedRoutes.isActive,
      createdAt: watchedRoutes.createdAt,
      originName: sql<string>`(SELECT name FROM stations WHERE code = ${watchedRoutes.originCode})`,
      destinationName: sql<string>`(SELECT name FROM stations WHERE code = ${watchedRoutes.destinationCode})`,
    })
    .from(watchedRoutes)
    .all();

  return NextResponse.json(routes);
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const {
    originCode,
    destinationCode,
    label,
    daysOfWeek,
    departureTimeMin,
    departureTimeMax,
    alertThreshold,
  } = body;

  if (!originCode || !destinationCode || !label) {
    return NextResponse.json(
      { error: "originCode, destinationCode, and label are required" },
      { status: 400 }
    );
  }

  const route = db
    .insert(watchedRoutes)
    .values({
      originCode,
      destinationCode,
      label,
      daysOfWeek: JSON.stringify(daysOfWeek || []),
      departureTimeMin: departureTimeMin || "00:00",
      departureTimeMax: departureTimeMax || "23:59",
      alertThreshold: alertThreshold ?? 20,
    })
    .returning()
    .get();

  return NextResponse.json(route, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  if (updates.daysOfWeek) {
    updates.daysOfWeek = JSON.stringify(updates.daysOfWeek);
  }

  db.update(watchedRoutes).set(updates).where(eq(watchedRoutes.id, id)).run();

  const updated = db
    .select()
    .from(watchedRoutes)
    .where(eq(watchedRoutes.id, id))
    .get();

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  db.delete(trainSnapshots).where(eq(trainSnapshots.routeId, id)).run();
  db.delete(watchedRoutes).where(eq(watchedRoutes.id, id)).run();

  return NextResponse.json({ ok: true });
}
