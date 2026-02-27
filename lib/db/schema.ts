import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const stations = sqliteTable("stations", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
});

export const watchedRoutes = sqliteTable("watched_routes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  originCode: text("origin_code")
    .notNull()
    .references(() => stations.code),
  destinationCode: text("destination_code")
    .notNull()
    .references(() => stations.code),
  label: text("label").notNull(),
  daysOfWeek: text("days_of_week").notNull().default("[]"), // JSON array [1,2,3]
  departureTimeMin: text("departure_time_min").notNull().default("00:00"),
  departureTimeMax: text("departure_time_max").notNull().default("23:59"),
  alertThreshold: integer("alert_threshold").notNull().default(20),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const trainSnapshots = sqliteTable("train_snapshots", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  routeId: integer("route_id")
    .notNull()
    .references(() => watchedRoutes.id, { onDelete: "cascade" }),
  trainNumber: text("train_number").notNull(),
  trainType: text("train_type"),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  seatsAvailable: integer("seats_available").notNull(),
  fetchedAt: text("fetched_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

export const pollLogs = sqliteTable("poll_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
  status: text("status").notNull().default("running"),
  routesPolled: integer("routes_polled").default(0),
  trainsFound: integer("trains_found").default(0),
  error: text("error"),
});

export const bookings = sqliteTable("bookings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trainNumber: text("train_number").notNull(),
  departureTime: text("departure_time").notNull(),
  arrivalTime: text("arrival_time").notNull(),
  originCode: text("origin_code").notNull(),
  destinationCode: text("destination_code").notNull(),
  routeId: integer("route_id").references(() => watchedRoutes.id, { onDelete: "set null" }),
  bookedAt: text("booked_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export type Station = typeof stations.$inferSelect;
export type WatchedRoute = typeof watchedRoutes.$inferSelect;
export type TrainSnapshot = typeof trainSnapshots.$inferSelect;
export type PollLog = typeof pollLogs.$inferSelect;
export type NewWatchedRoute = typeof watchedRoutes.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
