export interface SNCFOpenDataRecord {
  date: string; // "2026-03-03"
  train_no: string;
  entity: string;
  axe: string;
  origine_iata: string;
  destination_iata: string;
  origine: string;
  destination: string;
  heure_depart: string; // "07:06"
  heure_arrivee: string; // "07:45"
  od_happy_card: "OUI" | "NON";
}

export interface SNCFOpenDataResponse {
  total_count: number;
  results: SNCFOpenDataRecord[];
}

export interface TrainAvailability {
  trainNumber: string;
  trainType: string;
  departureTime: string; // ISO datetime
  arrivalTime: string; // ISO datetime
  seatsAvailable: number; // >0 = real count, -1 = available but unknown count, 0 = not available
  origin: string;
  destination: string;
}

export interface FetchTrainsResult {
  source: "camoufox" | "opendata";
  trains: TrainAvailability[];
}
