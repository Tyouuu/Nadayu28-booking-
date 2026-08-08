# Financial Reports (Phase 4c) — Design Spec

## Purpose

Nadayu28's billing feature (Phase 4a) lets management view/record invoices per unit but gives no aggregate view. Real platforms benchmarked earlier this session (Buildium, AppFolio, i-Neighbour) all surface an arrears/aging report and a collection-rate view as a core part of their financial reporting module — this is what a management committee actually looks at before/during an AGM. This phase adds that aggregate reporting layer on top of the existing `invoices` data, with no new tables and no external services.

Scope decided by user: arrears report + collection-rate trend chart, with CSV export included this phase (see conversation).

## Non-Goals

- No PDF export (CSV only)
- No sinking fund / multi-fee-type breakdown — single maintenance fee stream only, matching existing billing scope
- No email/scheduled delivery of reports
- No per-invoice drill-down from the report (the existing Invoices table below already provides that detail)
- No historical data beyond what `invoices` already contains (no backfill)

## Data Model

No new tables. Both report views are computed client-side from `fetchAllInvoices()`, which already returns every invoice across all units.

### Arrears (aging) report

For each unit with at least one unpaid invoice whose `due_date` is in the past:
- `unit`
- `totalOwed` — sum of `amount` across that unit's overdue unpaid invoices
- `oldestDueDate` — earliest `due_date` among them
- `daysOverdue` — `today - oldestDueDate`, in days
- `overdueCount` — number of overdue unpaid invoices

Sorted by `daysOverdue` descending (worst-overdue unit first).

### Collection rate trend

For the last 6 distinct `period` values present in the invoice data (chronological):
- `period` (YYYY-MM)
- `billed` — sum of `amount` for all invoices in that period
- `collected` — sum of `amount` for invoices in that period with `status = 'paid'`
- `rate` — `collected / billed * 100`, rounded to 1 decimal

### Summary cards

Derived from the same computed data:
- Total Outstanding — sum of `totalOwed` across all arrears rows
- Units in Arrears — count of arrears rows
- Current Month Collection Rate — `rate` of the most recent period in the trend data

## Implementation

### `services/dataService.ts` — pure helper functions (no new DB calls)

```ts
export interface ArrearsRow {
  unit: string;
  totalOwed: number;
  oldestDueDate: string;
  daysOverdue: number;
  overdueCount: number;
}

export function computeArrearsReport(invoices: Invoice[]): ArrearsRow[]

export interface CollectionPeriod {
  period: string;
  billed: number;
  collected: number;
  rate: number;
}

export function computeCollectionTrend(invoices: Invoice[]): CollectionPeriod[] // last 6 periods present in data

export function arrearsToCSV(rows: ArrearsRow[]): string // header + one line per row, RM amounts as plain numbers
```

These take the already-fetched `Invoice[]` (from the existing `fetchAllInvoices()` call `AdminPanel.tsx` already makes for the Invoices table) — no additional Supabase round trip.

### `components/AdminPanel.tsx` — Billing tab

New "Financial Reports" section added at the **top** of the existing Billing tab content (above Fee Schedules), reusing the same card style as the tab's other tables (`bg-white border border-nadayu-border rounded-2xl`) and the same light-theme Recharts styling already established in the Overview tab's charts (Phase 3b-v2).

Layout, top to bottom:
1. Three summary stat cards in a row (Total Outstanding, Units in Arrears, Current Month Collection Rate) — same small-stat-card pattern as Overview tab.
2. Collection Rate Trend — Recharts `BarChart`, x-axis = period, y-axis = rate (%), one bar per period, last 6 periods.
3. Arrears table — Unit / Amount Owed / Oldest Due Date / Days Overdue / Overdue Count, sorted worst-first, with an "Export CSV" button in the card header that downloads `arrears-report-<today>.csv` (client-side Blob download, no backend).

If there are zero overdue units, the arrears table shows an empty state ("No units in arrears — nice.") instead of an empty table. If there's no invoice data at all yet (new deployment), the whole Financial Reports section shows a single empty-state line instead of empty cards/charts.

Data loads as part of the existing `loadBilling()` call (already fetches `fetchAllInvoices()` on Billing-tab mount) — the two `compute*` functions run on that same result, no new loading state needed.

## Testing

- `npx tsc --noEmit && npm run build` after each task
- Manual Playwright pass: log in as MANAGEMENT, open Billing tab, verify summary cards/chart/arrears table render against real seeded invoice data, click Export CSV and confirm a file downloads with correct rows, verify RESIDENT/SECURITY roles cannot see this section (Billing tab isn't in their nav at all, already true)
- No RLS changes needed (no new tables/columns) — no new verify script required
