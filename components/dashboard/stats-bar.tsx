"use client";

interface Props {
  routeCount: number;
  alertCount: number;
  lastRefresh: string | null;
  trainCount: number;
}

export function StatsBar({ routeCount, alertCount, lastRefresh, trainCount }: Props) {
  return (
    <div className="flex items-center gap-4 mb-4 text-xs text-gray-500">
      <span><strong className="text-gray-900">{routeCount}</strong> routes</span>
      <span className="text-gray-300">|</span>
      <span><strong className="text-gray-900">{trainCount}</strong> trains</span>
      <span className="text-gray-300">|</span>
      <span>
        <strong className={alertCount > 0 ? "text-red-600" : "text-gray-900"}>{alertCount}</strong> alertes
      </span>
      <span className="text-gray-300">|</span>
      <span>
        MAJ{" "}
        {lastRefresh
          ? new Date(lastRefresh).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "—"}
      </span>
    </div>
  );
}
