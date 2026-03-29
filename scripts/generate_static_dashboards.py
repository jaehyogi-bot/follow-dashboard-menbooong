from __future__ import annotations

import json
import subprocess
from pathlib import Path

import requests

from build_private_equity_ranking import get_recent_trading_window


SNAPSHOT_COUNT = 7
ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "public" / "data" / "follow-dashboard"


def get_recent_snapshot_dates(count: int) -> list[str]:
    session = requests.Session()
    dates: list[str] = []
    seen: set[str] = set()
    anchor: str | None = None

    while len(dates) < count:
        start, end = get_recent_trading_window(session, anchor)
        if end in seen:
            break
        dates.append(end)
        seen.add(end)
        anchor = start

    return dates


def generate_snapshot(date: str) -> dict[str, object]:
    command = [
        "python",
        "-X",
        "utf8",
        str(ROOT / "scripts" / "build_private_equity_ranking.py"),
        "--market",
        "ALL",
        "--limit",
        "60",
        "--json",
        "--date",
        date,
    ]
    result = subprocess.run(
        command,
        cwd=ROOT,
        capture_output=True,
        text=True,
        encoding="utf-8",
        check=True,
    )
    return json.loads(result.stdout)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    dates = get_recent_snapshot_dates(SNAPSHOT_COUNT)

    snapshots: list[dict[str, str]] = []
    for date in dates:
        payload = generate_snapshot(date)
        formatted_date = str(payload["overview"]["asOfDate"])
        output_path = OUTPUT_DIR / f"{formatted_date}.json"
        output_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
        snapshots.append(
            {
                "date": formatted_date,
                "path": f"/data/follow-dashboard/{formatted_date}.json",
            }
        )

    index_payload = {
        "latestDate": snapshots[0]["date"] if snapshots else "",
        "availableDates": snapshots,
    }
    (OUTPUT_DIR / "index.json").write_text(
        json.dumps(index_payload, ensure_ascii=False),
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
