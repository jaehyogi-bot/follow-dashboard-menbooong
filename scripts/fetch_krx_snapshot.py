import json
import sys
from datetime import datetime, timedelta

from pykrx import stock


MARKETS = ["KOSPI", "KOSDAQ"]
INVESTOR_PRIVATE_EQUITY = "\uc0ac\ubaa8"
COLUMN_NAME = "\uc885\ubaa9\uba85"
COLUMN_NET_BUY_VALUE = "\uc21c\ub9e4\uc218\uac70\ub798\ub300\uae08"
COLUMN_MARKET_CAP = "\uc2dc\uac00\ucd1d\uc561"


def to_number(value):
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).replace(",", "").replace("%", "").strip()
    if text in {"", "-", "nan", "None"}:
        return 0.0
    return float(text)


def get_recent_business_dates(seed: str | None):
    base = datetime.strptime(seed, "%Y%m%d") if seed else datetime.now()
    dates = []
    cursor = base

    while len(dates) < 10:
        if cursor.weekday() < 5:
            dates.append(cursor.strftime("%Y%m%d"))
        cursor -= timedelta(days=1)

    return dates


def build_rows(date: str):
    ranked = []

    for market in MARKETS:
        net_buy = stock.get_market_net_purchases_of_equities_by_ticker(
            date,
            date,
            market=market,
            investor=INVESTOR_PRIVATE_EQUITY,
        )
        market_cap = stock.get_market_cap_by_ticker(date, market=market)

        if net_buy.empty or market_cap.empty:
            continue

        joined = net_buy.join(market_cap, how="inner", rsuffix="_cap")
        columns = set(joined.columns)
        if (
            COLUMN_NAME not in columns
            or COLUMN_NET_BUY_VALUE not in columns
            or COLUMN_MARKET_CAP not in columns
        ):
            continue

        for ticker, row in joined.iterrows():
            net_buy_value = to_number(row[COLUMN_NET_BUY_VALUE]) / 100000000
            market_cap_value = to_number(row[COLUMN_MARKET_CAP]) / 100000000
            if market_cap_value <= 0:
                continue

            ranked.append(
                {
                    "code": str(ticker),
                    "name": str(row[COLUMN_NAME]),
                    "marketCap": market_cap_value,
                    "institutionNetBuy": net_buy_value,
                    "foreignerNetBuy": 0.0,
                    "privateEquityNetBuy": net_buy_value,
                    "privateEquityWeight": (net_buy_value / market_cap_value) * 100,
                    "privateEquityRank": 0,
                    "foreignerRank": 0,
                    "corporationRank": 0,
                }
            )

    ranked.sort(key=lambda item: item["privateEquityWeight"], reverse=True)
    for index, item in enumerate(ranked, start=1):
        item["rank"] = index
        item["privateEquityRank"] = index

    return ranked[:30]


def main():
    requested = sys.argv[1] if len(sys.argv) > 1 and sys.argv[1] else None
    warnings = []

    for date in get_recent_business_dates(requested):
        try:
            rows = build_rows(date)
        except Exception as exc:  # noqa: BLE001
            warnings.append(f"{date}: {exc}")
            continue

        if rows:
            print(
                json.dumps(
                    {
                        "ok": True,
                        "asOfDate": f"{date[:4]}-{date[4:6]}-{date[6:8]}",
                        "rankings": rows,
                        "warnings": warnings,
                    },
                    ensure_ascii=False,
                )
            )
            return

        warnings.append(f"{date}: no rows returned")

    print(
        json.dumps(
            {
                "ok": False,
                "asOfDate": requested or "",
                "rankings": [],
                "warnings": warnings,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
