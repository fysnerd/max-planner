"use client";

import { useState } from "react";
import { StationAutocomplete } from "@/components/shared/station-autocomplete";
import { mutate } from "swr";

const DAYS = [
  { value: 0, label: "Dim" },
  { value: 1, label: "Lun" },
  { value: 2, label: "Mar" },
  { value: 3, label: "Mer" },
  { value: 4, label: "Jeu" },
  { value: 5, label: "Ven" },
  { value: 6, label: "Sam" },
];

interface Props {
  onClose: () => void;
  editRoute?: {
    id: number;
    originCode: string;
    destinationCode: string;
    label: string;
    daysOfWeek: string;
    departureTimeMin: string;
    departureTimeMax: string;
    alertThreshold: number;
  };
}

export function RouteForm({ onClose, editRoute }: Props) {
  const [originCode, setOriginCode] = useState(editRoute?.originCode || "");
  const [originName, setOriginName] = useState("");
  const [destCode, setDestCode] = useState(editRoute?.destinationCode || "");
  const [destName, setDestName] = useState("");
  const [label, setLabel] = useState(editRoute?.label || "");
  const [days, setDays] = useState<number[]>(
    editRoute ? JSON.parse(editRoute.daysOfWeek) : [1, 2, 3, 4, 5]
  );
  const [timeMin, setTimeMin] = useState(editRoute?.departureTimeMin || "06:00");
  const [timeMax, setTimeMax] = useState(editRoute?.departureTimeMax || "22:00");
  const [threshold, setThreshold] = useState(editRoute?.alertThreshold || 20);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const body = {
      ...(editRoute ? { id: editRoute.id } : {}),
      originCode,
      destinationCode: destCode,
      label: label || `${originName || originCode} → ${destName || destCode}`,
      daysOfWeek: days,
      departureTimeMin: timeMin,
      departureTimeMax: timeMax,
      alertThreshold: threshold,
    };

    await fetch("/api/routes", {
      method: editRoute ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    await mutate("/api/routes");
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 space-y-4"
      >
        <h2 className="text-lg font-semibold">
          {editRoute ? "Modifier la route" : "Nouvelle route"}
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <StationAutocomplete
            value={originCode}
            onChange={(code, name) => {
              setOriginCode(code);
              setOriginName(name);
            }}
            label="Depart"
            placeholder="Gare de depart..."
          />
          <StationAutocomplete
            value={destCode}
            onChange={(code, name) => {
              setDestCode(code);
              setDestName(name);
            }}
            label="Arrivee"
            placeholder="Gare d'arrivee..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="ex: Paris → Lyon (matin)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Jours de la semaine
          </label>
          <div className="flex gap-2">
            {DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => toggleDay(d.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  days.includes(d.value)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure min
            </label>
            <input
              type="time"
              value={timeMin}
              onChange={(e) => setTimeMin(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heure max
            </label>
            <input
              type="time"
              value={timeMax}
              onChange={(e) => setTimeMax(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Seuil d&apos;alerte (places)
          </label>
          <input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value) || 20)}
            min={1}
            className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={!originCode || !destCode || saving}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : editRoute ? "Modifier" : "Ajouter"}
          </button>
        </div>
      </form>
    </div>
  );
}
