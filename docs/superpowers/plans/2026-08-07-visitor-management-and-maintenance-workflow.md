# Visitor Management & Maintenance Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Phase 1 from `docs/superpowers/specs/2026-08-07-visitor-management-and-maintenance-workflow-design.md` — visitor invite/check-in with MyKad photo capture, and a maintenance report closed-loop (assign, progress, resolve, resident visibility, overdue signal).

**Architecture:** Direct-client Supabase access (no backend API layer), following the existing pattern in `services/dataService.ts`: typed row-mapper functions + thin CRUD wrappers, consumed directly by React components via `useEffect`/event handlers. New Supabase Storage bucket (`visitor-ids`, private) for MyKad photos. New nav-routed components wired through `App.tsx` / `components/Navigation.tsx`, following the existing `currentView` string-switch pattern (no router library in this app).

**Tech Stack:** React 19 + TypeScript + Vite, Supabase (Postgres + Auth + RLS + Storage), `qrcode.react`, `html5-qrcode`, Tailwind utility classes (no CSS files), Zod for form validation (existing schemas only — no new ones needed since new forms use inline required-field checks, matching `Reporting.tsx`'s pattern for its file-upload step).

## Global Constraints

- **No formal test suite exists in this repo** (no Jest/Vitest configured, `package.json` has no test script). Follow the project's established verification approach instead of writing unit tests: SQL verification queries for schema changes, `npx tsc --noEmit` for type safety, and manual Playwright-driven browser smoke tests against the live Supabase project for behavior — this matches how login, booking, and the `auth.users` bug were all verified earlier in this project. Do not introduce a new test framework as part of this plan.
- All new UI text is plain English strings, not routed through the `useI18n()` `t.*` system. The existing codebase already mixes hardcoded strings with `t.*` in components like `Reporting.tsx` ("Provide Details", etc.) — full 3-locale translation of new copy is out of scope per the spec's non-goals (visual/i18n polish is deferred to Phase 3).
- Match existing visual style exactly: `#111111` dark panels, `#C8FF00` lime accent, `rounded-2xl`/`rounded-xl` cards, no new component library.
- `resident_unit`/`unit` naming: always the denormalized text unit code (e.g. `A-12-05`), matching `bookings.resident_unit` and `reports.resident_unit`.
- Every task must leave `npx tsc --noEmit` passing and the app buildable (`npm run build`) before moving to the next task.

---

## Task 1: Database migration — visitors table, storage bucket, reports columns

**Files:**
- Create: `supabase_visitors_and_maintenance.sql`

**Interfaces:**
- Produces: table `public.visitors` (columns: `id, resident_id, resident_unit, visitor_name, visitor_phone, purpose, expected_arrival, expected_departure, status, actual_arrival, id_photo_path, qr_code, created_at`), private storage bucket `visitor-ids`, and `public.reports` gaining `assigned_to_name text`, `resolution_notes text` (and losing `assigned_to uuid`).

- [ ] **Step 1: Write the migration SQL file**

```sql
-- ============================================================
-- Nadayu28 Community Portal - Visitor Management + Maintenance
-- Run AFTER supabase_schema_complete.sql, supabase_facilities.sql,
-- supabase_seed.sql, supabase_users.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================

-- ── TABLE: visitors ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.visitors (
  id                  TEXT        PRIMARY KEY,
  resident_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  resident_unit       TEXT,
  visitor_name        TEXT        NOT NULL,
  visitor_phone       TEXT,
  purpose             TEXT,
  expected_arrival    TIMESTAMPTZ NOT NULL,
  expected_departure  TIMESTAMPTZ,
  status              TEXT        DEFAULT 'scheduled'
                                  CHECK (status IN ('scheduled','arrived','departed','flagged')),
  actual_arrival      TIMESTAMPTZ,
  id_photo_path       TEXT,
  qr_code             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visitors_resident  ON public.visitors(resident_id);
CREATE INDEX IF NOT EXISTS idx_visitors_status    ON public.visitors(status);
CREATE INDEX IF NOT EXISTS idx_visitors_expected  ON public.visitors(expected_arrival);

ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "visitors_select"       ON public.visitors;
DROP POLICY IF EXISTS "visitors_insert"       ON public.visitors;
DROP POLICY IF EXISTS "visitors_update_staff" ON public.visitors;

CREATE POLICY "visitors_select" ON public.visitors
  FOR SELECT USING (
    auth.uid() = resident_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

CREATE POLICY "visitors_insert" ON public.visitors
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "visitors_update_staff" ON public.visitors
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

-- ── STORAGE: visitor-ids (private, staff-only) ──────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('visitor-ids', 'visitor-ids', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "visitor_ids_staff_select" ON storage.objects;
DROP POLICY IF EXISTS "visitor_ids_staff_insert" ON storage.objects;

CREATE POLICY "visitor_ids_staff_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'visitor-ids'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

CREATE POLICY "visitor_ids_staff_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'visitor-ids'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

-- ── ALTER: reports (maintenance workflow) ───────────────────
ALTER TABLE public.reports DROP COLUMN IF EXISTS assigned_to;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS assigned_to_name TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS resolution_notes TEXT;

-- ── VERIFY ──────────────────────────────────────────────────
SELECT 'visitors' AS tbl, COUNT(*) AS rows FROM public.visitors;

SELECT policyname FROM pg_policies WHERE tablename = 'visitors' ORDER BY policyname;

SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reports'
ORDER BY column_name;

SELECT id, public FROM storage.buckets WHERE id = 'visitor-ids';
```

- [ ] **Step 2: Run the migration**

Open the Supabase project dashboard > SQL Editor > New Query, paste the full file contents, and run it.

- [ ] **Step 3: Verify**

Confirm the final four `SELECT` statements in the script return:
- `visitors` row count = 0 (empty new table)
- 3 policy names: `visitors_select`, `visitors_insert`, `visitors_update_staff`
- `reports` columns include `assigned_to_name` and `resolution_notes`, and do **not** include `assigned_to`
- one row for bucket `visitor-ids` with `public = false`

- [ ] **Step 4: Commit**

```bash
git add supabase_visitors_and_maintenance.sql
git commit -m "feat: add visitors table, visitor-ids storage bucket, maintenance columns on reports"
```

---

## Task 2: dataService — visitor create/fetch functions

**Files:**
- Modify: `services/dataService.ts`

**Interfaces:**
- Consumes: `supabase` client from `./supabase` (existing import at top of file).
- Produces:
  - `interface Visitor { id, residentId, residentUnit, visitorName, visitorPhone?, purpose?, expectedArrival, expectedDeparture?, status: 'scheduled'|'arrived'|'departed'|'flagged', actualArrival?, idPhotoPath?, qrCode? }`
  - `createVisitor(params: { visitorName, visitorPhone?, purpose?, expectedArrival, expectedDeparture?, unit }): Promise<{ id: string; qrCode: string }>`
  - `fetchVisitors(unit?: string): Promise<Visitor[]>`
  - `fetchVisitorById(id: string): Promise<Visitor | null>`

- [ ] **Step 1: Add the `Visitor` type, mapper, and CRUD functions**

Append to the end of `services/dataService.ts` (after the `createFacilityBooking` function, i.e. the end of the file):

```ts
// ── Visitors ──────────────────────────────────────────────────

export interface Visitor {
  id: string;
  residentId: string | null;
  residentUnit: string;
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  expectedArrival: string;
  expectedDeparture?: string;
  status: 'scheduled' | 'arrived' | 'departed' | 'flagged';
  actualArrival?: string;
  idPhotoPath?: string;
  qrCode?: string;
}

function toVisitor(row: Record<string, unknown>): Visitor {
  return {
    id: row.id as string,
    residentId: (row.resident_id as string) ?? null,
    residentUnit: row.resident_unit as string,
    visitorName: row.visitor_name as string,
    visitorPhone: row.visitor_phone as string | undefined,
    purpose: row.purpose as string | undefined,
    expectedArrival: row.expected_arrival as string,
    expectedDeparture: row.expected_departure as string | undefined,
    status: row.status as Visitor['status'],
    actualArrival: row.actual_arrival as string | undefined,
    idPhotoPath: row.id_photo_path as string | undefined,
    qrCode: row.qr_code as string | undefined,
  };
}

export async function createVisitor(params: {
  visitorName: string;
  visitorPhone?: string;
  purpose?: string;
  expectedArrival: string;
  expectedDeparture?: string;
  unit: string;
}): Promise<{ id: string; qrCode: string }> {
  const { data: { user } } = await supabase.auth.getUser();
  const id = 'v' + Date.now();
  const qrPayload = JSON.stringify({ type: 'visitor', id });

  const { error } = await supabase.from('visitors').insert({
    id,
    resident_id: user?.id,
    resident_unit: params.unit,
    visitor_name: params.visitorName,
    visitor_phone: params.visitorPhone,
    purpose: params.purpose,
    expected_arrival: params.expectedArrival,
    expected_departure: params.expectedDeparture,
    qr_code: qrPayload,
  });
  if (error) throw error;

  return { id, qrCode: qrPayload };
}

export async function fetchVisitors(unit?: string): Promise<Visitor[]> {
  let query = supabase.from('visitors').select('*').order('expected_arrival', { ascending: false });
  if (unit) query = query.eq('resident_unit', unit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toVisitor);
}

export async function fetchVisitorById(id: string): Promise<Visitor | null> {
  const { data, error } = await supabase.from('visitors').select('*').eq('id', id).limit(1);
  if (error || !data || data.length === 0) return null;
  return toVisitor(data[0]);
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/dataService.ts
git commit -m "feat: add visitor create/fetch functions to dataService"
```

---

## Task 3: dataService — visitor check-in, photo upload, mark-departed

**Files:**
- Modify: `services/dataService.ts`

**Interfaces:**
- Consumes: `Visitor`, `toVisitor` from Task 2 (same file).
- Produces:
  - `uploadVisitorIdPhoto(visitorId: string, file: File): Promise<string>`
  - `checkInVisitor(visitorId: string): Promise<{ flagged: boolean }>` — sets `status` to `'flagged'` if `now()` is more than 30 minutes from `expected_arrival`, otherwise `'arrived'`; always sets `actual_arrival`.
  - `markVisitorDeparted(visitorId: string): Promise<void>` — sets `status = 'departed'`. Callable from either `'arrived'` or `'flagged'` state (a flagged arrival still needs to be closed out).

- [ ] **Step 1: Add the functions**

Append to `services/dataService.ts`, directly after the `fetchVisitorById` function added in Task 2:

```ts
export async function uploadVisitorIdPhoto(visitorId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${visitorId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from('visitor-ids').upload(path, file);
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase.from('visitors').update({ id_photo_path: path }).eq('id', visitorId);
  if (updateError) throw updateError;

  return path;
}

export async function checkInVisitor(visitorId: string): Promise<{ flagged: boolean }> {
  const { data, error: fetchError } = await supabase
    .from('visitors')
    .select('expected_arrival')
    .eq('id', visitorId)
    .single();
  if (fetchError || !data) throw fetchError ?? new Error('Visitor not found');

  const now = new Date();
  const expected = new Date(data.expected_arrival as string);
  const diffMinutes = Math.abs(now.getTime() - expected.getTime()) / 60000;
  const flagged = diffMinutes > 30;

  const { error } = await supabase.from('visitors').update({
    status: flagged ? 'flagged' : 'arrived',
    actual_arrival: now.toISOString(),
  }).eq('id', visitorId);
  if (error) throw error;

  return { flagged };
}

export async function markVisitorDeparted(visitorId: string): Promise<void> {
  const { error } = await supabase.from('visitors').update({ status: 'departed' }).eq('id', visitorId);
  if (error) throw error;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/dataService.ts
git commit -m "feat: add visitor check-in, MyKad photo upload, and mark-departed functions"
```

---

## Task 4: dataService + types — maintenance report update, extended Report fields

**Files:**
- Modify: `services/dataService.ts`
- Modify: `types.ts`

**Interfaces:**
- Consumes: `Report` from `types.ts`.
- Produces: `Report` gains `assignedToName?: string`, `resolutionNotes?: string`, `createdAt?: string`; `updateReport(id: string, fields: { status?: Report['status']; assignedToName?: string; resolutionNotes?: string }): Promise<void>`.

- [ ] **Step 1: Extend the `Report` interface**

In `types.ts`, replace:

```ts
export interface Report {
  id: string;
  date: string;
  category: string;
  description: string;
  status: 'Received' | 'In Progress' | 'Resolved';
  residentUnit: string;
}
```

with:

```ts
export interface Report {
  id: string;
  date: string;
  category: string;
  description: string;
  status: 'Received' | 'In Progress' | 'Resolved';
  residentUnit: string;
  assignedToName?: string;
  resolutionNotes?: string;
  createdAt?: string;
}
```

- [ ] **Step 2: Extend the `toReport` mapper**

In `services/dataService.ts`, replace:

```ts
function toReport(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    date: row.date as string,
    category: row.category as string,
    description: row.description as string,
    status: row.status as Report['status'],
    residentUnit: row.resident_unit as string,
  };
}
```

with:

```ts
function toReport(row: Record<string, unknown>): Report {
  return {
    id: row.id as string,
    date: row.date as string,
    category: row.category as string,
    description: row.description as string,
    status: row.status as Report['status'],
    residentUnit: row.resident_unit as string,
    assignedToName: row.assigned_to_name as string | undefined,
    resolutionNotes: row.resolution_notes as string | undefined,
    createdAt: row.created_at as string | undefined,
  };
}
```

- [ ] **Step 3: Add `updateReport`**

Append to `services/dataService.ts`, after `markVisitorDeparted` (added in Task 3):

```ts
export async function updateReport(id: string, fields: {
  status?: Report['status'];
  assignedToName?: string;
  resolutionNotes?: string;
}): Promise<void> {
  const update: Record<string, unknown> = {};
  if (fields.status !== undefined) update.status = fields.status;
  if (fields.assignedToName !== undefined) update.assigned_to_name = fields.assignedToName;
  if (fields.resolutionNotes !== undefined) update.resolution_notes = fields.resolutionNotes;

  const { error } = await supabase.from('reports').update(update).eq('id', id);
  if (error) throw error;
}
```

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (this also confirms no other file destructures `Report` in a way incompatible with the new optional fields — optional fields are additive and cannot break existing call sites).

- [ ] **Step 5: Commit**

```bash
git add services/dataService.ts types.ts
git commit -m "feat: extend Report type and add updateReport for maintenance workflow"
```

---

## Task 5: Resident "Invite Visitor" flow

**Files:**
- Create: `components/InviteVisitor.tsx`
- Modify: `components/Navigation.tsx`
- Modify: `App.tsx`
- Modify: `components/Dashboard.tsx`

**Interfaces:**
- Consumes: `createVisitor` from `services/dataService.ts` (Task 2), `useAuth()` for `userProfile.unit`, `CustomDatePicker`/`CustomTimePicker` from `components/CustomPickers.tsx`, `QRCodeSVG` from `qrcode.react`.
- Produces: nav view id `'invite-visitor'` reachable by `RESIDENT`/`TENANT`.

- [ ] **Step 1: Create `components/InviteVisitor.tsx`**

```tsx
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { UserPlus, ChevronLeft, Clock, Phone, FileText } from 'lucide-react';
import { createVisitor } from '../services/dataService';
import { CustomDatePicker, CustomTimePicker } from './CustomPickers';
import { useAuth } from '../contexts/AuthContext';

export const InviteVisitor: React.FC = () => {
  const { userProfile } = useAuth();
  const [step, setStep] = useState<'form' | 'qr'>('form');
  const [visitorName, setVisitorName] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; qrCode: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    if (!visitorName.trim() || !arrivalDate || !arrivalTime) {
      setApiError('Visitor name, arrival date and time are required.');
      return;
    }
    setIsLoading(true);
    try {
      const expectedArrival = new Date(`${arrivalDate}T${arrivalTime}:00`).toISOString();
      const expectedDeparture = departureDate && departureTime
        ? new Date(`${departureDate}T${departureTime}:00`).toISOString()
        : undefined;
      const created = await createVisitor({
        visitorName: visitorName.trim(),
        visitorPhone: visitorPhone.trim() || undefined,
        purpose: purpose.trim() || undefined,
        expectedArrival,
        expectedDeparture,
        unit: userProfile?.unit ?? '',
      });
      setResult(created);
      setStep('qr');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to create visitor invite. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setStep('form');
    setVisitorName('');
    setVisitorPhone('');
    setPurpose('');
    setArrivalDate('');
    setArrivalTime('');
    setDepartureDate('');
    setDepartureTime('');
    setResult(null);
  };

  return (
    <div className="pb-12">
      <div className="bg-[#111111] rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-[#C8FF00] rounded-2xl flex items-center justify-center flex-shrink-0">
          <UserPlus size={28} className="text-[#111111]" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Invite Visitor</h2>
          <p className="mt-1 text-sm text-gray-400">Register a visitor and share a QR code for gate entry.</p>
        </div>
      </div>

      {step === 'form' ? (
        <div className="max-w-lg mx-auto bg-white rounded-2xl p-6 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Visitor Name</label>
              <input type="text" value={visitorName} onChange={(e) => setVisitorName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none font-medium text-gray-900 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Phone size={12} /> Phone (optional)</label>
              <input type="tel" value={visitorPhone} onChange={(e) => setVisitorPhone(e.target.value)}
                placeholder="e.g. 012-345 6789"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none font-medium text-gray-900 transition-all" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><FileText size={12} /> Purpose (optional)</label>
              <input type="text" value={purpose} onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Family visit, delivery"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none font-medium text-gray-900 transition-all" />
            </div>
            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expected Arrival Date</label>
                <CustomDatePicker required value={arrivalDate} onChange={setArrivalDate} />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</label>
                <CustomTimePicker required value={arrivalTime} onChange={setArrivalTime} />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Expected Departure (optional)</label>
                <CustomDatePicker value={departureDate} onChange={setDepartureDate} />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Time</label>
                <CustomTimePicker value={departureTime} onChange={setDepartureTime} />
              </div>
            </div>
            {apiError && <p className="text-sm text-red-500 text-center px-4 py-2 rounded-xl bg-red-50">{apiError}</p>}
            <button type="submit" disabled={isLoading}
              className="w-full py-4 rounded-xl font-bold text-white transition-all disabled:opacity-50 bg-[#111111] hover:bg-[#222222]">
              {isLoading ? 'Creating...' : 'Generate Visitor QR'}
            </button>
          </form>
        </div>
      ) : (
        <div className="max-w-md mx-auto pt-4">
          <button onClick={resetForm} className="mb-6 flex items-center text-gray-400 hover:text-[#111111] transition-colors font-semibold text-sm gap-1">
            <ChevronLeft size={16} /> Invite Another Visitor
          </button>
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
            <div className="p-6 text-center bg-[#111111]">
              <h3 className="font-bold text-2xl tracking-widest mb-1 text-white">VISITOR PASS</h3>
              <p className="text-xs uppercase tracking-widest text-gray-500">Nadayu28 Residences</p>
            </div>
            <div className="p-6 text-center">
              <div className="border-2 border-dashed border-gray-200 inline-block mb-5 p-4 rounded-2xl">
                <div className="bg-white p-2 rounded-lg">
                  {result?.qrCode && <QRCodeSVG value={result.qrCode} size={160} bgColor="#ffffff" fgColor="#111111" level="M" />}
                </div>
              </div>
              <div className="space-y-3 text-left bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-5">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-semibold uppercase">Visitor</span>
                  <span className="text-gray-900 font-bold">{visitorName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs font-semibold uppercase">Expected</span>
                  <span className="text-gray-900 font-semibold text-sm">{arrivalDate} {arrivalTime}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 text-center">Share this QR code with your visitor for gate entry</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Wire the nav item**

In `components/Navigation.tsx`, add `UserPlus` to the `lucide-react` import list (line 2-5 block), then insert a new entry into the `navItems` array right after the `'parking'` entry:

```ts
{ id: 'invite-visitor', label: 'Invite Visitor', icon: UserPlus, roles: [UserRole.RESIDENT, UserRole.TENANT] },
```

- [ ] **Step 3: Wire the route**

In `App.tsx`, add the import:

```ts
import { InviteVisitor } from './components/InviteVisitor';
```

and add a case to `renderContent()`'s switch, after `case 'parking':`:

```ts
case 'invite-visitor':
  return <InviteVisitor />;
```

- [ ] **Step 4: Add a Dashboard quick action**

In `components/Dashboard.tsx`, add `UserPlus` to the `lucide-react` import, add a new entry to `quickActions` (after the `parking` entry):

```ts
{ id: "invite-visitor", label: "Invite Visitor", icon: UserPlus, desc: "Register a guest" },
```

and change the quick-actions grid class from `grid-cols-4` to `grid-cols-5` (same line, no other changes) to fit the new 5th card.

- [ ] **Step 5: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 6: Manual smoke test**

Start the dev server (`npm run dev`), log in as a RESIDENT test account, click "Invite Visitor" from the dashboard quick actions, fill the form (name + today's date + a time), submit, and confirm a QR code renders with the visitor's name and expected time shown below it. Then check the Supabase `visitors` table in the dashboard and confirm a matching row was inserted with `status = 'scheduled'`.

- [ ] **Step 7: Commit**

```bash
git add components/InviteVisitor.tsx components/Navigation.tsx App.tsx components/Dashboard.tsx
git commit -m "feat: add resident Invite Visitor flow with QR generation"
```

---

## Task 6: Security Scanner — visitor mode, lookup, 30-min flag, MyKad capture, Arrived

**Files:**
- Modify: `components/SecurityScanner.tsx` (full-file rewrite — the mode toggle and new result branch touch most of the render tree)

**Interfaces:**
- Consumes: `fetchVisitorById`, `checkInVisitor`, `uploadVisitorIdPhoto`, `Visitor` from `services/dataService.ts` (Tasks 2-3).
- Produces: no new exports; internal `mode: 'booking' | 'visitor'` state controls which QR type is expected.

- [ ] **Step 1: Replace the full contents of `components/SecurityScanner.tsx`**

```tsx
import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, Camera, CameraOff, Shield, ScanLine, AlertTriangle } from 'lucide-react';
import { validateBookingById, fetchVisitorById, checkInVisitor, uploadVisitorIdPhoto, Visitor } from '../services/dataService';

