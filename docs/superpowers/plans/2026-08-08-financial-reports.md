# Financial Reports (Phase 4c) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an arrears (aging) report and a collection-rate trend chart to the Billing tab of `AdminPanel.tsx`, computed client-side from data already fetched, with CSV export of the arrears table.

**Architecture:** Two pure functions in `services/dataService.ts` compute report rows from the existing `Invoice[]` array (no new DB calls, no new tables). A third pure function serializes the arrears rows to CSV. `AdminPanel.tsx` renders these via `useMemo` on its existing `invoices` state, in a new "Financial Reports" section placed above the existing Fee Schedules card in the Billing tab, reusing the app's existing card/table/chart visual patterns.

**Tech Stack:** React 19 + TypeScript, Recharts (already installed and used elsewhere in `AdminPanel.tsx`), Tailwind via design tokens, no new dependencies.

## Global Constraints

- No new Supabase tables, columns, or RLS policies this phase.
- No new Supabase network calls — reuse the `invoices` state already loaded by `loadBilling()`.
- CSV export is a pure client-side Blob download, no backend endpoint, no external library.
- Chart styling must match the existing light-theme Recharts props already used in this file's Overview tab charts (`stroke="#64748B"`, grid `stroke="#E2E8F0"`, `contentStyle` with `backgroundColor: '#fff'`, `color: '#0F172A'`) — do not reintroduce dark-theme chart props.
- No test suite exists in this repo. Verification per task is `npx tsc --noEmit && npm run build`.

---

### Task 1: Report-computation pure functions in `dataService.ts`

**Files:**
- Modify: `services/dataService.ts` (insert after `recordInvoicePayment`, i.e. after the Billing section's existing final function, currently ending around line 800-810 — insert immediately after that function's closing brace and before the next `// ──` section comment or EOF, whichever comes first)

**Interfaces:**
- Consumes: existing `Invoice` interface (`id, unit, period, amount, dueDate, status, paidDate, paymentMethod, paymentReference`), already defined earlier in this same file.
- Produces:
  - `export interface ArrearsRow { unit: string; totalOwed: number; oldestDueDate: string; daysOverdue: number; overdueCount: number; }`
  - `export function computeArrearsReport(invoices: Invoice[]): ArrearsRow[]`
  - `export interface CollectionPeriod { period: string; billed: number; collected: number; rate: number; }`
  - `export function computeCollectionTrend(invoices: Invoice[]): CollectionPeriod[]`
  - `export function arrearsToCSV(rows: ArrearsRow[]): string`
  - These four exports are consumed by Task 2 (`AdminPanel.tsx`).

- [ ] **Step 1: Add the code**

Insert this block into `services/dataService.ts`, right after the `recordInvoicePayment` function's closing `}`:

