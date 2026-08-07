# Maintenance Fee Billing (Phase 4a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give residents a fee statement (current invoice + payment history)
and give management a per-unit rate editor + all-units invoice table with
payment recording, with invoices generated automatically and lazily —
no real payment gateway in this phase.

**Architecture:** Two new Supabase tables (`fee_schedules`, `invoices`)
plus a `SECURITY DEFINER` Postgres function `ensure_invoices_for_unit`
that lazily/idempotently generates the current period's invoice for a
unit. `services/dataService.ts` gains typed fetch/write functions calling
that RPC before reads. A new `components/Billing.tsx` serves
RESIDENT/TENANT; a new "Billing" tab inside the existing
`components/AdminPanel.tsx` serves MANAGEMENT. Mobile nav gains a
`'billing'` entry under the existing "More" menu for RESIDENT/TENANT only.

**Tech Stack:** React 19 + TypeScript + Vite, Supabase (Postgres + RLS),
Tailwind via CDN tokens established in the visual redesign, `lucide-react`
icons, no new dependencies.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-08-maintenance-billing-design.md`
- Migration file: `supabase_billing.sql`, run after `supabase_documents.sql`.
- No real payment gateway — recording a payment is a manual
  date/method/reference entry by MANAGEMENT only.
- `violations` (fines) stays completely separate — do not touch that
  table, its RLS, or its UI in this plan.
- Due date is always the 14th of the invoice's period month — not
  per-unit configurable.
- No formal test suite exists in this repo. Verification per task is
  `npx tsc --noEmit` + `npm run build`, plus `scripts/verify-billing-rls.mjs`
  (new, committed) for the migration task, plus a manual Playwright pass
  in the final task.
- Working directly on `main`, no feature branch — established for the
  entire project.
- Design tokens in use (`nadayu-bg` `#F8FAFC`, `nadayu-panel` `#0F172A`,
  `nadayu-accent` `#2563EB`, `nadayu-success` `#16A34A`, `nadayu-border`
  `#E2E8F0`, `nadayu-muted` `#64748B`, `nadayu-cream` `#F1F5F9`) — use
  these token classes for all new UI, never hardcoded hex, matching every
  existing component.

---

### Task 1: Database migration + RLS verification script

**Files:**
- Create: `supabase_billing.sql`
- Create (temporary, delete after use): a Node.js script using the `pg`
  package to execute the migration against the live database
- Create: `scripts/verify-billing-rls.mjs` (committed)

**Interfaces:**
- Produces: `public.fee_schedules` table (columns: `unit` TEXT PRIMARY
  KEY, `monthly_amount` NUMERIC(10,2), `updated_by` UUID, `updated_at`
  TIMESTAMPTZ), `public.invoices` table (columns: `id` TEXT PRIMARY KEY,
  `unit` TEXT, `period` TEXT, `amount` NUMERIC(10,2), `due_date` DATE,
  `status` TEXT, `paid_date` DATE, `payment_method` TEXT,
  `payment_reference` TEXT, `recorded_by` UUID, `created_at`
  TIMESTAMPTZ, UNIQUE(unit, period)), and `public.ensure_invoices_for_unit(p_unit TEXT)`
  RPC function — all consumed by Task 2's `dataService.ts` functions.

- [ ] **Step 1: Write the migration file**

Create `supabase_billing.sql`:

