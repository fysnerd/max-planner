"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useStations } from "@/hooks/use-trains";

interface Props {
  value: string;
  onChange: (code: string, name: string) => void;
  placeholder?: string;
  label?: string;
}

export function StationAutocomplete({ value, onChange, placeholder, label }: Props) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [displayValue, setDisplayValue] = useState("");
  const { data: stations } = useStations(isOpen ? query : value);
  const ref = useRef<HTMLDivElement>(null);

  // Resolve displayValue from code when not focused
  useEffect(() => {
    if (value && !isOpen && stations) {
      const found = stations.find((s: { code: string }) => s.code === value);
      if (found) setDisplayValue(found.name);
    }
  }, [value, stations, isOpen]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = useCallback(
    (code: string, name: string) => {
      onChange(code, name);
      setDisplayValue(name);
      setQuery("");
      setIsOpen(false);
    },
    [onChange]
  );

  return (
    <div ref={ref} className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type="text"
        value={isOpen ? query : displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
          if (!e.target.value) {
            onChange("", "");
            setDisplayValue("");
          }
        }}
        onFocus={() => {
          setQuery(displayValue);
          setIsOpen(true);
        }}
        placeholder={placeholder || "Rechercher une gare..."}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {isOpen && stations && stations.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-auto">
          {stations.map((s: { code: string; name: string }) => (
            <li
              key={s.code}
              onClick={() => handleSelect(s.code, s.name)}
              className="px-3 py-2 text-sm hover:bg-blue-50 cursor-pointer flex justify-between"
            >
              <span>{s.name}</span>
              <span className="text-gray-400 text-xs font-mono">{s.code}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
