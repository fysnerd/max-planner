import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stations } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") || "";

  // SQLite LIKE is case-insensitive for ASCII but not for unicode.
  // Use lower() for accent-agnostic matching.
  const results = q
    ? db
        .select()
        .from(stations)
        .where(
          sql`lower(${stations.name}) LIKE lower(${`%${q}%`}) OR lower(${stations.code}) LIKE lower(${`%${q}%`})`
        )
        .limit(20)
        .all()
    : db.select().from(stations).orderBy(stations.name).all();

  return NextResponse.json(results);
}
