"use client";

import { DayCell } from "./day-cell";

interface DayData {
  date: string;
  minSeats: number | null;
  trainCount: number;
}

interface Props {
  year: number;
  month: number; // 0-indexed
  dayDataMap: Record<string, DayData>;
  onDayClick: (date: string) => void;
}

const WEEK_DAYS = ["L", "M", "M", "J", "V", "S", "D"];

export function MonthGrid({ year, month, dayDataMap, onDayClick }: Props) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Monday = 0, Sunday = 6
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const monthName = firstDay.toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 capitalize mb-3">
        {monthName}
      </h2>
      <div className="grid grid-cols-7 gap-0.5">
        {WEEK_DAYS.map((d, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-medium text-gray-400 py-1"
          >
            {d}
          </div>
        ))}
        {cells.map((day, i) => {
          const dateStr = day
            ? `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
            : "";
          return (
            <DayCell
              key={i}
              day={day}
              data={dateStr ? dayDataMap[dateStr] : undefined}
              isToday={isCurrentMonth && day === todayDate}
              onClick={dateStr ? () => onDayClick(dateStr) : undefined}
            />
          );
        })}
      </div>
    </div>
  );
}
