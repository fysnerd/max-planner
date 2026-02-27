"use client";

import { useBookings } from "@/hooks/use-trains";
import { formatTime, formatDate } from "@/lib/utils";
import { useSWRConfig } from "swr";

const MAX_SLOTS = 6;

/** "Paris Est" → "Paris", "Champagne-Ardenne TGV" → "Champagne-A." — keep it short for slots */
function shortName(name: string | null, fallback: string): string {
  if (!name) return fallback;
  // Take first word (city name), handle multi-word cities like "Aix-en-Provence"
  const cleaned = name.replace(/\s+(TGV|Ville|Matabiau|Part-Dieu|Saint-Exupéry)$/i, "");
  return cleaned.length > 12 ? cleaned.slice(0, 11) + "." : cleaned;
}

interface Booking {
  id: number;
  trainNumber: string;
  departureTime: string;
  arrivalTime: string;
  originCode: string;
  destinationCode: string;
  originName: string | null;
  destinationName: string | null;
  routeId: number | null;
  bookedAt: string;
}

export function SlotTracker({ weekStart, weekLabel }: { weekStart?: string; weekLabel?: string }) {
  const { data: bookings, mutate } = useBookings(weekStart);
  const booked: Booking[] = bookings || [];
  const count = booked.length;

  async function handleRemove(id: number) {
    await fetch("/api/bookings", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    mutate();
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-gray-900 uppercase tracking-wide">
            Slots TGV Max
          </h2>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            count >= MAX_SLOTS
              ? "bg-red-100 text-red-700"
              : count > 0
              ? "bg-blue-100 text-blue-700"
              : "bg-gray-100 text-gray-500"
          }`}>
            {count}/{MAX_SLOTS}
          </span>
        </div>
        {weekLabel && (
          <span className="text-[10px] text-gray-400">{weekLabel}</span>
        )}
      </div>

      {/* Slots grid */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {Array.from({ length: MAX_SLOTS }).map((_, i) => {
          const booking = booked[i];
          if (booking) {
            return (
              <div
                key={booking.id}
                className="relative bg-blue-50 border border-blue-200 rounded-lg p-2 text-center"
              >
                <button
                  onClick={() => handleRemove(booking.id)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-white border border-gray-300 rounded-full text-gray-400 hover:text-red-500 hover:border-red-300 flex items-center justify-center text-xs leading-none transition-colors"
                  title="Annuler"
                >
                  &times;
                </button>
                <div className="text-[10px] font-medium text-blue-800 truncate">
                  {formatDate(booking.departureTime)}
                </div>
                <div className="text-xs font-bold text-blue-900 mt-0.5">
                  {formatTime(booking.departureTime)}
                </div>
                <div className="text-[9px] text-blue-600 mt-0.5 truncate">
                  {shortName(booking.originName, booking.originCode)} → {shortName(booking.destinationName, booking.destinationCode)}
                </div>
              </div>
            );
          }

          return (
            <div
              key={`empty-${i}`}
              className="border-2 border-dashed border-gray-200 rounded-lg p-2 flex items-center justify-center min-h-[4rem]"
            >
              <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-300" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
