"use client";

import { getSeatBadgeClasses, formatSeats, formatTime, formatDate } from "@/lib/utils";

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
  originName?: string;
  destinationName?: string;
  alertThreshold: number;
}

interface Booking {
  id: number;
  trainNumber: string;
  departureTime: string;
  routeId: number | null;
}

export function TrainRow({
  train,
  bookings = [],
  onToggleBooking,
}: {
  train: Train;
  bookings?: Booking[];
  onToggleBooking?: (train: Train, booking: Booking | undefined) => void;
}) {
  const isAlert = train.seatsAvailable > 0 && train.seatsAvailable < train.alertThreshold;
  const booking = bookings.find(
    (b) => b.trainNumber === train.trainNumber && b.departureTime === train.departureTime
  );
  const isBooked = !!booking;

  return (
    <tr className={`border-b border-gray-100 ${isAlert ? "bg-red-50/50" : "hover:bg-gray-50"}`}>
      <td className="px-3 py-2">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border ${getSeatBadgeClasses(
            train.seatsAvailable
          )}`}
        >
          {formatSeats(train.seatsAvailable)}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className="text-xs font-medium text-gray-900">
          {train.originName || train.originCode} → {train.destinationName || train.destinationCode}
        </span>
      </td>
      <td className="px-3 py-2">
        <span className="text-xs">{formatDate(train.departureTime)}</span>
      </td>
      <td className="px-3 py-2">
        <span className="text-xs">
          <span className="font-medium">{formatTime(train.departureTime)}</span>
          <span className="text-gray-400 mx-0.5">→</span>
          <span>{formatTime(train.arrivalTime)}</span>
        </span>
      </td>
      <td className="px-3 py-1.5 text-center">
        {onToggleBooking && (
          <button
            onClick={() => onToggleBooking(train, booking)}
            className={`p-1 rounded transition-colors ${
              isBooked
                ? "text-blue-600 hover:text-blue-800"
                : "text-gray-300 hover:text-blue-500"
            }`}
            title={isBooked ? "Annuler la réservation" : "Marquer comme réservé"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill={isBooked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </button>
        )}
      </td>
    </tr>
  );
}
