import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bookings } from "@/lib/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const weekStart = req.nextUrl.searchParams.get("weekStart");

  let monday: Date;
  if (weekStart) {
    monday = new Date(weekStart + "T00:00:00");
  } else {
    // Default: next week's Monday
    const now = new Date();
    const day = now.getDay(); // 0=Sun
    const diff = day === 0 ? 1 : 8 - day;
    monday = new Date(now);
    monday.setDate(now.getDate() + diff);
    monday.setHours(0, 0, 0, 0);
  }

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);

  const result = db
    .select({
      id: bookings.id,
      trainNumber: bookings.trainNumber,
      departureTime: bookings.departureTime,
      arrivalTime: bookings.arrivalTime,
      originCode: bookings.originCode,
      destinationCode: bookings.destinationCode,
      routeId: bookings.routeId,
      bookedAt: bookings.bookedAt,
      originName: sql<string>`(SELECT name FROM stations WHERE code = ${bookings.originCode})`,
      destinationName: sql<string>`(SELECT name FROM stations WHERE code = ${bookings.destinationCode})`,
    })
    .from(bookings)
    .where(
      and(
        gte(bookings.departureTime, monday.toISOString()),
        lt(bookings.departureTime, sunday.toISOString())
      )
    )
    .all();

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { trainNumber, departureTime, arrivalTime, originCode, destinationCode, routeId } = body;

  if (!trainNumber || !departureTime || !arrivalTime || !originCode || !destinationCode) {
    return NextResponse.json(
      { error: "trainNumber, departureTime, arrivalTime, originCode, destinationCode are required" },
      { status: 400 }
    );
  }

  // Check for duplicate
  const existing = db
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.trainNumber, trainNumber),
        eq(bookings.departureTime, departureTime)
      )
    )
    .get();

  if (existing) {
    return NextResponse.json({ error: "Already booked" }, { status: 409 });
  }

  const booking = db
    .insert(bookings)
    .values({
      trainNumber,
      departureTime,
      arrivalTime,
      originCode,
      destinationCode,
      routeId: routeId || null,
    })
    .returning()
    .get();

  return NextResponse.json(booking, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  db.delete(bookings).where(eq(bookings.id, id)).run();

  return NextResponse.json({ ok: true });
}