```ts
export interface ArrearsRow {
  unit: string;
  totalOwed: number;
  oldestDueDate: string;
  daysOverdue: number;
  overdueCount: number;
}

export function computeArrearsReport(invoices: Invoice[]): ArrearsRow[] {
  const now = Date.now();
  const byUnit = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    if (inv.status !== 'unpaid') continue;
    if (new Date(inv.dueDate).getTime() >= now) continue;
    const list = byUnit.get(inv.unit) ?? [];
    list.push(inv);
    byUnit.set(inv.unit, list);
  }

  const rows: ArrearsRow[] = [];
  for (const [unit, overdue] of byUnit) {
    const totalOwed = overdue.reduce((sum, inv) => sum + inv.amount, 0);
    const oldestDueDate = overdue.reduce((oldest, inv) => (inv.dueDate < oldest ? inv.dueDate : oldest), overdue[0].dueDate);
    const daysOverdue = Math.floor((now - new Date(oldestDueDate).getTime()) / (24 * 60 * 60 * 1000));
    rows.push({ unit, totalOwed, oldestDueDate, daysOverdue, overdueCount: overdue.length });
  }

  return rows.sort((a, b) => b.daysOverdue - a.daysOverdue);
}

export interface CollectionPeriod {
  period: string;
  billed: number;
  collected: number;
  rate: number;
}

export function computeCollectionTrend(invoices: Invoice[]): CollectionPeriod[] {
  const byPeriod = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    const list = byPeriod.get(inv.period) ?? [];
    list.push(inv);
    byPeriod.set(inv.period, list);
  }

  const periods = Array.from(byPeriod.keys()).sort();
  const lastSix = periods.slice(-6);

  return lastSix.map(period => {
    const invs = byPeriod.get(period)!;
    const billed = invs.reduce((sum, inv) => sum + inv.amount, 0);
    const collected = invs.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);
    const rate = billed === 0 ? 0 : Math.round((collected / billed) * 1000) / 10;
    return { period, billed, collected, rate };
  });
}

export function arrearsToCSV(rows: ArrearsRow[]): string {
  const header = 'Unit,Amount Owed (RM),Oldest Due Date,Days Overdue,Overdue Invoices';
  const lines = rows.map(r => `${r.unit},${r.totalOwed.toFixed(2)},${r.oldestDueDate},${r.daysOverdue},${r.overdueCount}`);
  return [header, ...lines].join('\n');
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 3: Commit**

```bash
git add services/dataService.ts
git commit -m "feat: add arrears report and collection trend computation functions"
```

---

### Task 2: Financial Reports section in `AdminPanel.tsx`

**Files:**
- Modify: `components/AdminPanel.tsx`
  - Line 4: extend the `dataService` import
  - After line 73 (state declarations for billing): add a `useMemo` import and two computed-report constants
  - Line 342 area: insert the new "Financial Reports" section as the first child inside `{activeTab === 'billing' && (<div className="space-y-5">...)}`, before the existing Fee Schedules card

**Interfaces:**
- Consumes: `computeArrearsReport`, `computeCollectionTrend`, `arrearsToCSV`, `ArrearsRow`, `CollectionPeriod` from Task 1 (`services/dataService.ts`); existing `invoices: Invoice[]` state (already populated by the existing `loadBilling()`); existing `BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer` already imported from `recharts` at the top of this file.
- Produces: nothing consumed by later tasks — this is the final UI task.

- [ ] **Step 1: Extend the dataService import**

In `components/AdminPanel.tsx` line 4, change:

```ts
import { fetchViolations, fetchReports, fetchUsers, updateUserRole, fetchAuditLog, AuditLogEntry, updateViolationStatus, fetchAllInvoices, fetchAllFeeSchedules, setFeeSchedule, recordInvoicePayment, Invoice, FeeSchedule } from '../services/dataService';
```

to:

```ts
import { fetchViolations, fetchReports, fetchUsers, updateUserRole, fetchAuditLog, AuditLogEntry, updateViolationStatus, fetchAllInvoices, fetchAllFeeSchedules, setFeeSchedule, recordInvoicePayment, computeArrearsReport, computeCollectionTrend, arrearsToCSV, Invoice, FeeSchedule } from '../services/dataService';
```

- [ ] **Step 2: Add `useMemo` to the React import**

Line 1, change:

```ts
import React, { useState, useEffect } from 'react';
```

to:

```ts
import React, { useState, useEffect, useMemo } from 'react';
```

- [ ] **Step 3: Add an icon import for the Export button**

Line 6 currently:

```ts
import { Download, Filter, MoreHorizontal, X, AlertTriangle, Calendar, MapPin, DollarSign, Clock, Receipt } from 'lucide-react';
```

`Download` is already imported — no change needed here.

- [ ] **Step 4: Add the computed report constants**

Immediately after the existing billing state block (after the line `const [newUnitRate, setNewUnitRate] = useState('');` and before `const loadBilling = () => {`), insert:

```ts
  const arrearsReport = useMemo(() => computeArrearsReport(invoices), [invoices]);
  const collectionTrend = useMemo(() => computeCollectionTrend(invoices), [invoices]);
  const totalOutstanding = arrearsReport.reduce((sum, r) => sum + r.totalOwed, 0);
  const currentMonthRate = collectionTrend.length > 0 ? collectionTrend[collectionTrend.length - 1].rate : null;

  const handleExportArrearsCSV = () => {
    const csv = arrearsToCSV(arrearsReport);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arrears-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
```

- [ ] **Step 5: Insert the Financial Reports section**

Find the existing Billing tab opening (currently around line 342-344):

```tsx
      {activeTab === 'billing' && (
        <div className="space-y-5">
          <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Fee Schedules</h3>
```

Change it to insert the new section between `<div className="space-y-5">` and the Fee Schedules card:

```tsx
      {activeTab === 'billing' && (
        <div className="space-y-5">
          {invoices.length === 0 ? (
            <div className="bg-white border border-nadayu-border rounded-2xl p-6 text-sm text-nadayu-muted">
              No billing data yet — financial reports will appear once invoices exist.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-nadayu-border rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">RM {totalOutstanding.toFixed(2)}</p>
                    <p className="text-xs text-nadayu-muted mt-1">Total outstanding</p>
                  </div>
                </div>
                <div className="bg-white border border-nadayu-border rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={20} className="text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{arrearsReport.length}</p>
                    <p className="text-xs text-nadayu-muted mt-1">Units in arrears</p>
                  </div>
                </div>
                <div className="bg-white border border-nadayu-border rounded-2xl p-6 flex items-center gap-4">
                  <div className="w-12 h-12 bg-nadayu-accent/15 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Receipt size={20} className="text-nadayu-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 leading-none">{currentMonthRate === null ? '—' : `${currentMonthRate}%`}</p>
                    <p className="text-xs text-nadayu-muted mt-1">Current month collection rate</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-nadayu-border rounded-2xl p-6">
                <div className="flex justify-between items-center mb-5">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Collection Rate Trend</h3>
                    <p className="text-sm text-nadayu-muted">Last {collectionTrend.length} periods</p>
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={collectionTrend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="period" stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                      <YAxis stroke="#64748B" fontSize={12} tickLine={false} axisLine={false} dx={-10} unit="%" />
                      <Tooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', fontWeight: 600, backgroundColor: '#fff', color: '#0F172A' }} formatter={(value: number) => [`${value}%`, 'Collected']} />
                      <Bar dataKey="rate" fill="#2563EB" radius={[8, 8, 8, 8]} barSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
                <div className="px-6 pt-5 pb-4 border-b border-gray-50 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">Arrears Report</h3>
                    <p className="text-xs text-nadayu-muted mt-0.5">Units with overdue unpaid invoices, worst first</p>
                  </div>
                  {arrearsReport.length > 0 && (
                    <button onClick={handleExportArrearsCSV} className="flex items-center gap-2 bg-nadayu-cream text-gray-700 px-4 py-2 rounded-lg font-bold text-xs hover:bg-gray-200 transition-colors">
                      <Download size={14} /> Export CSV
                    </button>
                  )}
                </div>
                {arrearsReport.length === 0 ? (
                  <div className="p-6 text-sm text-nadayu-muted">No units in arrears — nice.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
                        <tr>
                          <th className="px-6 py-4">Unit</th>
                          <th className="px-6 py-4">Amount Owed</th>
                          <th className="px-6 py-4">Oldest Due Date</th>
                          <th className="px-6 py-4">Days Overdue</th>
                          <th className="px-6 py-4">Overdue Invoices</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {arrearsReport.map(row => (
                          <tr key={row.unit}>
                            <td className="px-6 py-4 font-bold text-gray-900">{row.unit}</td>
                            <td className="px-6 py-4 text-gray-900">RM {row.totalOwed.toFixed(2)}</td>
                            <td className="px-6 py-4 text-nadayu-muted">{row.oldestDueDate}</td>
                            <td className="px-6 py-4 text-orange-500 font-bold">{row.daysOverdue}</td>
                            <td className="px-6 py-4 text-nadayu-muted">{row.overdueCount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
            <div className="px-6 pt-5 pb-4 border-b border-gray-50">
              <h3 className="text-sm font-semibold text-gray-900">Fee Schedules</h3>
```

Everything from the original `Fee Schedules` card onward stays exactly as it was — this step only wraps a new block in front of it. Do not modify anything below the `Fee Schedules` card's opening in this step.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 7: Commit**

```bash
git add components/AdminPanel.tsx
git commit -m "feat: add Financial Reports section (arrears report + collection trend chart) to Billing tab"
```

---

### Task 3: Regression pass and deploy

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev` (background)

- [ ] **Step 2: Manual Playwright pass**

Log in as MANAGEMENT (`hafiz.a@email.com` / `Nadayu28!`), open the Admin Panel, click the Billing tab. Confirm:
- Three summary cards render (Total Outstanding, Units in Arrears, Current Month Collection Rate) with real numbers (or the no-data empty state if `invoices` is somehow empty).
- Collection Rate Trend bar chart renders with light-theme styling (white background tooltip, slate axis text, blue bars) — no dark-theme remnants.
- Arrears Report table renders, sorted with the most-overdue unit first; if there are zero overdue units, confirm the "No units in arrears — nice." empty state shows instead.
- Click "Export CSV" (only visible when `arrearsReport.length > 0`) and confirm a file named `arrears-report-<date>.csv` downloads with a header row and correct data rows.
- Confirm the existing Fee Schedules and Invoices cards below still work exactly as before (no regression).

Log in as RESIDENT (`karwai.wong@email.com` / `Nadayu28!`) and SECURITY (`siewling.ng@email.com` / `Nadayu28!`) and confirm neither has access to the Admin Panel / Billing tab (already true before this change — just confirm no regression).

- [ ] **Step 3: Final build check**

Run: `npx tsc --noEmit && npm run build`
Expected: both succeed with no errors.

- [ ] **Step 4: Push and deploy**

```bash
git push origin main
npx vercel deploy --prod --scope ty28
```

Confirm the deployment's `readyState` is `READY` and it aliases to `https://nadayu28-booking.vercel.app`.

---

## Self-Review Notes

- **Spec coverage:** Arrears report (Task 1 `computeArrearsReport` + Task 2 table) ✓. Collection rate trend (Task 1 `computeCollectionTrend` + Task 2 chart) ✓. CSV export (Task 1 `arrearsToCSV` + Task 2 export button) ✓. Summary cards (Task 2) ✓. Empty states — no invoices at all, and zero arrears — both covered in Task 2 Step 5 ✓. No new DB calls — confirmed, `useMemo` operates on existing `invoices` state only ✓. Light-theme chart styling — copied verbatim from the existing Facility Usage `BarChart` in this same file ✓.
- **Placeholder scan:** none found — every step has literal code.
- **Type consistency:** `ArrearsRow`/`CollectionPeriod` field names match between Task 1's definitions and Task 2's usage (`totalOwed`, `oldestDueDate`, `daysOverdue`, `overdueCount`, `period`, `billed`, `collected`, `rate`) — verified consistent.