```sql
-- ============================================================
-- Nadayu28 Community Portal - Maintenance Fee Billing (Phase 4a)
-- Run AFTER supabase_documents.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fee_schedules (
  unit           TEXT PRIMARY KEY,
  monthly_amount NUMERIC(10,2) NOT NULL,
  updated_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id                TEXT PRIMARY KEY,
  unit              TEXT NOT NULL,
  period            TEXT NOT NULL,
  amount            NUMERIC(10,2) NOT NULL,
  due_date          DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid')),
  paid_date         DATE,
  payment_method    TEXT CHECK (payment_method IN ('bank_transfer','cash','cheque','other')),
  payment_reference TEXT,
  recorded_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (unit, period)
);

CREATE INDEX IF NOT EXISTS idx_invoices_unit ON public.invoices(unit);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON public.invoices(period);

ALTER TABLE public.fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fee_schedules_select" ON public.fee_schedules;
DROP POLICY IF EXISTS "fee_schedules_write_staff" ON public.fee_schedules;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_write_staff" ON public.invoices;

CREATE POLICY "fee_schedules_select" ON public.fee_schedules
  FOR SELECT USING (
    unit = (SELECT unit FROM public.profiles WHERE id = auth.uid())
    OR public.is_management()
  );

CREATE POLICY "fee_schedules_write_staff" ON public.fee_schedules
  FOR ALL USING (public.is_management());

CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    unit = (SELECT unit FROM public.profiles WHERE id = auth.uid())
    OR public.is_management()
  );

CREATE POLICY "invoices_write_staff" ON public.invoices
  FOR ALL USING (public.is_management());

CREATE OR REPLACE FUNCTION public.ensure_invoices_for_unit(p_unit TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
  v_amount NUMERIC(10,2);
  v_due_date DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '13 days')::date;
BEGIN
  SELECT monthly_amount INTO v_amount FROM public.fee_schedules WHERE unit = p_unit;
  IF v_amount IS NULL THEN RETURN; END IF;

  INSERT INTO public.invoices (id, unit, period, amount, due_date, status)
  VALUES (p_unit || '-' || v_period, p_unit, v_period, v_amount, v_due_date, 'unpaid')
  ON CONFLICT (unit, period) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_invoices_for_unit(TEXT) TO authenticated;

-- ── extend audit_log to cover invoice payments ──────────────
-- Run the SELECT below first to confirm the actual constraint names
-- before the ALTERs (Postgres auto-names inline CHECKs as
-- <table>_<column>_check, but confirm rather than assume):
-- SELECT conname FROM pg_constraint WHERE conrelid = 'public.audit_log'::regclass AND contype = 'c';

ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_action_check
  CHECK (action IN ('violation_status_change','report_update','role_change','invoice_payment_recorded'));

ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_entity_type_check;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_entity_type_check
  CHECK (entity_type IN ('violation','report','profile','invoice'));

-- ── VERIFY ───────────────────────────────────────────────────
-- SELECT * FROM public.fee_schedules;
-- SELECT * FROM public.invoices;
```

- [ ] **Step 2: Confirm the actual audit_log constraint names**

Before running the full migration, connect and run just the confirmation
query from the comment above. If the returned names differ from
`audit_log_action_check` / `audit_log_entity_type_check`, edit the
`DROP CONSTRAINT IF EXISTS` lines in Step 1's file to use the real names
(the `IF EXISTS` means a name mismatch won't error, but the old
constraint would then still be in place, silently blocking
`'invoice_payment_recorded'` inserts later — so verify, don't just trust
`IF EXISTS` to save you).

- [ ] **Step 3: Run the migration against the live database**

Write a temporary script (e.g. `_tmp_migrate_billing.mjs`) using the `pg`
package, following the exact pattern used for every previous phase's
migration in this project (connect to
`db.byiehilnrroakbocxlas.supabase.co:5432` as `postgres` — ask the user
for the current password, it is never stored in the repo — read the SQL
file and execute it). Run it, confirm no errors, then delete the temp
script.

- [ ] **Step 4: Write the RLS + idempotency verification script**

Create `scripts/verify-billing-rls.mjs`:

```js
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function signIn(email, password) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return client;
}

async function main() {
  const resident = await signIn('karwai.wong@email.com', 'Nadayu28!');
  const management = await signIn('hafiz.a@email.com', 'Nadayu28!');

  // Management sets a rate for the resident's unit
  const TEST_UNIT = 'B-06-02';
  const { error: setErr } = await management.from('fee_schedules').upsert({ unit: TEST_UNIT, monthly_amount: 150 });
  if (setErr) throw new Error('management should be able to set a fee schedule: ' + setErr.message);

  // Resident cannot write to fee_schedules
  const { error: residentWriteErr } = await resident.from('fee_schedules').upsert({ unit: TEST_UNIT, monthly_amount: 999 });
  console.log(residentWriteErr ? 'PASS: resident blocked from writing fee_schedules' : 'FAIL: resident wrote fee_schedules');

  // Idempotency: call ensure_invoices_for_unit 3 times, expect exactly one row for this unit+period
  for (let i = 0; i < 3; i++) {
    const { error } = await management.rpc('ensure_invoices_for_unit', { p_unit: TEST_UNIT });
    if (error) throw new Error('ensure_invoices_for_unit failed: ' + error.message);
  }
  const period = new Date().toISOString().slice(0, 7);
  const { data: invoices, error: fetchErr } = await management.from('invoices').select('*').eq('unit', TEST_UNIT).eq('period', period);
  if (fetchErr) throw fetchErr;
  console.log(invoices.length === 1 ? 'PASS: idempotent generation (1 row after 3 calls)' : `FAIL: expected 1 row, got ${invoices.length}`);

  // Resident can read their own unit's invoice
  const { data: ownInvoices, error: ownErr } = await resident.from('invoices').select('*').eq('unit', TEST_UNIT);
  if (ownErr) throw ownErr;
  console.log(ownInvoices.length >= 1 ? 'PASS: resident can read own unit invoices' : 'FAIL: resident could not read own invoices');

  // Resident cannot read another unit's invoices (RLS filters them out silently, not an error)
  const { data: otherInvoices } = await resident.from('invoices').select('*').eq('unit', 'A-12-05');
  console.log((otherInvoices ?? []).length === 0 ? 'PASS: resident cannot see other unit invoices' : 'FAIL: resident saw another unit\'s invoices');

  console.log('DONE');
}

main().catch(e => { console.error('ERROR', e.message); process.exit(1); });
```

