"""
Fetch TGV Max seat availability using Camoufox (stealth browser).
Called as subprocess from Node.js poller.

Usage:
  python scripts/fetch_sncf.py <origin> <destination> <date_YYYY-MM-DD>

Output: JSON to stdout
  {"source":"camoufox","trains":[{"trainNumber":"2501","trainType":"INOUI","departureTime":"2026-03-03T07:06","arrivalTime":"2026-03-03T07:45","seatsAvailable":64,"origin":"PARIS EST","destination":"CHAMPAGNE-ARDENNE TGV"},...]}

Exit codes:
  0 = success
  1 = error
"""

import sys
import json
import time
import urllib.parse
import urllib.request


PYTHON_BIN = sys.executable
API_BASE = (
    "https://www.maxjeune-tgvinoui.sncf/api/public/refdata/"
    "search-freeplaces-proposals"
)
SITE_URL = "https://www.maxjeune-tgvinoui.sncf/"


def fetch_with_camoufox(origin: str, destination: str, date: str) -> list:
    """Fetch using Camoufox stealth browser. Returns list of trains with count."""
    from camoufox.sync_api import Camoufox

    url = f"{API_BASE}?origin={origin}&destination={destination}&departureDateTime={date}T01:00:00.000Z"

    with Camoufox(headless=True, humanize=False) as browser:
        page = browser.new_page()
        page.goto(SITE_URL, timeout=25000)
        time.sleep(2)

        resp = page.goto(url, timeout=15000)
        if resp is None or resp.status != 200:
            status = resp.status if resp else "no response"
            raise Exception(f"HTTP {status}")

        body = page.evaluate("() => document.body.innerText")
        data = json.loads(body)

    proposals = data.get("proposals", []) if isinstance(data, dict) else data
    trains = []
    for p in proposals:
        trains.append({
            "trainNumber": str(p.get("num", "?")),
            "trainType": p.get("type", "TGV"),
            "departureTime": p.get("dep", ""),
            "arrivalTime": p.get("arr", ""),
            "seatsAvailable": p.get("count", 0),
            "origin": p.get("orig", origin),
            "destination": p.get("dest", destination),
        })
    return trains


def fetch_with_opendata(origin: str, destination: str, date: str) -> list:
    """Fallback: SNCF Open Data. Returns OUI/NON (seatsAvailable = -1 or 0)."""
    where = (
        f"date=date'{date}' AND "
        f"origine_iata='{origin}' AND "
        f"destination_iata='{destination}'"
    )
    api_url = (
        f"https://data.sncf.com/api/explore/v2.1/catalog/datasets/tgvmax/records"
        f"?where={urllib.parse.quote(where)}&limit=50"
    )

    req = urllib.request.Request(api_url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())

    trains = []
    for r in data.get("results", []):
        dep_time = f"{r['date']}T{r['heure_depart']}"
        arr_time = f"{r['date']}T{r['heure_arrivee']}"
        available = r.get("od_happy_card", "NON") == "OUI"
        trains.append({
            "trainNumber": r.get("train_no", "?"),
            "trainType": "TGV",
            "departureTime": dep_time,
            "arrivalTime": arr_time,
            "seatsAvailable": -1 if available else 0,
            "origin": origin,
            "destination": destination,
        })
    return trains


def main():
    if len(sys.argv) != 4:
        print("Usage: fetch_sncf.py <origin> <destination> <date>", file=sys.stderr)
        sys.exit(1)

    origin, destination, date = sys.argv[1], sys.argv[2], sys.argv[3]
    trains = None
    source = None

    # Try Camoufox first
    try:
        trains = fetch_with_camoufox(origin, destination, date)
        source = "camoufox"
    except Exception as e:
        print(f"[Camoufox failed: {e}] Falling back to Open Data", file=sys.stderr)

    # Fallback to Open Data
    if trains is None:
        try:
            trains = fetch_with_opendata(origin, destination, date)
            source = "opendata"
        except Exception as e:
            print(f"[Open Data also failed: {e}]", file=sys.stderr)
            sys.exit(1)

    print(json.dumps({"source": source, "trains": trains}))


if __name__ == "__main__":
    main()
