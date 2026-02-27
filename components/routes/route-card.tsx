"use client";

import { getDayName } from "@/lib/utils";
import { mutate } from "swr";

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
  route: Route;
  onEdit: (route: Route) => void;
}

export function RouteCard({ route, onEdit }: Props) {
  const days: number[] = JSON.parse(route.daysOfWeek || "[]");

  const toggleActive = async () => {
    await fetch("/api/routes", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: route.id, isActive: !route.isActive }),
    });
    await mutate("/api/routes");
  };

  const deleteRoute = async () => {
    if (!confirm("Supprimer cette route ?")) return;
    await fetch("/api/routes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: route.id }),
    });
    await mutate("/api/routes");
  };

  return (
    <div
      className={`bg-white rounded-lg border p-3 ${
        route.isActive ? "border-gray-200" : "border-gray-100 opacity-60"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">{route.label}</h3>
          <p className="text-xs text-gray-500">
            {route.originCode} → {route.destinationCode}
          </p>
        </div>
        <button
          onClick={toggleActive}
          className={`px-2 py-0.5 rounded text-[10px] font-medium ${
            route.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {route.isActive ? "Active" : "Pause"}
        </button>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="flex gap-0.5">
          {days.map((d) => (
            <span
              key={d}
              className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium"
            >
              {getDayName(d)}
            </span>
          ))}
        </div>
        <span className="text-[10px] text-gray-400">
          {route.departureTimeMin}-{route.departureTimeMax} · &lt;{route.alertThreshold}
        </span>
      </div>

      <div className="mt-2 flex gap-3 border-t border-gray-100 pt-2">
        <button
          onClick={() => onEdit(route)}
          className="text-[10px] text-blue-600 hover:text-blue-800 font-medium"
        >
          Modifier
        </button>
        <button
          onClick={deleteRoute}
          className="text-[10px] text-red-500 hover:text-red-700 font-medium"
        >
          Supprimer
        </button>
      </div>
    </div>
  );
}