- [ ] **Step 5: Run the verification script**

Run: `node scripts/verify-billing-rls.mjs` (with `VITE_SUPABASE_URL` and
`VITE_SUPABASE_ANON_KEY` available in the environment — same as the
existing dev setup already reads them via Vite's `import.meta.env`; for a
plain Node script, export them as real env vars first, or adapt the
script to read `.env` via a small dotenv-style read if the project
already has a `.env` file — check for one before assuming).
Expected: every line prints `PASS:`; no `FAIL:` lines.

- [ ] **Step 6: Verify build unaffected**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed (this task touches no `.ts`/`.tsx` files, so this
just confirms nothing else broke).

- [ ] **Step 7: Commit**

```bash
git add supabase_billing.sql scripts/verify-billing-rls.mjs
git commit -m "feat: add maintenance fee billing schema, RLS, and lazy invoice generation"
```

---

### Task 2: dataService.ts — types and data functions

**Files:**
- Modify: `services/dataService.ts`

**Interfaces:**
- Consumes: `public.fee_schedules`, `public.invoices`,
  `public.ensure_invoices_for_unit` from Task 1; the existing `logAudit()`
  helper (signature: `logAudit(entry: { action: string; entityType:
  string; entityId: string; field: string; before: string | null; after:
  string | null }): Promise<void>`).
- Produces (consumed by Tasks 3 and 4):
  - `interface Invoice { id: string; unit: string; period: string; amount: number; dueDate: string; status: 'unpaid' | 'paid'; paidDate: string | null; paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'other' | null; paymentReference: string | null; }`
  - `interface FeeSchedule { unit: string; monthlyAmount: number; }`
  - `fetchInvoices(unit: string): Promise<Invoice[]>`
  - `fetchAllInvoices(): Promise<Invoice[]>`
  - `fetchAllFeeSchedules(): Promise<FeeSchedule[]>`
  - `setFeeSchedule(unit: string, monthlyAmount: number): Promise<void>`
  - `recordInvoicePayment(invoiceId: string, payment: { paidDate: string; method: 'bank_transfer' | 'cash' | 'cheque' | 'other'; reference: string }): Promise<void>`

- [ ] **Step 1: Add the types, mappers, and functions**

Append to `services/dataService.ts` (near the end, after the Documents
section, following the exact same interface/mapper/function shape as
`Document`/`toDocument`/`fetchDocuments` above it):

