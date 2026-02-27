"use client";

import { getSeatDotColor, formatSeats } from "@/lib/utils";

interface DayData {
  date: string;
  minSeats: number | null;
  trainCount: number;
}

interface Props {
  day: number | null;
  data?: DayData;
  isToday: boolean;
  onClick?: () => void;
}

export function DayCell({ day, data, isToday, onClick }: Props) {
  if (!day) {
    return <div className="h-14" />;
  }

  const hasData = data && data.trainCount > 0;

  return (
    <button
      onClick={onClick}
      className={`h-14 p-1 border border-gray-100 rounded text-left transition-colors hover:bg-gray-50 ${
        isToday ? "ring-2 ring-blue-500 ring-inset" : ""
      }`}
    >
      <span
        className={`text-[10px] font-medium ${
          isToday ? "text-blue-600" : "text-gray-700"
        }`}
      >
        {day}
      </span>
      {hasData && (
        <div className="mt-0.5">
          <div className="flex items-center gap-0.5">
            <div
              className={`w-1.5 h-1.5 rounded-full ${getSeatDotColor(
                data.minSeats!
              )}`}
            />
            <span className="text-[10px] text-gray-600 font-medium">
              {formatSeats(data.minSeats!)}
            </span>
          </div>
          <span className="text-[9px] text-gray-400">
            {data.trainCount}t
          </span>
        </div>
      )}
    </button>
  );
}
