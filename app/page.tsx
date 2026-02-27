"use client";

import { StatsBar } from "@/components/dashboard/stats-bar";
import { RefreshButton } from "@/components/dashboard/refresh-button";
import { PriorityTable } from "@/components/dashboard/priority-table";
import { useTrains, useRoutes } from "@/hooks/use-trains";

export default function Dashboard() {
  const { data: trains } = useTrains();
  const { data: routes } = useRoutes();

  const alertCount =
    trains?.filter((t: { seatsAvailable: number; alertThreshold: number }) => t.seatsAvailable < t.alertThreshold)
      .length || 0;

  const lastFetched =
    trains && trains.length > 0
      ? trains.reduce(
          (latest: string, t: { fetchedAt: string }) =>
            t.fetchedAt > latest ? t.fetchedAt : latest,
          trains[0].fetchedAt
        )
      : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Dashboard</h1>
        <RefreshButton />
      </div>

      <StatsBar
        routeCount={routes?.filter((r: { isActive: boolean }) => r.isActive).length || 0}
        trainCount={trains?.length || 0}
        alertCount={alertCount}
        lastRefresh={lastFetched}
      />

      <PriorityTable />
    </div>
  );
}
