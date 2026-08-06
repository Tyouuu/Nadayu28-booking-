# Audit Trail (Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record who changed what and when for violation status changes, report updates, and role changes, and give MANAGEMENT a way to view that history and to change a user's role (which currently has no UI at all).

**Architecture:** Application-level logging — the existing `dataService.ts` mutation functions call a small internal `logAudit()` helper after a successful update, writing one row per changed field into a new `audit_log` table. No Postgres triggers, no backend API layer (this app is Supabase-direct-client throughout). `AdminPanel.tsx` gains a tab structure (it's currently one long scrolling view) to host the existing content plus two new tabs.

**Tech Stack:** React 19 + TypeScript + Vite, Supabase (Postgres + RLS), same stack as Phase 1 — no new dependencies.

## Global Constraints

- **No formal test suite exists in this repo.** Verification per task is `npx tsc --noEmit` + `npm run build`; behavioral verification is a manual Playwright smoke pass plus a live-Supabase RLS check, exactly as done for Phase 1 (see `docs/superpowers/plans/2026-08-07-visitor-management-and-maintenance-workflow.md`).
- Match existing visual style: `#111111` dark panels, `#C8FF00` lime accent, `rounded-2xl`/`rounded-xl` cards, pill-style filter buttons (see `components/Maintenance.tsx`'s status filter for the established pattern).
- Only three action types are ever logged: `violation_status_change`, `report_update`, `role_change`. Do not add audit logging for any other mutation in this phase (visitor check-in, bookings, etc. are explicitly out of scope per the spec).
- Every `dataService.ts` function in this codebase throws on Supabase error (`if (error) throw error;`) rather than swallowing it — keep that pattern for all new/modified functions.

---

## Task 1: Database migration — audit_log table, profiles_update_staff policy

**Files:**
- Create: `supabase_audit_trail.sql`

**Interfaces:**
- Produces: table `public.audit_log` (columns: `id, actor_id, actor_name, action, entity_type, entity_id, field, before_value, after_value, created_at`), new RLS policies `profiles_select_staff` and `profiles_update_staff` on `public.profiles`.

**Note:** `profiles` currently only has `profiles_select_own` (a user can read their own row). Without a staff-read policy, `fetchUsers()` (used by Task 4's Users tab) and `updateUserRole`'s pre-update read (Task 3) would only ever see the querying MANAGEMENT user's own row under RLS, not the full user list — this policy is required, not optional, for those tasks to work.

- [ ] **Step 1: Write the migration SQL file**

```sql
-- ============================================================
-- Nadayu28 Community Portal - Audit Trail (Phase 2)
-- Run AFTER supabase_visitors_and_maintenance.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id            TEXT        PRIMARY KEY,
  actor_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name    TEXT        NOT NULL,
  action        TEXT        NOT NULL
                            CHECK (action IN ('violation_status_change','report_update','role_change')),
  entity_type   TEXT        NOT NULL
                            CHECK (entity_type IN ('violation','report','profile')),
  entity_id     TEXT        NOT NULL,
  field         TEXT        NOT NULL,
  before_value  TEXT,
  after_value   TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action      ON public.audit_log(action);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log;
DROP POLICY IF EXISTS "audit_log_insert" ON public.audit_log;

CREATE POLICY "audit_log_select" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MANAGEMENT')
  );

CREATE POLICY "audit_log_insert" ON public.audit_log
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── profiles: allow MANAGEMENT to read and update any profile ──
-- A policy on `profiles` that subqueries `profiles` directly triggers
-- Postgres error 42P17 ("infinite recursion detected in policy for
-- relation"), because the subquery itself re-triggers RLS evaluation on
-- the same table. Route the check through a SECURITY DEFINER function,
-- which runs with RLS bypassed internally, to break the recursion.
CREATE OR REPLACE FUNCTION public.is_management()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MANAGEMENT');
$$;

DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_staff" ON public.profiles;

CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT USING (public.is_management());

CREATE POLICY "profiles_update_staff" ON public.profiles
  FOR UPDATE USING (public.is_management());

-- ── VERIFY ──────────────────────────────────────────────────
SELECT 'audit_log' AS tbl, COUNT(*) AS rows FROM public.audit_log;

SELECT policyname FROM pg_policies WHERE tablename = 'audit_log' ORDER BY policyname;

SELECT policyname FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
```

- [ ] **Step 2: Run the migration**

Open the Supabase project dashboard > SQL Editor > New Query, paste the full file contents, and run it.

- [ ] **Step 3: Verify**

Confirm the three verification `SELECT`s return: `audit_log` row count = 0; `audit_log` policies are exactly `audit_log_insert`, `audit_log_select`; `profiles` policies include `profiles_select_own`, `profiles_update_own`, and the two new ones, `profiles_select_staff` and `profiles_update_staff`.

- [ ] **Step 4: Commit**

```bash
git add supabase_audit_trail.sql
git commit -m "feat: add audit_log table and profiles staff read/update RLS policies"
```

---

## Task 2: dataService — logAudit helper, wire into updateViolationStatus and updateReport

**Files:**
- Modify: `services/dataService.ts`

**Interfaces:**
- Consumes: `supabase` client (existing import), `Report` type (existing import from `../types`).
- Produces: internal (not exported) `logAudit(entry: { action: string; entityType: string; entityId: string; field: string; before: string | null; after: string | null }): Promise<void>`. Modifies the existing `updateViolationStatus` and `updateReport` to call it.

- [ ] **Step 1: Add the `logAudit` helper**

Append to the end of `services/dataService.ts` (after the `updateReport` function):

```ts
// ── Audit log ─────────────────────────────────────────────────

async function logAudit(entry: {
  action: string;
  entityType: string;
  entityId: string;
  field: string;
  before: string | null;
  after: string | null;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();

  const { error } = await supabase.from('audit_log').insert({
    id: 'al' + Date.now(),
    actor_id: user?.id,
    actor_name: profile?.full_name ?? 'Unknown',
    action: entry.action,
    entity_type: entry.entityType,
    entity_id: entry.entityId,
    field: entry.field,
    before_value: entry.before,
    after_value: entry.after,
  });
  if (error) throw error;
}
```

- [ ] **Step 2: Wire `logAudit` into `updateViolationStatus`**

Find the existing function:

```ts
export async function updateViolationStatus(id: string, status: 'pending' | 'paid') {
  const { error } = await supabase.from('violations').update({ status }).eq('id', id);
  if (error) throw error;
}
```

Replace it with:

```ts
export async function updateViolationStatus(id: string, status: 'pending' | 'paid') {
  const { data: current } = await supabase.from('violations').select('status').eq('id', id).single();

  const { error } = await supabase.from('violations').update({ status }).eq('id', id);
  if (error) throw error;

  if (current && current.status !== status) {
    await logAudit({
      action: 'violation_status_change',
      entityType: 'violation',
      entityId: id,
      field: 'status',
      before: current.status,
      after: status,
    });
  }
}
```

- [ ] **Step 3: Wire `logAudit` into `updateReport`**

Find the existing function:

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

Replace it with:

```ts
export async function updateReport(id: string, fields: {
  status?: Report['status'];
  assignedToName?: string;
  resolutionNotes?: string;
}): Promise<void> {
  const { data: current } = await supabase
    .from('reports')
    .select('status, assigned_to_name, resolution_notes')
    .eq('id', id)
    .single();

  const update: Record<string, unknown> = {};
  if (fields.status !== undefined) update.status = fields.status;
  if (fields.assignedToName !== undefined) update.assigned_to_name = fields.assignedToName;
  if (fields.resolutionNotes !== undefined) update.resolution_notes = fields.resolutionNotes;

  const { error } = await supabase.from('reports').update(update).eq('id', id);
  if (error) throw error;

  if (!current) return;

  if (fields.status !== undefined && fields.status !== current.status) {
    await logAudit({
      action: 'report_update', entityType: 'report', entityId: id,
      field: 'status', before: current.status, after: fields.status,
    });
  }
  if (fields.assignedToName !== undefined && fields.assignedToName !== current.assigned_to_name) {
    await logAudit({
      action: 'report_update', entityType: 'report', entityId: id,
      field: 'assigned_to_name', before: current.assigned_to_name ?? null, after: fields.assignedToName,
    });
  }
  if (fields.resolutionNotes !== undefined && fields.resolutionNotes !== current.resolution_notes) {
    await logAudit({
      action: 'report_update', entityType: 'report', entityId: id,
      field: 'resolution_notes', before: current.resolution_notes ?? null, after: fields.resolutionNotes,
    });
  }
}
```

- [ ] **Step 4: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add services/dataService.ts
git commit -m "feat: log audit entries for violation status and report updates"
```

---

## Task 3: dataService — updateUserRole, fetchAuditLog

**Files:**
- Modify: `services/dataService.ts`

**Interfaces:**
- Consumes: `logAudit` (Task 2, same file), `UserRole` (existing import from `../types`).
- Produces:
  - `interface AuditLogEntry { id, actorId, actorName, action, entityType, entityId, field, beforeValue, afterValue, createdAt }`
  - `fetchAuditLog(action?: string): Promise<AuditLogEntry[]>`
  - `updateUserRole(userId: string, newRole: UserRole): Promise<void>`

- [ ] **Step 1: Add `AuditLogEntry` type, mapper, and `fetchAuditLog`**

Append to the end of `services/dataService.ts` (after the `logAudit` function added in Task 2):

```ts
export interface AuditLogEntry {
  id: string;
  actorId: string | null;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  field: string;
  beforeValue: string | null;
  afterValue: string | null;
  createdAt: string;
}

function toAuditLogEntry(row: Record<string, unknown>): AuditLogEntry {
  return {
    id: row.id as string,
    actorId: (row.actor_id as string) ?? null,
    actorName: row.actor_name as string,
    action: row.action as string,
    entityType: row.entity_type as string,
    entityId: row.entity_id as string,
    field: row.field as string,
    beforeValue: (row.before_value as string) ?? null,
    afterValue: (row.after_value as string) ?? null,
    createdAt: row.created_at as string,
  };
}

export async function fetchAuditLog(action?: string): Promise<AuditLogEntry[]> {
  let query = supabase.from('audit_log').select('*').order('created_at', { ascending: false });
  if (action) query = query.eq('action', action);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toAuditLogEntry);
}
```

- [ ] **Step 2: Add `updateUserRole`**

Append directly after `fetchAuditLog`:

```ts
export async function updateUserRole(userId: string, newRole: UserRole): Promise<void> {
  const { data: current } = await supabase.from('profiles').select('role').eq('id', userId).single();

  const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
  if (error) throw error;

  if (current && current.role !== newRole) {
    await logAudit({
      action: 'role_change',
      entityType: 'profile',
      entityId: userId,
      field: 'role',
      before: current.role,
      after: newRole,
    });
  }
}
```

- [ ] **Step 3: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add services/dataService.ts
git commit -m "feat: add updateUserRole and fetchAuditLog to dataService"
```

---

## Task 4: AdminPanel — introduce tabs, add Users tab

**Files:**
- Modify: `components/AdminPanel.tsx`

**Interfaces:**
- Consumes: `fetchUsers` (existing, unused import to add), `updateUserRole` (Task 3), `User` (existing import to add from `../types`), `UserRole` (existing import to add from `../types`).
- Produces: `AdminPanel` now has an `activeTab: 'overview' | 'users' | 'audit'` state and a tab bar; all existing content (overdue tile, charts, violations table, modal) moves under `activeTab === 'overview'`. The `audit` tab is stubbed as an empty `<div>` in this task — populated in Task 5.

- [ ] **Step 1: Add imports**

In `components/AdminPanel.tsx`, change:

```ts
import { fetchViolations, fetchReports } from '../services/dataService';
import { Violation, Report } from '../types';
```

to:

```ts
import { fetchViolations, fetchReports, fetchUsers, updateUserRole } from '../services/dataService';
import { Violation, Report, User, UserRole } from '../types';
```

- [ ] **Step 2: Add tab state, users state, and role-change handler**

Immediately after the existing `overdueCount` computation (`const overdueCount = reports.filter(...).length;`), add:

```ts
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'audit'>('overview');

  const [users, setUsers] = useState<User[]>([]);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  useEffect(() => {
    fetchUsers().then(setUsers).catch(() => {});
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setSavingUserId(userId);
    try {
      await updateUserRole(userId, newRole);
      fetchUsers().then(setUsers).catch(() => {});
    } finally {
      setSavingUserId(null);
    }
  };
```

- [ ] **Step 3: Add the tab bar**

In the JSX, insert this directly after the closing `</header>` tag and before the overdue-tile `<div>`:

```tsx
      <div className="flex gap-2">
        {(['overview', 'users', 'audit'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
              activeTab === tab ? 'bg-[#111111] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {tab === 'overview' ? 'Overview' : tab === 'users' ? 'Users' : 'Audit Log'}
          </button>
        ))}
      </div>
```

- [ ] **Step 4: Wrap the existing overview content in `activeTab === 'overview'`**

Wrap everything from the overdue-tile `<div>` through the closing of the "Violation Detail Modal" block (i.e. everything currently between `</header>` and the final `</div>` that closes the component's root `<div className="space-y-5 pb-12">`) in a fragment gated on `activeTab === 'overview'`:

```tsx
      {activeTab === 'overview' && (
        <>
          <div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4">
            {/* ... overdue tile, unchanged ... */}
          </div>

          {/* Analytics Row */}
          {/* ... unchanged ... */}

          {/* Enforcement Table */}
          {/* ... unchanged ... */}

          {/* Violation Detail Modal */}
          {/* ... unchanged ... */}
        </>
      )}
```

Concretely: add `{activeTab === 'overview' && (\n  <>` immediately before the overdue-tile `<div className="bg-white border border-gray-100 rounded-2xl p-6 flex items-center gap-4">`, and add `</>\n)}` immediately after the closing `</div>` of the "Violation Detail Modal" section (the one that closes `{selectedViolation && (...)}`), right before the component's final root-closing `</div>`.

- [ ] **Step 5: Add the Users tab body**

Insert this immediately after the closing `)}` from Step 4 (still inside the component's root `<div>`, as a sibling to the overview block):

```tsx
      {activeTab === 'users' && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="uppercase text-[10px] tracking-widest font-bold text-gray-400 bg-gray-50/50">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Unit</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-gray-500">{u.unit || '-'}</td>
                    <td className="px-6 py-4 text-gray-400">{u.email || '-'}</td>
                    <td className="px-6 py-4">
                      <select value={u.role} disabled={savingUserId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value as UserRole)}
                        className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none">
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div />
      )}
```

- [ ] **Step 6: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 7: Manual smoke test**

Start the dev server, log in as MANAGEMENT, open the admin dashboard, confirm the "Overview / Users / Audit Log" tab bar renders and switching to "Overview" still shows the charts/violations table/overdue tile exactly as before. Switch to "Users", confirm the seeded accounts list with their current roles, change one non-critical test account's role via the dropdown (e.g. a RESIDENT test account you don't otherwise need), confirm the dropdown reflects the new value after the row refreshes, then change it back to avoid leaving test data in a confusing state.

- [ ] **Step 8: Commit**

```bash
git add components/AdminPanel.tsx
git commit -m "feat: add tab structure and Users tab (role change) to AdminPanel"
```

---

## Task 5: AdminPanel — Audit Log tab

**Files:**
- Modify: `components/AdminPanel.tsx`

**Interfaces:**
- Consumes: `fetchAuditLog`, `AuditLogEntry` (Task 3).

- [ ] **Step 1: Add the import**

Change:

```ts
import { fetchViolations, fetchReports, fetchUsers, updateUserRole } from '../services/dataService';
```

to:

```ts
import { fetchViolations, fetchReports, fetchUsers, updateUserRole, fetchAuditLog, AuditLogEntry } from '../services/dataService';
```

- [ ] **Step 2: Add audit log state**

Add this after the `handleRoleChange` function (added in Task 4):

```ts
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [auditFilter, setAuditFilter] = useState<'all' | 'violation_status_change' | 'report_update' | 'role_change'>('all');
  useEffect(() => {
    fetchAuditLog(auditFilter === 'all' ? undefined : auditFilter).then(setAuditLog).catch(() => {});
  }, [auditFilter]);
```

- [ ] **Step 3: Replace the Audit Log tab stub**

Replace the stub added in Task 4:

```tsx
      {activeTab === 'audit' && (
        <div />
      )}
```

with:

```tsx
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['all', 'violation_status_change', 'report_update', 'role_change'] as const).map(a => (
              <button key={a} onClick={() => setAuditFilter(a)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
                  auditFilter === a ? 'bg-[#111111] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}>
                {a === 'all' ? 'All' : a === 'violation_status_change' ? 'Violation' : a === 'report_update' ? 'Report' : 'Role'}
              </button>
            ))}
          </div>
          <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="uppercase text-[10px] tracking-widest font-bold text-gray-400 bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4">Time</th>
                    <th className="px-6 py-4">Actor</th>
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Field</th>
                    <th className="px-6 py-4">Before → After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {auditLog.length === 0 && (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-400">No audit entries yet.</td></tr>
                  )}
                  {auditLog.map(entry => (
                    <tr key={entry.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-gray-400">{new Date(entry.createdAt).toLocaleString()}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">{entry.actorName}</td>
                      <td className="px-6 py-4 text-gray-500">{entry.action}</td>
                      <td className="px-6 py-4 text-gray-500">{entry.field}</td>
                      <td className="px-6 py-4 text-gray-900 text-xs">{entry.beforeValue ?? '-'} → {entry.afterValue ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
```

- [ ] **Step 4: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 5: Manual smoke test**

As MANAGEMENT, go to Maintenance and change a report's status (any seeded report), then go back to AdminPanel > Audit Log and confirm a new row appears with action "report_update", field "status", and the correct before → after values. Try the filter buttons and confirm "Report" isolates it.

- [ ] **Step 6: Commit**

```bash
git add components/AdminPanel.tsx
git commit -m "feat: add Audit Log tab to AdminPanel"
```

---

## Task 6: Full regression pass — RLS check + Playwright smoke test

**Files:**
- Create: `scripts/verify-audit-rls.mjs`

**Interfaces:**
- Consumes: `@supabase/supabase-js` directly, `.env` (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`), a seeded RESIDENT test account's credentials, a seeded MANAGEMENT test account's credentials.

This task verifies the one behavior that can't be checked by clicking through the UI: that a non-MANAGEMENT account genuinely cannot read `audit_log` rows, even though rows exist. RLS `SELECT` policies filter silently (return an empty result, not an error), so this needs an explicit script rather than an on-screen error to look for.

- [ ] **Step 1: Write the RLS verification script**

```js
// scripts/verify-audit-rls.mjs
// Run with: node --env-file=.env scripts/verify-audit-rls.mjs
import { createClient } from '@supabase/supabase-js';

function assert(cond, msg) {
  if (!cond) throw new Error('FAILED: ' + msg);
  console.log('OK: ' + msg);
}

const RESIDENT_EMAIL = process.env.VERIFY_RESIDENT_EMAIL;
const RESIDENT_PASSWORD = process.env.VERIFY_RESIDENT_PASSWORD;
const MANAGEMENT_EMAIL = process.env.VERIFY_MANAGEMENT_EMAIL;
const MANAGEMENT_PASSWORD = process.env.VERIFY_MANAGEMENT_PASSWORD;

async function run() {
  // MANAGEMENT: should see at least one row (Task 4/5's manual test already wrote some).
  const mgmtClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: mgmtSignInError } = await mgmtClient.auth.signInWithPassword({
    email: MANAGEMENT_EMAIL, password: MANAGEMENT_PASSWORD,
  });
  if (mgmtSignInError) throw mgmtSignInError;
  const { data: mgmtRows, error: mgmtError } = await mgmtClient.from('audit_log').select('*');
  if (mgmtError) throw mgmtError;
  assert(mgmtRows.length > 0, `MANAGEMENT can read audit_log (${mgmtRows.length} rows visible)`);

  // RESIDENT: RLS should return zero rows, not an error.
  const residentClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: residentSignInError } = await residentClient.auth.signInWithPassword({
    email: RESIDENT_EMAIL, password: RESIDENT_PASSWORD,
  });
  if (residentSignInError) throw residentSignInError;
  const { data: residentRows, error: residentError } = await residentClient.from('audit_log').select('*');
  if (residentError) throw residentError;
  assert(residentRows.length === 0, 'RESIDENT reads audit_log and gets zero rows (RLS blocks it)');

  console.log('\nAll audit RLS assertions passed.');
}

run().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Run the script**

Run: `node --env-file=.env scripts/verify-audit-rls.mjs` with `VERIFY_RESIDENT_EMAIL`/`VERIFY_RESIDENT_PASSWORD` and `VERIFY_MANAGEMENT_EMAIL`/`VERIFY_MANAGEMENT_PASSWORD` set to seeded test accounts (password `Nadayu28!` for all seeded accounts per `supabase_users.sql`).

Expected: both `OK:` assertions print, then `All audit RLS assertions passed.`

- [ ] **Step 3: Playwright smoke pass over the full feature**

Using the same headless-Chromium approach established in Phase 1 (`playwright` already installed in this project), drive through, against the local dev server:

1. Log in as MANAGEMENT → AdminPanel → Users tab → change a test RESIDENT account's role to TENANT → confirm the dropdown shows the new value.
2. AdminPanel → Audit Log tab → filter "Role" → confirm one row shows that change with the correct before/after values → change the role back to RESIDENT to restore test data.
3. Log in as MANAGEMENT → Maintenance → change a report's status → AdminPanel → Audit Log → filter "Report" → confirm the entry appears.
4. AdminPanel → Enforcement Table (Overview tab) → mark a violation as paid (existing pre-Phase-2 UI) → Audit Log → filter "Violation" → confirm the entry appears with `before: 'pending'`, `after: 'paid'`.
5. Log in as a RESIDENT/TENANT/SECURITY test account → confirm there is no "Audit Log" or "Users" tab reachable at all (AdminPanel itself is MANAGEMENT-only, unchanged from before this phase — this just confirms the new tabs didn't accidentally get exposed elsewhere).

Expected: no thrown errors; each assertion (dropdown value, table row presence, before/after values) holds.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-audit-rls.mjs
git commit -m "test: add audit_log RLS verification script and complete Phase 2 regression pass"
```
