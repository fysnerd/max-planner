"use client";

import { useState, useMemo } from "react";
import { MonthGrid } from "@/components/calendar/month-grid";
import { useTrains, useRoutes } from "@/hooks/use-trains";
import { TrainCard } from "@/components/dashboard/train-card";
import { TrainRow } from "@/components/dashboard/train-row";

export default function CalendarPage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [filterRouteId, setFilterRouteId] = useState<number | undefined>();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { data: trains } = useTrains(filterRouteId);
  const { data: routes } = useRoutes();

  const dayDataMap = useMemo(() => {
    const map: Record<string, { date: string; minSeats: number | null; trainCount: number }> = {};
    if (!trains) return map;

    for (const t of trains) {
      const date = t.departureTime.split("T")[0];
      if (!map[date]) {
        map[date] = { date, minSeats: t.seatsAvailable, trainCount: 1 };
      } else {
        map[date].trainCount++;
        if (t.seatsAvailable < (map[date].minSeats ?? Infinity)) {
          map[date].minSeats = t.seatsAvailable;
        }
      }
    }
    return map;
  }, [trains]);

  const selectedTrains = useMemo(() => {
    if (!selectedDate || !trains) return [];
    return trains.filter((t: any) => t.departureTime.startsWith(selectedDate));
  }, [selectedDate, trains]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold text-gray-900">Calendrier</h1>
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

      <div className="bg-white rounded-lg border border-gray-200 p-3 md:p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 active:bg-gray-200 rounded-lg text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <MonthGrid
          year={year}
          month={month}
          dayDataMap={dayDataMap}
          onDayClick={(date) => setSelectedDate(date === selectedDate ? null : date)}
        />
      </div>

      {selectedDate && (
        <div className="mt-3 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-200">
            <h3 className="text-xs font-semibold text-gray-900">
              Trains du{" "}
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
          </div>
          {selectedTrains.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
              Aucun train pour cette date.
            </div>
          ) : (
            <>
              {/* Mobile: cards */}
              <div className="md:hidden">
                {selectedTrains.map((train: any) => (
                  <TrainCard key={train.id} train={train} />
                ))}
              </div>
              {/* Desktop: table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                      <th className="px-3 py-1.5">Places</th>
                      <th className="px-3 py-1.5">Route</th>
                      <th className="px-3 py-1.5">Date</th>
                      <th className="px-3 py-1.5">Horaires</th>
                      <th className="px-3 py-1.5">Train</th>
                      <th className="px-3 py-1.5"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTrains.map((train: any) => (
                      <TrainRow key={train.id} train={train} />
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