```ts
export interface Invoice {
  id: string;
  unit: string;
  period: string;
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid';
  paidDate: string | null;
  paymentMethod: 'bank_transfer' | 'cash' | 'cheque' | 'other' | null;
  paymentReference: string | null;
}

function toInvoice(row: Record<string, unknown>): Invoice {
  return {
    id: row.id as string,
    unit: row.unit as string,
    period: row.period as string,
    amount: Number(row.amount),
    dueDate: row.due_date as string,
    status: row.status as Invoice['status'],
    paidDate: (row.paid_date as string) ?? null,
    paymentMethod: (row.payment_method as Invoice['paymentMethod']) ?? null,
    paymentReference: (row.payment_reference as string) ?? null,
  };
}

export interface FeeSchedule {
  unit: string;
  monthlyAmount: number;
}

function toFeeSchedule(row: Record<string, unknown>): FeeSchedule {
  return {
    unit: row.unit as string,
    monthlyAmount: Number(row.monthly_amount),
  };
}

export async function fetchInvoices(unit: string): Promise<Invoice[]> {
  await supabase.rpc('ensure_invoices_for_unit', { p_unit: unit });
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('unit', unit)
    .order('period', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toInvoice);
}

export async function fetchAllInvoices(): Promise<Invoice[]> {
  const { data: schedules } = await supabase.from('fee_schedules').select('unit');
  for (const s of schedules ?? []) {
    await supabase.rpc('ensure_invoices_for_unit', { p_unit: (s as { unit: string }).unit });
  }
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .order('period', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toInvoice);
}

export async function fetchAllFeeSchedules(): Promise<FeeSchedule[]> {
  const { data, error } = await supabase.from('fee_schedules').select('*').order('unit');
  if (error) throw error;
  return (data ?? []).map(toFeeSchedule);
}

export async function setFeeSchedule(unit: string, monthlyAmount: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('fee_schedules').upsert({
    unit,
    monthly_amount: monthlyAmount,
    updated_by: user?.id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function recordInvoicePayment(invoiceId: string, payment: {
  paidDate: string;
  method: 'bank_transfer' | 'cash' | 'cheque' | 'other';
  reference: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from('invoices').update({
    status: 'paid',
    paid_date: payment.paidDate,
    payment_method: payment.method,
    payment_reference: payment.reference,
    recorded_by: user?.id,
  }).eq('id', invoiceId);
  if (error) throw error;

  await logAudit({
    action: 'invoice_payment_recorded',
    entityType: 'invoice',
    entityId: invoiceId,
    field: 'status',
    before: 'unpaid',
    after: 'paid',
  });
}
```

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add services/dataService.ts
git commit -m "feat: add billing data functions (fee schedules, invoices, payment recording)"
```

---

### Task 3: components/Billing.tsx (RESIDENT/TENANT view)

**Files:**
- Create: `components/Billing.tsx`

**Interfaces:**
- Consumes: `fetchInvoices(unit)` and `Invoice` from Task 2;
  `useAuth()` (`userProfile.unit` — same field `Dashboard.tsx` already
  reads for the unit label); design tokens established across the app.
- Produces: a self-contained page component with no props, matching every
  other top-level view component's shape (`Dashboard`, `Documents`, etc.).

- [ ] **Step 1: Read `Documents.tsx` for the page-header pattern to match**

`Documents.tsx` (already restyled in the visual redesign) is the closest
existing precedent for a simple list page with a colored icon-badge
header — read its current header markup (top ~20 lines) before writing
Step 2, so the new page's header matches exactly rather than being a
close-but-different reimplementation.

- [ ] **Step 2: Write the component**

```tsx
import React, { useEffect, useState } from 'react';
import { Receipt, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { fetchInvoices, Invoice } from '../services/dataService';

export const Billing: React.FC = () => {
  const { userProfile } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.unit) { setLoading(false); return; }
    fetchInvoices(userProfile.unit)
      .then(setInvoices)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userProfile?.unit]);

  const current = invoices[0];
  const isOverdue = current?.status === 'unpaid' && new Date(current.dueDate) < new Date();
  const history = invoices.filter(inv => inv.status === 'paid');

  return (
    <div className="pb-12">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
          <Receipt size={24} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">Billing</h2>
          <p className="text-nadayu-muted text-sm mt-1">Maintenance fee statement for {userProfile?.unit ?? 'your unit'}</p>
        </div>
      </div>

      {loading && <p className="text-nadayu-muted text-sm">Loading...</p>}

      {!loading && !current && (
        <div className="bg-white border border-nadayu-border rounded-2xl p-8 text-center text-nadayu-muted">
          No billing set up for your unit yet. Contact management if you believe this is an error.
        </div>
      )}

      {current && (
        <div className={`rounded-2xl p-6 mb-6 border ${isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-nadayu-border'}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold uppercase tracking-widest text-nadayu-muted">Current Period · {current.period}</p>
            {isOverdue && (
              <span className="flex items-center gap-1 text-xs font-bold text-red-600 uppercase">
                <AlertTriangle size={14} /> Overdue
              </span>
            )}
            {current.status === 'paid' && (
              <span className="flex items-center gap-1 text-xs font-bold text-nadayu-success uppercase">
                <CheckCircle2 size={14} /> Paid
              </span>
            )}
          </div>
          <p className="text-4xl font-bold text-gray-900 mb-1">RM {current.amount.toFixed(2)}</p>
          <p className="text-sm text-nadayu-muted">Due {new Date(current.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
      )}

      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">Payment History</h3>
      <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
            <tr>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Paid Date</th>
              <th className="px-6 py-4">Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {history.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-nadayu-muted">No payment history yet.</td></tr>
            )}
            {history.map(inv => (
              <tr key={inv.id}>
                <td className="px-6 py-4 font-bold text-gray-900">{inv.period}</td>
                <td className="px-6 py-4 text-gray-900">RM {inv.amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-nadayu-muted">{inv.paidDate ? new Date(inv.paidDate).toLocaleDateString('en-GB') : '-'}</td>
                <td className="px-6 py-4 text-nadayu-muted capitalize">{inv.paymentMethod?.replace('_', ' ') ?? '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

- [ ] **Step 3: Verify**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed. (This component isn't wired into routing yet —
Task 5 does that — so it won't be reachable in the running app until
then, but it must still type-check and build standalone.)

- [ ] **Step 4: Commit**

```bash
git add components/Billing.tsx
git commit -m "feat: add resident/tenant Billing page"
```

---

### Task 4: AdminPanel.tsx — Billing tab

**Files:**
- Modify: `components/AdminPanel.tsx`

**Interfaces:**
- Consumes: `fetchAllInvoices`, `fetchAllFeeSchedules`, `setFeeSchedule`,
  `recordInvoicePayment`, `Invoice`, `FeeSchedule` from Task 2.
- Produces: a fourth tab in the existing tab bar, no changes to the
  Overview/Users/Audit Log tabs' behavior.

- [ ] **Step 1: Read the current file in full**

Read `components/AdminPanel.tsx` completely before editing — it was
modified multiple times during the visual redesign earlier this session
and its exact current line numbers/content must be confirmed, not
assumed.

- [ ] **Step 2: Add imports and state**

Add to the existing import from `../services/dataService` (currently
`import { fetchViolations, fetchReports, fetchUsers, updateUserRole,
fetchAuditLog, AuditLogEntry, updateViolationStatus } from
'../services/dataService';`) — extend it to also import:
`fetchAllInvoices, fetchAllFeeSchedules, setFeeSchedule,
recordInvoicePayment, Invoice, FeeSchedule`.

Add a `Receipt` icon to the existing `lucide-react` import line.

Add new state, near the existing `auditLog`/`auditFilter` state:

```tsx
const [invoices, setInvoices] = useState<Invoice[]>([]);
const [feeSchedules, setFeeSchedules] = useState<FeeSchedule[]>([]);
const [paymentModalInvoice, setPaymentModalInvoice] = useState<Invoice | null>(null);
const [paymentForm, setPaymentForm] = useState({ paidDate: '', method: 'bank_transfer' as 'bank_transfer' | 'cash' | 'cheque' | 'other', reference: '' });
const [editingRateUnit, setEditingRateUnit] = useState<string | null>(null);
const [rateInput, setRateInput] = useState('');
const [newUnitId, setNewUnitId] = useState('');
const [newUnitRate, setNewUnitRate] = useState('');

const loadBilling = () => {
  fetchAllInvoices().then(setInvoices).catch(() => {});
  fetchAllFeeSchedules().then(setFeeSchedules).catch(() => {});
};

useEffect(() => {
  if (activeTab === 'billing') loadBilling();
}, [activeTab]);

const handleSaveRate = async (unit: string) => {
  const amount = parseFloat(rateInput);
  if (isNaN(amount) || amount < 0) return;
  await setFeeSchedule(unit, amount);
  setEditingRateUnit(null);
  loadBilling();
};

const handleRecordPayment = async () => {
  if (!paymentModalInvoice || !paymentForm.paidDate || !paymentForm.reference) return;
  await recordInvoicePayment(paymentModalInvoice.id, paymentForm);
  setPaymentModalInvoice(null);
  setPaymentForm({ paidDate: '', method: 'bank_transfer', reference: '' });
  loadBilling();
};
```

Update the `activeTab` state type from
`useState<'overview' | 'users' | 'audit'>('overview')` to
`useState<'overview' | 'users' | 'audit' | 'billing'>('overview')`.

- [ ] **Step 3: Add the tab button**

Change the tab array from `(['overview', 'users', 'audit'] as const)` to
`(['overview', 'users', 'billing', 'audit'] as const)`, and extend the
label ternary:

```tsx
{tab === 'overview' ? 'Overview' : tab === 'users' ? 'Users' : tab === 'billing' ? 'Billing' : 'Audit Log'}
```

- [ ] **Step 4: Add the tab content block**

Insert a new `{activeTab === 'billing' && (...)}` block, placed after the
existing `{activeTab === 'users' && (...)}` block and before
`{activeTab === 'audit' && (...)}`:

```tsx
{activeTab === 'billing' && (
  <div className="space-y-5">
    <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">Fee Schedules</h3>
        <p className="text-xs text-nadayu-muted mt-0.5">Monthly maintenance fee per unit</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
            <tr>
              <th className="px-6 py-4">Unit</th>
              <th className="px-6 py-4">Monthly Amount</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {feeSchedules.map(fs => (
              <tr key={fs.unit}>
                <td className="px-6 py-4 font-bold text-gray-900">{fs.unit}</td>
                <td className="px-6 py-4 text-gray-900">
                  {editingRateUnit === fs.unit ? (
                    <input
                      type="number"
                      value={rateInput}
                      onChange={e => setRateInput(e.target.value)}
                      className="w-28 px-2 py-1 border border-nadayu-border rounded-lg text-sm"
                      autoFocus
                    />
                  ) : (
                    `RM ${fs.monthlyAmount.toFixed(2)}`
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {editingRateUnit === fs.unit ? (
                    <button onClick={() => handleSaveRate(fs.unit)} className="font-bold text-xs text-nadayu-accent">Save</button>
                  ) : (
                    <button onClick={() => { setEditingRateUnit(fs.unit); setRateInput(String(fs.monthlyAmount)); }} className="font-bold text-xs text-nadayu-muted hover:text-nadayu-panel">Edit</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-gray-50 flex items-center gap-2">
        <input
          type="text"
          placeholder="New unit (e.g. C-08-01)"
          value={newUnitId}
          onChange={e => setNewUnitId(e.target.value)}
          className="px-3 py-2 border border-nadayu-border rounded-lg text-sm flex-1"
        />
        <input
          type="number"
          placeholder="Monthly RM"
          value={newUnitRate}
          onChange={e => setNewUnitRate(e.target.value)}
          className="w-28 px-3 py-2 border border-nadayu-border rounded-lg text-sm"
        />
        <button
          onClick={async () => {
            const amount = parseFloat(newUnitRate);
            if (!newUnitId || isNaN(amount)) return;
            await setFeeSchedule(newUnitId, amount);
            setNewUnitId('');
            setNewUnitRate('');
            loadBilling();
          }}
          className="bg-nadayu-panel text-white px-4 py-2 rounded-lg font-bold text-xs"
        >
          Add
        </button>
      </div>
    </div>

    <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden">
      <div className="px-6 pt-5 pb-4 border-b border-gray-50">
        <h3 className="text-sm font-semibold text-gray-900">Invoices</h3>
        <p className="text-xs text-nadayu-muted mt-0.5">All units, most recent period first</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="uppercase text-[10px] tracking-widest font-bold text-nadayu-muted bg-nadayu-cream/50">
            <tr>
              <th className="px-6 py-4">Unit</th>
              <th className="px-6 py-4">Period</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.map(inv => (
              <tr key={inv.id}>
                <td className="px-6 py-4 font-bold text-gray-900">{inv.unit}</td>
                <td className="px-6 py-4 text-nadayu-muted">{inv.period}</td>
                <td className="px-6 py-4 text-gray-900">RM {inv.amount.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    inv.status === 'paid' ? 'bg-nadayu-success/15 text-nadayu-success' : 'bg-orange-50 text-orange-500'
                  }`}>
                    {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {inv.status === 'unpaid' && (
                    <button onClick={() => setPaymentModalInvoice(inv)} className="font-bold text-xs text-nadayu-muted hover:text-nadayu-panel">Record Payment</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

{paymentModalInvoice && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setPaymentModalInvoice(null)}>
    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="bg-nadayu-panel p-6">
        <h3 className="text-white font-bold text-lg flex items-center gap-2">
          <Receipt size={18} className="text-nadayu-accent" /> Record Payment
        </h3>
        <p className="text-slate-400 text-xs mt-1">{paymentModalInvoice.unit} · {paymentModalInvoice.period} · RM {paymentModalInvoice.amount.toFixed(2)}</p>
      </div>
      <div className="p-6 space-y-4">
        <div>
          <label className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider block mb-1">Paid Date</label>
          <input type="date" value={paymentForm.paidDate} onChange={e => setPaymentForm({ ...paymentForm, paidDate: e.target.value })} className="w-full px-3 py-2 border border-nadayu-border rounded-lg text-sm" />
        </div>
        <div>
          <label className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider block mb-1">Method</label>
          <select value={paymentForm.method} onChange={e => setPaymentForm({ ...paymentForm, method: e.target.value as typeof paymentForm.method })} className="w-full px-3 py-2 border border-nadayu-border rounded-lg text-sm">
            <option value="bank_transfer">Bank Transfer</option>
            <option value="cash">Cash</option>
            <option value="cheque">Cheque</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-bold text-nadayu-muted uppercase tracking-wider block mb-1">Reference No.</label>
          <input type="text" value={paymentForm.reference} onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })} className="w-full px-3 py-2 border border-nadayu-border rounded-lg text-sm" placeholder="e.g. transaction ID" />
        </div>
      </div>
      <div className="px-6 pb-6 flex gap-3">
        <button onClick={handleRecordPayment} className="flex-1 bg-nadayu-panel text-white py-3 rounded-xl font-bold text-sm hover:brightness-110 transition-colors">Confirm</button>
        <button onClick={() => setPaymentModalInvoice(null)} className="flex-1 bg-nadayu-cream text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors">Cancel</button>
      </div>
    </div>
  </div>
)}
```

Place the `{paymentModalInvoice && (...)}` modal block as a sibling right
after the existing `{selectedViolation && (...)}` violation modal block
(both are conditionally-rendered overlays at the same nesting level,
outside any specific tab's block, so either modal can show regardless of
which tab is active — matching how `selectedViolation`'s modal already
works today).

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add components/AdminPanel.tsx
git commit -m "feat: add Billing tab to AdminPanel (fee schedules, invoices, payment recording)"
```

---

### Task 5: Wire the 'billing' view into navigation (RESIDENT/TENANT)

**Files:**
- Modify: `App.tsx`
- Modify: `components/MoreMenu.tsx`
- Modify: `components/MobileTabBar.tsx` — only if the "More" tab logic
  needs it (see Step 3 — likely no change needed there beyond the data
  already driving it from `MoreMenu`'s list, confirm during Step 3).

**Interfaces:**
- Consumes: `Billing` component from Task 3.
- Produces: `'billing'` is a reachable `currentView` value for
  RESIDENT/TENANT, accessible via the desktop sidebar is NOT required by
  spec (spec says "More" list, not the sidebar's always-expanded list —
  see spec's Mobile bottom tab bar section, which only discusses the
  mobile "More" list; but the desktop sidebar's `navItems` in
  `Navigation.tsx` is the SAME list `MoreMenu` doesn't use — re-read the
  spec: desktop sidebar shows every item in `Navigation.tsx`'s
  `navItems`, unfiltered by "direct vs more" the way mobile is. Add
  `billing` to `Navigation.tsx`'s `navItems` too, so desktop users see it
  in the always-visible sidebar list (desktop has no such thing as a
  "More" concept — that's mobile-only), and ALSO add it to
  `MoreMenu.tsx`'s list for the mobile "More" page. Both are needed;
  they serve different breakpoints.

- [ ] **Step 1: Add the case to `App.tsx`**

Add the import (alongside the other component imports):
```tsx
import { Billing } from './components/Billing';
```

Add the case (in `renderContent`'s `switch`, alongside the `'community'`
case):
```tsx
      case 'billing':
        return <Billing />;
```

- [ ] **Step 2: Add to `Navigation.tsx`'s desktop sidebar list**

Add `Receipt` to the `lucide-react` import.

Add a new entry to the `navItems` array, positioned after `'documents'`
(billing is a similarly "reference/account" type item, grouped near
Documents rather than the action-oriented items like Parking):

```tsx
    { id: 'billing',      label: 'Billing',            icon: Receipt,       roles: [UserRole.RESIDENT, UserRole.TENANT] },
```

- [ ] **Step 3: Add to `MoreMenu.tsx`'s RESIDENT and TENANT lists**

Add `Receipt` to the `lucide-react` import.

Add an entry to both the `[UserRole.RESIDENT]` and `[UserRole.TENANT]`
arrays in `MORE_ITEMS` (after `documents`, matching the sidebar's
ordering):

```tsx
    { id: 'billing', label: 'Billing', icon: Receipt },
```

`MobileTabBar.tsx` needs no change — its "More" tab already routes to
`currentView = 'more'` regardless of what `MoreMenu` lists, and its
`moreIsActive` check (`config.more.some(item => item.id === currentView)`)
only affects the *tab bar's own* highlight state for items in its own
`TABS_BY_ROLE[...].more` array, which is a separate (currently
identical-looking but independently maintained) list from
`MoreMenu.tsx`'s `MORE_ITEMS`. Since `billing` isn't in
`MobileTabBar.tsx`'s `more` array, visiting Billing via the More menu
will correctly show the "More" tab as active only through the
`currentView === 'more'` fallback in `moreIsActive`'s sibling check — re-read
`MobileTabBar.tsx`'s exact condition (`moreIsActive || currentView ===
'more'`) before assuming this is fine: `moreIsActive` will be `false` for
`currentView === 'billing'` (since `'billing'` isn't in `MobileTabBar`'s
own `more` list), and `currentView === 'more'` is also `false` once
navigated onward to the Billing page itself — meaning the tab bar will
show **no** tab highlighted while actually on the Billing page. This is a
real (if minor) UX gap: add `billing` to `MobileTabBar.tsx`'s
`TABS_BY_ROLE[UserRole.RESIDENT].more` and
`TABS_BY_ROLE[UserRole.TENANT].more` arrays too, so the highlight logic
stays correct:

```tsx
      { id: 'billing', label: 'Billing', icon: Receipt },
```

(add this line to both roles' `more` arrays in `MobileTabBar.tsx`,
alongside the existing `documents`/`amenities`/`community`/`account`
entries — add the `Receipt` import to `MobileTabBar.tsx`'s
`lucide-react` import line too).

- [ ] **Step 4: Verify**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 5: Commit**

```bash
git add App.tsx components/Navigation.tsx components/MoreMenu.tsx components/MobileTabBar.tsx
git commit -m "feat: wire Billing into desktop sidebar and mobile More menu for residents/tenants"
```

---

### Task 6: Full regression pass and deploy

**Files:** none (verification only)

**Interfaces:**
- Consumes: the complete feature from Tasks 1-5.

- [ ] **Step 1: Re-run the RLS/idempotency script**

```bash
node scripts/verify-billing-rls.mjs
```
Expected: all `PASS:` lines, no `FAIL:` lines (confirms nothing in Tasks
2-5 broke what Task 1 set up).

- [ ] **Step 2: Full build verification**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 3: Manual Playwright pass**

Start the dev server. Using the seeded accounts:

- Log in as `hafiz.a@email.com` (MANAGEMENT), go to Admin Panel → Billing
  tab. Set a fee schedule for unit `B-06-02` (e.g. RM 150) if Task 1's
  verify script hasn't already left one. Confirm an invoice for the
  current period appears in the Invoices table after a refresh (the lazy
  generation should have run when the tab loaded).
- Click "Record Payment" on that invoice, fill in a date/method/reference,
  confirm. Verify the row's status flips to "paid" and a new entry with
  action `invoice_payment_recorded` appears in the existing Audit Log tab.
- Log in as `karwai.wong@email.com` (RESIDENT, unit `B-06-02`). Confirm
  the desktop sidebar shows a "Billing" item, and that page shows the
  now-paid current invoice plus that payment in the history table.
- Resize to 390px width. Confirm "Billing" does NOT appear as one of the
  4 direct bottom tabs (unchanged), tap "More", confirm "Billing" is
  listed there, tap it, confirm the page renders and the bottom tab bar's
  "More" tab shows as active while on the Billing page (this is the
  specific behavior Task 5 Step 3 added — verify it actually works, don't
  just trust the code read).
- Log in as `siewling.ng@email.com` (SECURITY). Confirm there is no
  Billing entry anywhere in their nav (sidebar, mobile tabs, or More
  menu) — this role has no access per the spec.

- [ ] **Step 4: Deploy**

```bash
git push origin main
npx vercel deploy --prod --scope ty28
```
Expected: deployment succeeds, production alias
`https://nadayu28-booking.vercel.app` updates.