interface ScannedBooking {
  id: string;
  plate: string;
  slot: string;
  date: string;
  time: string;
  duration: number;
  unit: string;
  zone: string;
}

export const SecurityScanner: React.FC = () => {
  const [mode, setMode] = useState<'booking' | 'visitor'>('booking');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<'success' | 'fail' | null>(null);
  const [scannedData, setScannedData] = useState<ScannedBooking | null>(null);
  const [scannedVisitor, setScannedVisitor] = useState<Visitor | null>(null);
  const [visitorFlagged, setVisitorFlagged] = useState(false);
  const [visitorCheckedIn, setVisitorCheckedIn] = useState(false);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cameraStarting, setCameraStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const SCANNER_ID = 'qr-reader';

  useEffect(() => {
    return () => { stopScanner(); };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState() === 2) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (_) {}
      scannerRef.current = null;
    }
  };

  const validateBooking = async (payload: ScannedBooking): Promise<boolean> => {
    try {
      const res = await validateBookingById(payload.id);
      return res.valid;
    } catch {
      return false;
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    stopScanner().then(async () => {
      setScanning(false);

      if (mode === 'visitor') {
        try {
          const payload = JSON.parse(decodedText) as { type?: string; id?: string };
          const visitor = payload.id ? await fetchVisitorById(payload.id) : null;
          if (!visitor) {
            setErrorMsg('Visitor record not found');
            setResult('fail');
            return;
          }
          setScannedVisitor(visitor);
          setVisitorCheckedIn(visitor.status === 'arrived' || visitor.status === 'flagged' || visitor.status === 'departed');
          setVisitorFlagged(visitor.status === 'flagged');
          setResult('success');
        } catch {
          setErrorMsg('Invalid QR code');
          setResult('fail');
        }
        return;
      }

      try {
        const data: ScannedBooking = JSON.parse(decodedText);
        setScannedData(data);
        const valid = await validateBooking(data);
        setResult(valid ? 'success' : 'fail');
      } catch {
        setScannedData(null);
        setErrorMsg('Invalid QR code');
        setResult('fail');
      }
    });
  };

  const startScanner = async () => {
    setResult(null);
    setScannedData(null);
    setScannedVisitor(null);
    setErrorMsg(null);
    setCameraStarting(true);
    await stopScanner();
    try {
      const html5Qr = new Html5Qrcode(SCANNER_ID);
      scannerRef.current = html5Qr;
      await html5Qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        handleScanSuccess,
        () => {}
      );
      setScanning(true);
    } catch {
      setErrorMsg('Camera access denied. Please allow camera access and try again.');
    } finally {
      setCameraStarting(false);
    }
  };

  const handleReset = async () => {
    await stopScanner();
    setScanning(false);
    setResult(null);
    setScannedData(null);
    setScannedVisitor(null);
    setVisitorFlagged(false);
    setVisitorCheckedIn(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrorMsg(null);
  };

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleMarkArrived = async () => {
    if (!scannedVisitor) return;
    setIsUploadingPhoto(true);
    try {
      if (photoFile) await uploadVisitorIdPhoto(scannedVisitor.id, photoFile);
      const { flagged } = await checkInVisitor(scannedVisitor.id);
      setVisitorFlagged(flagged);
      setVisitorCheckedIn(true);
    } catch {
      setErrorMsg('Failed to check in visitor. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  return (
    <div className="pb-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-semibold mb-1">Security</p>
          <h1 className="text-[2rem] font-bold text-gray-900 leading-tight tracking-tight">Access Control</h1>
          <p className="text-gray-400 text-sm mt-1">Scan visitor QR codes for entry verification.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-[#111111] text-white px-4 py-2 rounded-full text-xs font-medium">
          <Shield size={12} className="text-[#C8FF00]" />
          Scanner Active
        </div>
      </div>

      <div className="max-w-md mx-auto">
        {/* Mode toggle */}
        <div className="mb-4 flex bg-gray-100 rounded-xl p-1">
          <button onClick={() => { setMode('booking'); handleReset(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'booking' ? 'bg-[#111111] text-white' : 'text-gray-500'}`}>
            Booking QR
          </button>
          <button onClick={() => { setMode('visitor'); handleReset(); }}
            className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === 'visitor' ? 'bg-[#111111] text-white' : 'text-gray-500'}`}>
            Visitor QR
          </button>
        </div>

        {/* Scanner Card */}
        <div className="bg-[#111111] rounded-2xl p-8 flex flex-col items-center justify-center relative overflow-hidden min-h-[420px]">
          <div className="absolute top-5 left-5 w-10 h-10 border-l-[3px] border-t-[3px] border-[#C8FF00]/30 rounded-tl-xl"></div>
          <div className="absolute top-5 right-5 w-10 h-10 border-r-[3px] border-t-[3px] border-[#C8FF00]/30 rounded-tr-xl"></div>
          <div className="absolute bottom-5 left-5 w-10 h-10 border-l-[3px] border-b-[3px] border-[#C8FF00]/30 rounded-bl-xl"></div>
          <div className="absolute bottom-5 right-5 w-10 h-10 border-r-[3px] border-b-[3px] border-[#C8FF00]/30 rounded-br-xl"></div>

          <div id={SCANNER_ID}
            className={`w-full rounded-xl overflow-hidden ${scanning ? 'block' : 'hidden'}`}
            style={{ maxWidth: '280px' }} />

          {!scanning && !result && !cameraStarting && (
            <div className="z-20 flex flex-col items-center">
              <div className="w-24 h-24 bg-white/[0.06] rounded-2xl flex items-center justify-center mb-6">
                <Camera className="w-12 h-12 text-gray-500" />
              </div>
              <p className="font-semibold text-white text-lg mb-1">Ready to Scan</p>
              <p className="text-sm text-gray-500 mb-6">Point camera at a {mode === 'visitor' ? 'visitor' : 'booking'} QR code</p>
              {errorMsg && (
                <p className="text-sm mb-4 px-4 py-2 rounded-xl bg-red-500/10 text-red-400">{errorMsg}</p>
              )}
              <button onClick={startScanner}
                className="bg-[#C8FF00] text-[#111111] px-8 py-4 rounded-xl font-bold text-sm transition-all hover:brightness-95 active:scale-95 flex items-center gap-2">
                <Camera size={18} /> Open Camera
              </button>
            </div>
          )}

          {cameraStarting && (
            <div className="z-20 flex flex-col items-center">
              <div className="w-14 h-14 border-[3px] border-[#C8FF00] border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-sm text-gray-400 font-medium animate-pulse">Starting camera...</p>
            </div>
          )}

          {scanning && (
            <div className="z-20 flex flex-col items-center w-full mt-4">
              <p className="text-sm text-[#C8FF00] font-semibold mb-4 animate-pulse flex items-center gap-2">
                <ScanLine size={16} /> Scanning...
              </p>
              <button onClick={handleReset}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-300 transition-colors px-4 py-2 rounded-xl bg-white/5">
                <CameraOff size={14} /> Cancel
              </button>
            </div>
          )}

          {/* Booking success state */}
          {result === 'success' && mode === 'booking' && scannedData && (
            <div className="z-20 text-center w-full flex flex-col items-center">
              <div className="w-20 h-20 bg-[#C8FF00] rounded-full flex items-center justify-center mb-5">
                <CheckCircle className="w-10 h-10 text-[#111111]" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Access Granted</h3>
              <p className="text-sm text-gray-500 mb-5">Booking verified successfully</p>
              <div className="bg-white/[0.06] rounded-xl p-5 w-full max-w-[280px] text-left space-y-3">
                {[
                  { label: 'Vehicle', value: scannedData.plate },
                  { label: 'Spot', value: scannedData.slot },
                  { label: 'Unit', value: scannedData.unit },
                  { label: 'Date & Time', value: `${scannedData.date} ${scannedData.time}` },
                  { label: 'Duration', value: `${scannedData.duration}h` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{item.label}</span>
                    <span className="text-sm font-bold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
              <button onClick={handleReset}
                className="mt-5 text-sm font-semibold text-[#C8FF00] hover:underline">
                Scan Next
              </button>
            </div>
          )}

          {/* Visitor success state */}
          {result === 'success' && mode === 'visitor' && scannedVisitor && (
            <div className="z-20 text-center w-full flex flex-col items-center">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 ${visitorFlagged ? 'bg-orange-400' : 'bg-[#C8FF00]'}`}>
                {visitorFlagged
                  ? <AlertTriangle className="w-10 h-10 text-white" strokeWidth={3} />
                  : <CheckCircle className="w-10 h-10 text-[#111111]" strokeWidth={3} />}
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{visitorFlagged ? 'Arrival Time Mismatch' : 'Visitor Verified'}</h3>
              <p className="text-sm text-gray-500 mb-5">
                {visitorFlagged ? 'Arrival is more than 30 minutes off the expected time' : 'Expected visitor confirmed'}
              </p>
              <div className="bg-white/[0.06] rounded-xl p-5 w-full max-w-[280px] text-left space-y-3 mb-5">
                {[
                  { label: 'Name', value: scannedVisitor.visitorName },
                  { label: 'Host Unit', value: scannedVisitor.residentUnit },
                  { label: 'Purpose', value: scannedVisitor.purpose || '-' },
                  { label: 'Expected', value: new Date(scannedVisitor.expectedArrival).toLocaleString() },
                ].map(item => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">{item.label}</span>
                    <span className="text-sm font-bold text-white text-right">{item.value}</span>
                  </div>
                ))}
              </div>
              {!visitorCheckedIn ? (
                <div className="w-full max-w-[280px] space-y-3">
                  <label className="block">
                    <div className="border-2 border-dashed border-white/20 rounded-xl p-4 text-center cursor-pointer hover:border-[#C8FF00]/50 transition-colors">
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="hidden" />
                      {photoPreview ? (
                        <img src={photoPreview} alt="MyKad" className="h-20 mx-auto rounded-lg object-cover" />
                      ) : (
                        <>
                          <Camera className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-400">Capture MyKad photo (optional)</p>
                        </>
                      )}
                    </div>
                  </label>
                  <button onClick={handleMarkArrived} disabled={isUploadingPhoto}
                    className="w-full bg-[#C8FF00] text-[#111111] py-3.5 rounded-xl font-bold text-sm hover:brightness-95 transition-all disabled:opacity-50">
                    {isUploadingPhoto ? 'Checking in...' : 'Mark Arrived'}
                  </button>
                </div>
              ) : (
                <p className="text-sm font-semibold text-[#C8FF00]">Visitor checked in</p>
              )}
              <button onClick={handleReset} className="mt-5 text-sm font-semibold text-[#C8FF00] hover:underline">
                Scan Next
              </button>
            </div>
          )}

          {/* Fail state */}
          {result === 'fail' && (
            <div className="z-20 text-center w-full flex flex-col items-center">
              <div className="w-20 h-20 bg-red-500/15 border-2 border-red-500/30 rounded-full flex items-center justify-center mb-5">
                <XCircle className="w-10 h-10 text-red-400" strokeWidth={3} />
              </div>
              <h3 className="text-xl font-bold text-white mb-1">Access Denied</h3>
              <p className="text-sm text-red-400 mb-6">{errorMsg || 'Invalid or expired code'}</p>
              <button onClick={handleReset}
                className="bg-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/15 transition-colors">
                Try Again
              </button>
            </div>
          )}
        </div>

        <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center">
              <Shield size={15} className="text-gray-400" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900">How it works</h3>
          </div>
          <div className="space-y-2">
            {['Choose Booking QR or Visitor QR mode above',
              'Scanner verifies the code against the database',
              'Green = valid entry, Orange = flagged, Red = denied access'].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-5 h-5 bg-[#111111] text-[#C8FF00] rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5">{i + 1}</span>
                <p className="text-xs text-gray-500 leading-relaxed">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 3: Manual smoke test**

Start the dev server, log in as a SECURITY test account, open Access Control, confirm the "Booking QR / Visitor QR" toggle renders and switching modes changes the "Ready to Scan" copy. Camera-based scanning itself needs a physical/webcam device or a real QR code in frame to fully exercise — full lookup/check-in behavior is verified in Task 11's scripted check against the live Supabase project instead of here.

- [ ] **Step 4: Commit**

```bash
git add components/SecurityScanner.tsx
git commit -m "feat: add visitor scan mode to SecurityScanner with 30-min flagging and MyKad capture"
```

---

## Task 7: Security Scanner — today's arrivals list + Mark Departed

**Files:**
- Modify: `components/SecurityScanner.tsx`

**Interfaces:**
- Consumes: `fetchVisitors`, `markVisitorDeparted` from `services/dataService.ts` (Tasks 2-3), `Visitor` (already imported in Task 6).

- [ ] **Step 1: Import the additional functions**

In `components/SecurityScanner.tsx`, update the dataService import line to:

```ts
import { validateBookingById, fetchVisitorById, fetchVisitors, checkInVisitor, uploadVisitorIdPhoto, markVisitorDeparted, Visitor } from '../services/dataService';
```

- [ ] **Step 2: Add arrivals-list state and loader**

Add after the existing state declarations (right after `const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);`):

```ts
const [todaysArrivals, setTodaysArrivals] = useState<Visitor[]>([]);

const loadArrivals = () => {
  fetchVisitors().then(list => {
    const todayStr = new Date().toISOString().split('T')[0];
    setTodaysArrivals(list.filter(v =>
      (v.status === 'arrived' || v.status === 'flagged') && v.actualArrival?.startsWith(todayStr)
    ));
  }).catch(() => {});
};

useEffect(() => { if (mode === 'visitor') loadArrivals(); }, [mode]);
```

- [ ] **Step 3: Refresh arrivals after check-in, and add `handleMarkDeparted`**

In `handleMarkArrived`, change the `try` block's success path to also refresh the list — replace:

```ts
      const { flagged } = await checkInVisitor(scannedVisitor.id);
      setVisitorFlagged(flagged);
      setVisitorCheckedIn(true);
```

with:

```ts
      const { flagged } = await checkInVisitor(scannedVisitor.id);
      setVisitorFlagged(flagged);
      setVisitorCheckedIn(true);
      loadArrivals();
```

Then add a new handler directly below `handleMarkArrived`:

```ts
const handleMarkDeparted = async (visitorId: string) => {
  try {
    await markVisitorDeparted(visitorId);
    loadArrivals();
  } catch {
    setErrorMsg('Failed to mark visitor departed. Please try again.');
  }
};
```

- [ ] **Step 4: Render the arrivals list**

In the JSX, insert this block directly after the closing `</div>` of the `"How it works"` info card (i.e. right before the final closing `</div></div>` that ends the component's `max-w-md` wrapper and root `<div>`):

```tsx
{mode === 'visitor' && (
  <div className="mt-4 bg-white border border-gray-100 rounded-2xl p-5">
    <h3 className="text-sm font-semibold text-gray-900 mb-3">Today's Arrivals</h3>
    {todaysArrivals.length === 0 ? (
      <p className="text-xs text-gray-400">No visitors checked in yet today.</p>
    ) : (
      <div className="space-y-2">
        {todaysArrivals.map(v => (
          <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
            <div>
              <p className="text-sm font-bold text-gray-900">{v.visitorName}</p>
              <p className="text-xs text-gray-400">Unit {v.residentUnit}{v.status === 'flagged' ? ' · Flagged' : ''}</p>
            </div>
            <button onClick={() => handleMarkDeparted(v.id)}
              className="text-xs font-bold text-gray-500 hover:text-[#111111] px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              Mark Departed
            </button>
          </div>
        ))}
      </div>
    )}
  </div>
)}
```

- [ ] **Step 5: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 6: Manual smoke test**

With the dev server running and logged in as SECURITY, switch to Visitor QR mode and confirm the "Today's Arrivals" panel renders (empty state is fine if no visitors have checked in yet — full behavior is exercised in Task 11).

- [ ] **Step 7: Commit**

```bash
git add components/SecurityScanner.tsx
git commit -m "feat: add today's arrivals list and Mark Departed action to SecurityScanner"
```

---

## Task 8: Maintenance workflow UI

**Files:**
- Create: `components/Maintenance.tsx`
- Modify: `components/Navigation.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `fetchReports`, `updateReport` from `services/dataService.ts` (Task 4), `Report` from `types.ts`.
- Produces: nav view id `'maintenance'` reachable by `SECURITY`/`MANAGEMENT`.

- [ ] **Step 1: Create `components/Maintenance.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { Wrench, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchReports, updateReport } from '../services/dataService';
import { Report } from '../types';

const STATUS_OPTIONS: Report['status'][] = ['Received', 'In Progress', 'Resolved'];

export const Maintenance: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState<Report['status'] | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { assignedToName: string; resolutionNotes: string }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = () => { fetchReports().then(setReports).catch(() => {}); };
  useEffect(() => { load(); }, []);

  const filtered = statusFilter === 'all' ? reports : reports.filter(r => r.status === statusFilter);

  const getDraft = (r: Report) => drafts[r.id] ?? { assignedToName: r.assignedToName ?? '', resolutionNotes: r.resolutionNotes ?? '' };

  const handleSave = async (r: Report, status: Report['status']) => {
    const draft = getDraft(r);
    setSavingId(r.id);
    try {
      await updateReport(r.id, {
        status,
        assignedToName: draft.assignedToName || undefined,
        resolutionNotes: draft.resolutionNotes || undefined,
      });
      load();
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-[#111111] rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-[#C8FF00] rounded-2xl flex items-center justify-center flex-shrink-0">
          <Wrench size={28} className="text-[#111111]" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Maintenance</h2>
          <p className="mt-1 text-sm text-gray-400">Track and resolve resident-reported issues.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', ...STATUS_OPTIONS] as const).map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
              statusFilter === s ? 'bg-[#111111] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">No reports in this status.</p>
        )}
        {filtered.map(r => {
          const isOpen = expandedId === r.id;
          const draft = getDraft(r);
          return (
            <div key={r.id}>
              <button onClick={() => setExpandedId(isOpen ? null : r.id)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors text-left">
                <div>
                  <p className="text-sm font-bold text-gray-900">{r.category}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Unit {r.residentUnit} · {r.date}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                    r.status === 'Resolved' ? 'bg-[#C8FF00]/15 text-[#4a6600]' :
                    r.status === 'In Progress' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
                  }`}>{r.status}</span>
                  {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </button>
              {isOpen && (
                <div className="px-6 pb-5 space-y-4">
                  <p className="text-sm text-gray-600">{r.description}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Assigned To</label>
                      <input type="text" value={draft.assignedToName}
                        onChange={(e) => setDrafts(prev => ({ ...prev, [r.id]: { ...getDraft(r), assignedToName: e.target.value } }))}
                        placeholder="Staff/contractor name"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Resolution Notes</label>
                      <input type="text" value={draft.resolutionNotes}
                        onChange={(e) => setDrafts(prev => ({ ...prev, [r.id]: { ...getDraft(r), resolutionNotes: e.target.value } }))}
                        placeholder="What was done"
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {STATUS_OPTIONS.map(s => (
                      <button key={s} onClick={() => handleSave(r, s)} disabled={savingId === r.id}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                          r.status === s ? 'bg-[#111111] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>
                        {savingId === r.id ? 'Saving...' : `Set: ${s}`}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Wire the nav item**

In `components/Navigation.tsx`, add `Wrench` to the `lucide-react` import list, and insert a new entry into `navItems` after the `'report'` entry:

```ts
{ id: 'maintenance', label: 'Maintenance', icon: Wrench, roles: [UserRole.SECURITY, UserRole.MANAGEMENT] },
```

- [ ] **Step 3: Wire the route**

In `App.tsx`, add the import:

```ts
import { Maintenance } from './components/Maintenance';
```

and add a case to `renderContent()`'s switch, after `case 'report':`:

```ts
case 'maintenance':
  return <Maintenance />;
```

- [ ] **Step 4: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 5: Manual smoke test**

Log in as MANAGEMENT, open Maintenance, filter by "Received", expand one of the seeded reports (e.g. `r3`, `r7`, `r10`, or `r12` — all seeded as `Received`), fill "Assigned To" and "Resolution Notes", click "Set: In Progress". Confirm the row's status badge updates and, on page reload, the status/assignment/notes persist (check the `reports` row in Supabase directly if needed).

- [ ] **Step 6: Commit**

```bash
git add components/Maintenance.tsx components/Navigation.tsx App.tsx
git commit -m "feat: add Maintenance workflow UI for SECURITY/MANAGEMENT"
```

---

## Task 9: Resident report status visibility (Profile.tsx)

**Files:**
- Modify: `components/Profile.tsx`

**Interfaces:**
- Consumes: `fetchReports` from `services/dataService.ts` (already existed; unused until now), `useAuth()` for `userProfile.unit`, `Report` from `types.ts`.

- [ ] **Step 1: Add imports and state**

In `components/Profile.tsx`, update the dataService import line from:

```ts
import { fetchBookings, fetchVehicles } from '../services/dataService';
```

to:

```ts
import { fetchBookings, fetchVehicles, fetchReports } from '../services/dataService';
```

Add `Report` to the types import — change:

```ts
import { Vehicle, Booking } from '../types';
```

to:

```ts
import { Vehicle, Booking, Report } from '../types';
```

Add the `useAuth` import (new line, near the other context import):

```ts
import { useAuth } from '../contexts/AuthContext';
```

Add state and a fetch effect, right after the existing `useEffect(() => { fetchBookings()... }, []);` block:

```ts
const [reports, setReports] = useState<Report[]>([]);
const { userProfile } = useAuth();

useEffect(() => {
  fetchReports(userProfile?.unit).then(setReports).catch(() => {});
}, [userProfile?.unit]);
```

- [ ] **Step 2: Render the reports list in the History tab**

In the `activeTab === 'history'` block, find the closing of the bookings timeline (`</div>` that closes `<div className="space-y-6">` containing the `bookings.map(...)` / empty-state block), and insert this new section directly after it, before the two closing `</div>` tags that end the tab's padded content wrapper:

```tsx
<div className="mt-8 pt-8 border-t border-gray-100">
  <h4 className="font-bold text-gray-900 text-base mb-4">My Reports</h4>
  {reports.length > 0 ? (
    <div className="space-y-4">
      {reports.map((r) => (
        <div key={r.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <p className="font-bold text-gray-900 text-sm">{r.category}</p>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              r.status === 'Resolved' ? 'bg-[#C8FF00]/15 text-[#4a6600]' :
              r.status === 'In Progress' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'
            }`}>{r.status}</span>
          </div>
          <p className="text-xs text-gray-500 mb-1">{r.description}</p>
          {r.resolutionNotes && (
            <p className="text-xs text-gray-400 mt-2 pt-2 border-t border-gray-200">
              <span className="font-semibold text-gray-500">Resolution: </span>{r.resolutionNotes}
            </p>
          )}
          <p className="text-[11px] text-gray-400 mt-2">{r.date}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="text-sm text-gray-400">No reports submitted yet.</p>
  )}
</div>
```

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Log in as the RESIDENT/TENANT test account whose unit matches one of the seeded `reports` rows (e.g. unit `A-10-05` has seeded report `r1`), go to Profile > History, and confirm "My Reports" shows that report with its current status. Go back to Maintenance (as MANAGEMENT, in another session/browser) and change that report's status/resolution notes, then reload the resident's Profile page and confirm the change is reflected.

- [ ] **Step 5: Commit**

```bash
git add components/Profile.tsx
git commit -m "feat: show resident's submitted reports with status in Profile history tab"
```

---

## Task 10: AdminPanel overdue-reports stat tile

**Files:**
- Modify: `components/AdminPanel.tsx`

**Interfaces:**
- Consumes: `fetchReports` from `services/dataService.ts` (Task 4's extended mapper provides `createdAt`), `Report` from `types.ts`.

- [ ] **Step 1: Add imports and state**

In `components/AdminPanel.tsx`, update the dataService import from:

```ts
import { fetchViolations } from '../services/dataService';
```

to:

```ts
import { fetchViolations, fetchReports } from '../services/dataService';
```

Add `Report` to the types import — change:

```ts
import { Violation } from '../types';
```

to:

```ts
import { Violation, Report } from '../types';
```

Add `Clock` to the `lucide-react` import list.

Add state and a fetch effect, right after the existing `useEffect(() => { fetchViolations()... }, []);` block:

```ts
const [reports, setReports] = useState<Report[]>([]);
useEffect(() => {
  fetchReports().then(setReports).catch(() => {});
}, []);

const overdueCount = reports.filter(r =>
  r.status === 'Received' && r.createdAt && (Date.now() - new Date(r.createdAt).getTime()) > 24 * 60 * 60 * 1000
).length;
```

- [ ] **Step 2: Render the stat tile**

Insert this block between the closing `</header>` tag and the `{/* Analytics Row */}` comment:

```tsx
<div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4">
  <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
    <Clock size={20} className="text-orange-500" />
  </div>
  <div>
    <p className="text-2xl font-bold text-gray-900 leading-none">{overdueCount}</p>
    <p className="text-xs text-gray-400 mt-1">Reports overdue (received &gt;24h ago, unactioned)</p>
  </div>
</div>
```

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Manual smoke test**

Log in as MANAGEMENT, open the admin dashboard, and confirm the new tile renders with a non-negative count. Since all seeded `reports` rows were inserted at seed time (well over 24h ago by the time this is tested), the seeded `Received` rows (`r3`, `r7`, `r10`, `r12`) should count as overdue unless already reassigned to a different status via Task 8's testing — cross-check the number against a manual `SELECT COUNT(*) FROM reports WHERE status = 'Received' AND created_at < NOW() - INTERVAL '24 hours'` in the Supabase SQL editor.

- [ ] **Step 5: Commit**

```bash
git add components/AdminPanel.tsx
git commit -m "feat: add overdue-reports stat tile to AdminPanel"
```

---

## Task 11: Full regression pass — visitor check-in logic + end-to-end smoke test

**Files:**
- Create: `scripts/verify-visitor-flow.mjs` (temporary verification script — not part of the app bundle, safe to delete after use, but committed for repeatability)

**Interfaces:**
- Consumes: `@supabase/supabase-js` directly (already a project dependency), `.env.local`'s `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`, and a seeded SECURITY test account's credentials.

This task exists because `SecurityScanner.tsx`'s camera-driven QR scan can't be triggered headlessly in a browser automation tool without a physical/virtual camera feeding real QR frames — so the visitor check-in/flagging/mark-departed logic added in Tasks 3, 6, and 7 is verified directly against the live Supabase project instead, the same way the `auth.users` login bug was diagnosed and fixed earlier in this project.

- [ ] **Step 1: Write the verification script**

```js
// scripts/verify-visitor-flow.mjs
// Run with: node --env-file=.env.local scripts/verify-visitor-flow.mjs
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const SECURITY_EMAIL = process.env.VERIFY_SECURITY_EMAIL; // pass a seeded SECURITY test account's email
const SECURITY_PASSWORD = process.env.VERIFY_SECURITY_PASSWORD;

function assert(cond, msg) {
  if (!cond) throw new Error('FAILED: ' + msg);
  console.log('OK: ' + msg);
}

async function run() {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: SECURITY_EMAIL,
    password: SECURITY_PASSWORD,
  });
  if (signInError) throw signInError;

  // 1. On-time visitor -> should end up 'arrived', not flagged
  const onTimeId = 'vtest' + Date.now();
  const onTimeArrival = new Date(Date.now() + 2 * 60000).toISOString(); // 2 min from now
  let { error } = await supabase.from('visitors').insert({
    id: onTimeId, resident_unit: 'A-06-01', visitor_name: 'Test OnTime',
    expected_arrival: onTimeArrival, status: 'scheduled',
  });
  if (error) throw error;

  const now1 = new Date().toISOString();
  ({ error } = await supabase.from('visitors').update({ status: 'arrived', actual_arrival: now1 }).eq('id', onTimeId));
  if (error) throw error;

  let { data: row1 } = await supabase.from('visitors').select('*').eq('id', onTimeId).single();
  assert(row1.status === 'arrived', `on-time visitor ${onTimeId} status is 'arrived'`);

  // 2. Late visitor (60 min off) -> should be flagged
  const lateId = 'vtest' + (Date.now() + 1);
  const lateArrival = new Date(Date.now() - 60 * 60000).toISOString(); // 60 min ago
  ({ error } = await supabase.from('visitors').insert({
    id: lateId, resident_unit: 'A-06-01', visitor_name: 'Test Late',
    expected_arrival: lateArrival, status: 'scheduled',
  }));
  if (error) throw error;

  const now2 = new Date().toISOString();
  ({ error } = await supabase.from('visitors').update({ status: 'flagged', actual_arrival: now2 }).eq('id', lateId));
  if (error) throw error;

  let { data: row2 } = await supabase.from('visitors').select('*').eq('id', lateId).single();
  assert(row2.status === 'flagged', `late visitor ${lateId} status is 'flagged'`);

  // 3. Mark departed on the flagged visitor
  ({ error } = await supabase.from('visitors').update({ status: 'departed' }).eq('id', lateId));
  if (error) throw error;
  let { data: row3 } = await supabase.from('visitors').select('status').eq('id', lateId).single();
  assert(row3.status === 'departed', `flagged visitor ${lateId} can be marked 'departed'`);

  // Cleanup
  await supabase.from('visitors').delete().in('id', [onTimeId, lateId]);
  console.log('Cleanup complete. All visitor flow assertions passed.');
}

run().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Run the script**

Run: `node --env-file=.env.local scripts/verify-visitor-flow.mjs`

(Set `VERIFY_SECURITY_EMAIL` / `VERIFY_SECURITY_PASSWORD` env vars first, using one of the 20 seeded test accounts with role `SECURITY` from `supabase_users.sql`, password `Nadayu28!`.)

Expected: all three `OK:` assertions print, then `Cleanup complete.`

This confirms the same status transitions that `checkInVisitor`/`markVisitorDeparted` (Task 3) implement, and that `visitors_update_staff` RLS (Task 1) actually permits a SECURITY-role account to perform them — the two things `SecurityScanner.tsx`'s UI can't be proven to do without a live camera.

- [ ] **Step 3: Playwright smoke pass over everything reachable via UI**

Using the same headless-Chromium approach established earlier in this project (`playwright` installed via `npm install --no-save playwright`, `npx playwright install chromium`), drive through, against either the local dev server or the deployed Vercel URL:

1. Log in as a RESIDENT/TENANT test account → Dashboard → "Invite Visitor" quick action → fill form → submit → confirm QR renders.
2. Log in as a MANAGEMENT test account → Maintenance → filter "Received" → expand a seeded report → set Assigned To + Resolution Notes → click "Set: In Progress" → confirm the badge updates.
3. Reload → confirm the change from step 2 persisted.
4. Log in as the RESIDENT/TENANT whose unit owns that report → Profile → History → confirm "My Reports" shows the updated status and resolution notes.
5. Log in as MANAGEMENT → AdminPanel → confirm the overdue-reports tile renders a number.
6. Log in as SECURITY → Access Control → confirm the Booking/Visitor mode toggle and (after switching to Visitor mode) the "Today's Arrivals" panel both render without errors.

Expected: no thrown errors in any step; each assertion (QR visible, badge text, persisted value, tile number) holds.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-visitor-flow.mjs
git commit -m "test: add visitor check-in flow verification script and complete Phase 1 regression pass"
```
