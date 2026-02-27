"use client";

import { useRoutes } from "@/hooks/use-trains";
import { RouteCard } from "./route-card";

interface Route {
  id: number;
  originCode: string;
  destinationCode: string;
  originName: string;
  destinationName: string;
  label: string;
  daysOfWeek: string;
  departureTimeMin: string;
  departureTimeMax: string;
  alertThreshold: number;
  isActive: boolean;
}

interface Props {
  onEdit: (route: Route) => void;
}

export function RouteList({ onEdit }: Props) {
  const { data: routes, isLoading } = useRoutes();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (!routes || routes.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
        <p>Aucune route configuree.</p>
        <p className="text-sm mt-1">Cliquez sur &quot;Ajouter une route&quot; pour commencer.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {routes.map((route: Route) => (
        <RouteCard key={route.id} route={route} onEdit={onEdit} />
      ))}
    </div>
  );
}
