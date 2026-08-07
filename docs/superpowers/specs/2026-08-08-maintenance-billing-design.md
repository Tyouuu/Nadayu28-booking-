# Maintenance Fee Billing (Phase 4a)

## Context

Competitive research against real property management platforms (Buildium,
AppFolio, and Malaysian JMB/MC-specific software like i-Neighbour and
Advelsoft) surfaced the single biggest functional gap in Nadayu28: there is
no billing/fee-collection feature at all. Every real platform in this
category treats recurring maintenance-fee billing (plus, for Malaysian
strata properties, sinking fund/levy tracking) as core, table-stakes
functionality — see [[project-gotomarket-strategy]] memory: since price is
the only competitive lever available, feature parity on things a real
property office would expect is what makes the low price a viable pitch
rather than a red flag.

The existing `violations` table/UI (one-off fines: parking overstay, late
cancellation) is a different concept from recurring monthly maintenance
fees and is explicitly kept separate — see Non-goals.

**Scope for this phase, as decided:** build the billing/statement
experience — residents see their fee statement and payment history,
management sets per-unit rates and records payments received — without
integrating a real payment gateway. Real online payment (FPX or similar)
is an explicit non-goal, deferred to a later phase.

## Data model

Two new tables, migration file `supabase_billing.sql`, run after
`supabase_documents.sql` (reuses `public.is_management()`):

```sql
CREATE TABLE public.fee_schedules (
  unit          TEXT PRIMARY KEY,
  monthly_amount NUMERIC(10,2) NOT NULL,
  updated_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.invoices (
  id                TEXT PRIMARY KEY,
  unit              TEXT NOT NULL,
  period            TEXT NOT NULL,        -- 'YYYY-MM', e.g. '2026-08'
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
```

`fee_schedules.unit` is the source of truth for what a unit owes each
month — one row per unit, editable only by MANAGEMENT. `invoices` is the
generated ledger: one row per unit per month. The `UNIQUE (unit, period)`
constraint is what makes generation idempotent (see below). `due_date` is
set to the 14th of the invoice's period month at generation time (a fixed
convention, not per-unit configurable, matching how the existing
`violations` amounts are single flat values rather than negotiated terms).

## Automatic monthly generation — lazy, not cron-based

**Decision: generate invoices lazily on read, not via `pg_cron`.** A
Postgres function does the generation:

```sql
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
```

`fetchInvoices(unit)` (resident/tenant path) calls
`ensure_invoices_for_unit(unit)` before querying, for their own unit only.
`fetchAllInvoices()` (management path) loops this across every unit with a
`fee_schedules` row before querying. Either way, whoever opens the Billing
page first after the 1st of a new month is the one who triggers that
month's generation — invisibly, with no manual step and no missed months,
which is the user-visible behavior "automatic generation" was meant to
deliver.

**Why not `pg_cron`:** true cron-based generation was considered, but
`pg_cron` availability isn't verified on this Supabase project's tier, and
a failed/silently-skipped cron job would be a worse failure mode (invoices
just don't appear, with no obvious cause) than the lazy approach (which
can't silently fail — it runs synchronously as part of a page load
someone is already looking at). The lazy approach is also simpler: no
extension dependency, no schedule to maintain, and it self-heals if the
app has zero traffic for a stretch (the next visit generates everything
that was missed, since the function is called per-unit and there's no
"only generate for the immediately-preceding period" restriction — it
always generates for `CURRENT_DATE`'s period, so gaps of months without
a visit would still only backfill the current month, not retroactively
fill skipped months; this is an accepted limitation given a real property
manager is expected to check the app at least monthly).

## RLS

```sql
ALTER TABLE public.fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

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
```

This mirrors the exact pattern already in production for
`violations_select` (`unit = (SELECT unit FROM public.profiles WHERE id =
auth.uid())`) — a subquery against `profiles` from a policy on a
*different* table, which is safe and already proven; it is not the
self-referencing-policy pattern that caused Phase 2's recursion bug.

