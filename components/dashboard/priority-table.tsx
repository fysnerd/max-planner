"use client";

import { useTrains, useRoutes, useBookings } from "@/hooks/use-trains";
import { TrainRow } from "./train-row";
import { TrainCard } from "./train-card";
import { SlotTracker } from "./slot-tracker";
import { useState, useMemo, useCallback } from "react";

/** Returns Monday 00:00 of the week containing `date`. */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatWeekLabel(monday: Date): string {
  const sunday = addDays(monday, 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

/** Format a Date as YYYY-MM-DD (local time, not UTC) */
function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type WeekFilter = "next" | "all" | number; // number = week offset from current

interface Train {
  id: number;
  routeId: number;
  trainNumber: string;
  trainType: string | null;
  departureTime: string;
  arrivalTime: string;
  seatsAvailable: number;
  fetchedAt: string;
  routeLabel: string;
  originCode: string;
  destinationCode: string;
  alertThreshold: number;
}

interface Booking {
  id: number;
  trainNumber: string;
  departureTime: string;
  routeId: number | null;
}

export function PriorityTable() {
  const [filterRouteId, setFilterRouteId] = useState<number | undefined>();
  const [weekFilter, setWeekFilter] = useState<WeekFilter>("next");
  const { data: trains, isLoading } = useTrains(filterRouteId);
  const { data: routes } = useRoutes();

  const today = useMemo(() => new Date(), []);
  const thisMonday = useMemo(() => getMonday(today), [today]);

  // Compute weekStart for bookings query
  const weekStart = useMemo(() => {
    if (weekFilter === "all") return undefined;
    const offset = weekFilter === "next" ? 1 : weekFilter;
    return toDateString(addDays(thisMonday, offset * 7));
  }, [weekFilter, thisMonday]);

  const { data: bookings, mutate: mutateBookings } = useBookings(weekStart);

  const handleToggleBooking = useCallback(
    async (train: Train, existing: Booking | undefined) => {
      if (existing) {
        await fetch("/api/bookings", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: existing.id }),
        });
      } else {
        await fetch("/api/bookings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            trainNumber: train.trainNumber,
            departureTime: train.departureTime,
            arrivalTime: train.arrivalTime,
            originCode: train.originCode,
            destinationCode: train.destinationCode,
            routeId: train.routeId,
          }),
        });
      }
      mutateBookings();
    },
    [mutateBookings]
  );

  // Build week options from actual train data
  const weeks = useMemo(() => {
    if (!trains || trains.length === 0) return [];
    const weekSet = new Map<number, Date>();
    for (const t of trains) {
      const dep = new Date(t.departureTime);
      const mon = getMonday(dep);
      const offset = Math.round((mon.getTime() - thisMonday.getTime()) / (7 * 86400000));
      if (!weekSet.has(offset)) weekSet.set(offset, mon);
    }
    return Array.from(weekSet.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([offset, monday]) => ({ offset, monday }));
  }, [trains, thisMonday]);

  // Filter trains by selected week, then hide booked ones
  const filteredTrains = useMemo(() => {
    if (!trains) return [];
    let filtered = trains;

    if (weekFilter !== "all") {
      const targetOffset = weekFilter === "next" ? 1 : weekFilter;
      const targetMonday = addDays(thisMonday, targetOffset * 7);
      const targetSunday = addDays(targetMonday, 7);
      filtered = filtered.filter((t: any) => {
        const dep = new Date(t.departureTime);
        return dep >= targetMonday && dep < targetSunday;
      });
    }

    // Hide all trains on the same route+day when one is booked
    if (bookings && bookings.length > 0) {
      const bookedRouteDays = new Set(
        bookings.map((b: any) => {
          const date = b.departureTime.slice(0, 10); // YYYY-MM-DD
          return `${b.routeId}|${date}`;
        })
      );
      filtered = filtered.filter((t: any) => {
        const date = t.departureTime.slice(0, 10);
        return !bookedRouteDays.has(`${t.routeId}|${date}`);
      });
    }

    return filtered;
  }, [trains, weekFilter, thisMonday, bookings]);

  // Label for active week
  const activeWeekLabel = useMemo(() => {
    if (weekFilter === "all") return null;
    const offset = weekFilter === "next" ? 1 : weekFilter;
    return formatWeekLabel(addDays(thisMonday, offset * 7));
  }, [weekFilter, thisMonday]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
    <SlotTracker
      weekStart={weekStart}
      weekLabel={weekFilter === "all" ? "Toutes les semaines" : activeWeekLabel || undefined}
    />
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
          Trains ({filteredTrains.length})
        </h2>
        <select
          value={filterRouteId || ""}
          onChange={(e) =>
            setFilterRouteId(e.target.value ? parseInt(e.target.value) : undefined)
          }
          className="text-xs border border-gray-300 rounded px-2 py-1"
        >
          <option value="">Toutes</option>
          {routes?.map((r: { id: number; label: string }) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </div>

      {/* Week filter chips */}
      <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto">
        <button
          onClick={() => setWeekFilter("next")}
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            weekFilter === "next"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Sem. prochaine
        </button>
        {weeks.map(({ offset, monday }) => {
          if (offset <= 0) return null; // skip past weeks
          if (offset === 1 ) return null; // already covered by "Sem. prochaine"
          const label = offset === 0 ? "Cette sem." : `S+${offset}`;
          return (
            <button
              key={offset}
              onClick={() => setWeekFilter(offset)}
              className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                weekFilter === offset
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          );
        })}
        <button
          onClick={() => setWeekFilter("all")}
          className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            weekFilter === "all"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          Tout
        </button>
      </div>

      {/* Week date range indicator */}
      {activeWeekLabel && (
        <div className="px-3 py-1.5 border-b border-gray-100 bg-gray-50/50">
          <span className="text-[10px] text-gray-500">{activeWeekLabel}</span>
        </div>
      )}

      {/* Train list */}
      {filteredTrains.length === 0 ? (
        <div className="p-6 text-center text-gray-500">
          <p className="text-xs">Aucun train pour cette période.</p>
        </div>
      ) : (
        <>
          {/* Mobile: card layout */}
          <div className="md:hidden">
            {filteredTrains.map((train: { id: number }) => (
              <TrainCard
                key={train.id}
                train={train as any}
                bookings={bookings || []}
                onToggleBooking={handleToggleBooking}
              />
            ))}
          </div>

          {/* Desktop: table layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                  <th className="px-3 py-1.5">Places</th>
                  <th className="px-3 py-1.5">Route</th>
                  <th className="px-3 py-1.5">Date</th>
                  <th className="px-3 py-1.5">Horaires</th>
                  <th className="px-3 py-1.5 text-center w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredTrains.map((train: { id: number }) => (
                  <TrainRow
                    key={train.id}
                    train={train as any}
                    bookings={bookings || []}
                    onToggleBooking={handleToggleBooking}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
    </>
  );
}
