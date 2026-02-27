// seatsAvailable: >0 = real count, -1 = available (count unknown), 0 = not available

export function getSeatBadgeClasses(seats: number): string {
  if (seats === 0) return "bg-gray-100 text-gray-500 border-gray-200";
  if (seats === -1) return "bg-blue-100 text-blue-800 border-blue-200";
  if (seats < 20) return "bg-red-100 text-red-800 border-red-200";
  if (seats < 50) return "bg-orange-100 text-orange-800 border-orange-200";
  if (seats < 100) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-green-100 text-green-800 border-green-200";
}

export function getSeatDotColor(seats: number): string {
  if (seats === 0) return "bg-gray-400";
  if (seats === -1) return "bg-blue-500";
  if (seats < 20) return "bg-red-500";
  if (seats < 50) return "bg-orange-500";
  if (seats < 100) return "bg-yellow-500";
  return "bg-green-500";
}

export function formatSeats(seats: number): string {
  if (seats === 0) return "Complet";
  if (seats === -1) return "Dispo";
  return String(seats);
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Europe/Paris",
  });
}

export function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString("fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Paris",
  });
}

const DAY_NAMES = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function getDayName(dayIndex: number): string {
  return DAY_NAMES[dayIndex] || "?";
}

export function getDatesForDaysOfWeek(
  daysOfWeek: number[],
  daysAhead: number = 30
): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...
    if (daysOfWeek.includes(dayOfWeek)) {
      dates.push(date);
    }
  }
  return dates;
}

/** Build a SNCF Connect deep link for a specific train. */
export function getSncfConnectUrl(
  originCode: string,
  destinationCode: string,
  departureTime: string
): string {
  // SNCF Connect expects: /app/results/train?originCode=X&destinationCode=Y&outwardDate=ISO
  const dt = new Date(departureTime);
  const iso = dt.toISOString().replace(/\.\d+Z$/, "");
  return `https://www.sncf-connect.com/app/results/train?originCode=${originCode}&destinationCode=${destinationCode}&outwardDate=${iso}`;
}

export function getTrend(
  current: number,
  previous: number | null
): "up" | "down" | "stable" {
  if (previous === null) return "stable";
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "stable";
}
