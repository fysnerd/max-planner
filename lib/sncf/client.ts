import { execFile } from "child_process";
import path from "path";
import { TrainAvailability, FetchTrainsResult } from "./types";

const PYTHON_BIN =
  process.env.PYTHON_BIN ||
  (process.platform === "win32"
    ? "C:\\Users\\vmsan\\AppData\\Local\\Programs\\Python\\Python312\\python.exe"
    : "python3");

const SCRIPT_PATH = path.join(process.cwd(), "scripts", "fetch_sncf.py");

/**
 * Spawn the Python fetch_sncf.py script and parse its JSON output.
 * Returns { source, trains } where source is "camoufox" or "opendata".
 */
export function fetchTrainsRaw(
  origin: string,
  destination: string,
  date: string
): Promise<FetchTrainsResult> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      PYTHON_BIN,
      [SCRIPT_PATH, origin, destination, date],
      { timeout: 120_000, maxBuffer: 5 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (stderr) {
          console.log(`[SNCF/Python] ${stderr.trim()}`);
        }
        if (error) {
          reject(
            new Error(
              `Python script failed (code ${error.code}): ${stderr || error.message}`
            )
          );
          return;
        }

        try {
          const result: FetchTrainsResult = JSON.parse(stdout.trim());
          resolve(result);
        } catch (parseErr) {
          reject(
            new Error(
              `Failed to parse Python output: ${parseErr}. stdout: ${stdout.slice(0, 500)}`
            )
          );
        }
      }
    );
  });
}

/**
 * Convenience wrapper: fetch trains and return just the array.
 * Kept for backward-compat with any callers that only need the train list.
 */
export async function fetchTrains(
  origin: string,
  destination: string,
  date: Date | string
): Promise<TrainAvailability[]> {
  const dateStr =
    typeof date === "string" ? date : date.toISOString().split("T")[0];
  const result = await fetchTrainsRaw(origin, destination, dateStr);
  return result.trains;
}