`ensure_invoices_for_unit` is `SECURITY DEFINER` so it can insert rows
regardless of the caller's RLS — same justification as `is_management()`.

## Roles and UI surfaces

- **RESIDENT / TENANT**: new top-level nav item **Billing** (own component,
  `components/Billing.tsx`), alongside Dashboard/Documents/Parking/etc.
  Shows: current period's amount and due date (overdue ones visually
  flagged), and a payment history table (past invoices with paid
  date/method/reference once settled).
- **MANAGEMENT**: no new top-level nav item. A new **Billing** tab inside
  `AdminPanel.tsx`, alongside the existing Overview/Users/Audit Log tabs —
  consistent with how Users and Audit Log were added in Phase 2. Two
  sections: a fee-schedule editor (per-unit monthly amount, inline edit),
  and an all-units invoice table (unit, period, amount, status, actions)
  with a "Record Payment" action that opens a modal collecting payment
  date, method (bank transfer/cash/cheque/other), and reference number —
  the same modal interaction shape as the existing violation "Mark as
  Paid" flow in `AdminPanel.tsx`, not a copy of its code (different data).
- **SECURITY**: no access — this role has no legitimate use for billing
  data, consistent with the reasoning that scoped Documents/Maintenance
  access by relevance rather than exposing everything to every role.

Recording a payment writes an `audit_log` entry (extending the existing
`action` CHECK constraint in `supabase_audit_trail.sql` to add
`'invoice_payment_recorded'`), consistent with how violation status
changes and report updates are already tracked.

### Mobile bottom tab bar

RESIDENT/TENANT's bottom tab bar (`components/MobileTabBar.tsx`) currently
has 4 direct tabs (Home/Parking/Invite/Report) + More (Documents/
Amenities/Community/Account). Billing does not displace any of the 4
direct tabs — a monthly bill isn't a multiple-times-a-day action the way
parking/QR-invite are — so it's added to the "More" list, alongside
Documents.

## Non-goals

- No real payment gateway integration (FPX or otherwise) — this phase is
  statement/ledger display and manual payment recording only.
- No merging with the existing `violations` (fines) system — they stay
  two separate concepts with two separate UIs, as decided.
- No partial payments — an invoice is either `unpaid` or `paid` in full;
  no tracking of partial amounts paid against a balance.
- No late-payment penalty/interest calculation.
- No per-unit configurable due-date — fixed at the 14th of the period
  month for every unit.
- No retroactive backfill of invoices for months with zero app traffic
  beyond the current period (see generation section above).
- No e-Invoice (LHDN) compliance work — noted in research as a real
  future requirement once actual payment collection exists, but
  irrelevant while no real money moves through this feature.

## Testing / verification approach

Same pattern as every previous phase: no formal test suite.
`npx tsc --noEmit` + `npm run build` per task, plus a standalone
`scripts/verify-billing-rls.mjs` (signed in as a resident and as
management, via `@supabase/supabase-js`) confirming: a resident can read
their own unit's fee schedule and invoices but not another unit's, a
resident cannot write to either table, management can read/write both
across all units, and `ensure_invoices_for_unit` generates exactly one
invoice per unit per period even when called multiple times (idempotency
check — call it 3 times in a row, assert only one row exists for that
unit+period). Manual Playwright pass: resident view shows current-month
invoice after first load, management can set a rate for a test unit,
confirm an invoice appears, record a payment, confirm status flips to
paid and the audit log gets a new entry.

## Open questions / risks

- **Existing units without a `fee_schedules` row generate no invoices.**
  This is intentional (a unit management hasn't priced yet shouldn't be
  silently billed some default amount), but means management must set a
  rate for every real unit before residents see anything — worth a quick
  bulk-entry pass during rollout, not something the app needs to solve
  structurally in this phase.
- **`ensure_invoices_for_unit`'s per-unit loop for management's
  all-units view** means opening the Billing tab does up to N small
  writes (N = number of priced units) before the read. Fine at this
  project's scale (a single 28-unit-ish residential building); would need
  batching into a single set-based SQL function if this pattern were ever
  reused for a multi-property platform, which is out of scope here.
