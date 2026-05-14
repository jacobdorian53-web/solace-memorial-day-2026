# Solace Memorial Day Sale 2026 — Live Dashboard

Live dashboard tracking Solace's Memorial Day 2026 sale (May 18 – 25). Targets locked from the moderate-scenario projection; actuals updated daily during the sale.

**Live URL:** _set after GitHub Pages enable_

## What this is

- `index.html` + `assets/dashboard.js` — static dashboard rendered with Chart.js
- `data/targets.json` — locked projection (conservative / moderate / aggressive) from the Memorial Day 2026 export
- `data/actuals.json` — daily numbers, updated through the sale
- `data/guardrails.json` — scaling rules + risk tracker (status: green / yellow / red)
- `docs/` — assumptions, guardrails reference, daily log

## Working plan

| Metric | Moderate target |
|---|---|
| Paid spend | $650K |
| Shopify revenue | $1.40M |
| Amazon revenue (base 8%) | $112K |
| Total revenue | $1.51M |
| Shopify MER | 2.15x |
| Total MER | 2.33x |

Offer: **Buy 2 Bands, Get 2 FREE.** Message: **"Add 4 bands to cart. Pay for 2."** Automatic discount.

## Daily update flow

Each morning during the sale:
1. Jacob drops yesterday's numbers in chat (Shopify rev, paid spend, Amazon rev, CVR, AOV, Meta ROAS, Google ROAS).
2. The agent appends a new entry to `data/actuals.json` and a paragraph in `docs/daily-log.md`.
3. Commit + push. GitHub Pages rebuilds in ~30 seconds.
4. Refresh dashboard.

### Actuals entry shape
```json
{
  "date": "2026-05-18",
  "paid_spend": 85000,
  "shopify_revenue": 182000,
  "amazon_revenue": 14560,
  "orders": 2600,
  "aov": 70,
  "cvr": 0.024,
  "meta_roas": 2.0,
  "google_roas": 4.5,
  "note": "Strong launch; held off on max-out budget."
}
```

Only `date` is required. Anything you don't have, leave out — the dashboard handles nulls.

## Editing guardrail status

Open `data/guardrails.json`, change a risk's `"status"` from `"green"` → `"yellow"` or `"red"`. Push. Done.
