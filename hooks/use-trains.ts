import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useTrains(routeId?: number, date?: string) {
  const params = new URLSearchParams();
  if (routeId) params.set("routeId", String(routeId));
  if (date) params.set("date", date);

  const key = `/api/trains?${params.toString()}`;

  return useSWR(key, fetcher, {
    refreshInterval: 60000, // auto-refresh every minute
    revalidateOnFocus: true,
  });
}

export function useRoutes() {
  return useSWR("/api/routes", fetcher, {
    revalidateOnFocus: true,
  });
}

export function useStations(query: string) {
  const key = query.length >= 1 ? `/api/stations?q=${encodeURIComponent(query)}` : null;
  return useSWR(key, fetcher, {
    dedupingInterval: 300,
  });
}

export function useBookings(weekStart?: string) {
  const params = weekStart ? `?weekStart=${weekStart}` : "";
  return useSWR(`/api/bookings${params}`, fetcher, {
    revalidateOnFocus: true,
  });
}
