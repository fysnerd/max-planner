"use client";

import { useState } from "react";
import { RouteList } from "@/components/routes/route-list";
import { RouteForm } from "@/components/routes/route-form";

export default function RoutesPage() {
  const [showForm, setShowForm] = useState(false);
  const [editRoute, setEditRoute] = useState<any>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-gray-900">Routes</h1>
        <button
          onClick={() => {
            setEditRoute(null);
            setShowForm(true);
          }}
          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Ajouter
        </button>
      </div>

      <RouteList
        onEdit={(route) => {
          setEditRoute(route);
          setShowForm(true);
        }}
      />

      {showForm && (
        <RouteForm
          editRoute={editRoute}
          onClose={() => {
            setShowForm(false);
            setEditRoute(null);
          }}
        />
      )}
    </div>
  );
}
