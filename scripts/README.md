# Private Equity Report

## Easiest Way

Double-click:

```text
run_private_equity_report.bat
```

It will:

- ask for optional start/end date, market, and top-N
- use defaults if you leave fields blank
- save an `.xlsx` file into `output`
- open the Excel file automatically

## Direct Run

```powershell
python scripts/build_private_equity_ranking.py --market ALL --limit 100 --open
```

Example with explicit dates:

```powershell
python scripts/build_private_equity_ranking.py --start 20260301 --end 20260320 --market ALL --output output/private_equity_ranking.xlsx --open
```

## Output File

If you do not pass `--output`, the script saves a file like this:

```text
output/private_equity_all_20260301_20260320.xlsx
```

## Useful Columns

- `사모 순매수(억원)`: names bought heavily by private equity
- `시총 대비 사모 비중(%)`: names with strong buying relative to market cap
- `사모 순매수 순위`: private-equity ranking
