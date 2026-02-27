import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const DB_PATH = path.join(process.cwd(), "data", "max-planner.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Auto-create tables on first connection
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS stations (
    code TEXT PRIMARY KEY,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS watched_routes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin_code TEXT NOT NULL REFERENCES stations(code),
    destination_code TEXT NOT NULL REFERENCES stations(code),
    label TEXT NOT NULL,
    days_of_week TEXT NOT NULL DEFAULT '[]',
    departure_time_min TEXT NOT NULL DEFAULT '00:00',
    departure_time_max TEXT NOT NULL DEFAULT '23:59',
    alert_threshold INTEGER NOT NULL DEFAULT 20,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS train_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    route_id INTEGER NOT NULL REFERENCES watched_routes(id) ON DELETE CASCADE,
    train_number TEXT NOT NULL,
    train_type TEXT,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    seats_available INTEGER NOT NULL,
    fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS poll_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'running',
    routes_polled INTEGER DEFAULT 0,
    trains_found INTEGER DEFAULT 0,
    error TEXT
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    train_number TEXT NOT NULL,
    departure_time TEXT NOT NULL,
    arrival_time TEXT NOT NULL,
    origin_code TEXT NOT NULL,
    destination_code TEXT NOT NULL,
    route_id INTEGER REFERENCES watched_routes(id) ON DELETE SET NULL,
    booked_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_snapshots_route_departure
    ON train_snapshots(route_id, departure_time);
  CREATE INDEX IF NOT EXISTS idx_snapshots_seats
    ON train_snapshots(seats_available);
  CREATE INDEX IF NOT EXISTS idx_snapshots_fetched
    ON train_snapshots(fetched_at);
  CREATE INDEX IF NOT EXISTS idx_bookings_departure
    ON bookings(departure_time);
`);
