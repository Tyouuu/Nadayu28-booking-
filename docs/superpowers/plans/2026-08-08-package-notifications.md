# Package/Delivery Notifications (Phase 4b) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let SECURITY/MANAGEMENT log package arrivals per unit, let
residents see their own waiting/collected packages, and replace the
Dashboard's hardcoded fake "Package delivery confirmed" notification with
a real one.

**Architecture:** One new Supabase table (`packages`) with RLS mirroring
the existing `visitors` table's staff-vs-own-unit access pattern. A new
`components/Packages.tsx` follows `Documents.tsx`'s exact role-branching
shape (staff get a log form, everyone gets a list). `Dashboard.tsx`'s
notification card switches from a hardcoded array to a real
`fetchPackages(unit)` call filtered to `status === 'waiting'`.

**Tech Stack:** React 19 + TypeScript + Vite, Supabase (Postgres + RLS),
Tailwind design tokens, `lucide-react`.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-08-package-notifications-design.md`
- Migration file: `supabase_packages.sql`, run after `supabase_billing.sql`.
- Staff RLS check uses the inline
  `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))`
  pattern (matching `visitors`), NOT `is_management()` (which only covers
  MANAGEMENT) — packages needs both roles to write.
- No audit_log integration for this feature (unlike billing) — the spec
  does not call for it, don't add it.
- No formal test suite. Verification per task is `npx tsc --noEmit` +
  `npm run build`, plus `scripts/verify-packages-rls.mjs` for the
  migration task, plus a manual Playwright pass in the final task.
- Working directly on `main`, no feature branch.
- Design tokens: `nadayu-bg` `#F8FAFC`, `nadayu-panel` `#0F172A`,
  `nadayu-accent` `#2563EB`, `nadayu-success` `#16A34A`, `nadayu-border`
  `#E2E8F0`, `nadayu-muted` `#64748B`, `nadayu-cream` `#F1F5F9` — use
  token classes for all new UI.

---

### Task 1: Database migration + RLS verification script

**Files:**
- Create: `supabase_packages.sql`
- Create (temporary, delete after use): migration-runner Node script
- Create: `scripts/verify-packages-rls.mjs` (committed)

**Interfaces:**
- Produces: `public.packages` table (columns: `id` TEXT PRIMARY KEY,
  `unit` TEXT NOT NULL, `description` TEXT, `courier` TEXT,
  `received_at` TIMESTAMPTZ, `received_by` UUID, `received_by_name` TEXT,
  `status` TEXT CHECK IN ('waiting','collected'), `collected_at`
  TIMESTAMPTZ, `collected_by` UUID, `collected_by_name` TEXT) — consumed
  by Task 2's `dataService.ts` functions.

- [ ] **Step 1: Write the migration file**

Create `supabase_packages.sql`:

```sql
-- ============================================================
-- Nadayu28 Community Portal - Package/Delivery Notifications (Phase 4b)
-- Run AFTER supabase_billing.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.packages (
  id                TEXT PRIMARY KEY,
  unit              TEXT NOT NULL,
  description       TEXT,
  courier           TEXT,
  received_at       TIMESTAMPTZ DEFAULT NOW(),
  received_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  received_by_name  TEXT,
  status            TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting','collected')),
  collected_at      TIMESTAMPTZ,
  collected_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  collected_by_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_packages_unit ON public.packages(unit);
CREATE INDEX IF NOT EXISTS idx_packages_status ON public.packages(status);

ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packages_select" ON public.packages;
DROP POLICY IF EXISTS "packages_write_staff" ON public.packages;

CREATE POLICY "packages_select" ON public.packages
  FOR SELECT USING (
    unit = (SELECT unit FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

CREATE POLICY "packages_write_staff" ON public.packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

-- ── VERIFY ───────────────────────────────────────────────────
-- SELECT * FROM public.packages;
```

- [ ] **Step 2: Run the migration against the live database**

Write a temporary script (e.g. `_tmp_migrate_packages.mjs`) using the `pg`
package, following the exact pattern used for every previous migration in
this project — connect to `db.byiehilnrroakbocxlas.supabase.co:5432` as
`postgres` (ask the user for the current password; never store it in the
repo), read `supabase_packages.sql`, execute it. Confirm no errors, then
delete the temp script.

- [ ] **Step 3: Write the RLS verification script**

Create `scripts/verify-packages-rls.mjs`:

```js
// scripts/verify-packages-rls.mjs
// Run with: node --env-file=.env scripts/verify-packages-rls.mjs
import { createClient } from '@supabase/supabase-js';

function assert(cond, msg) {
  if (!cond) throw new Error('FAILED: ' + msg);
  console.log('OK: ' + msg);
}

const RESIDENT_EMAIL = process.env.VERIFY_RESIDENT_EMAIL;
const RESIDENT_PASSWORD = process.env.VERIFY_RESIDENT_PASSWORD;
const RESIDENT_UNIT = process.env.VERIFY_RESIDENT_UNIT;
const MANAGEMENT_EMAIL = process.env.VERIFY_MANAGEMENT_EMAIL;
const MANAGEMENT_PASSWORD = process.env.VERIFY_MANAGEMENT_PASSWORD;
const OTHER_UNIT = process.env.VERIFY_OTHER_UNIT || 'A-12-05';

async function run() {
  const mgmtClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: mgmtSignInError } = await mgmtClient.auth.signInWithPassword({
    email: MANAGEMENT_EMAIL, password: MANAGEMENT_PASSWORD,
  });
  if (mgmtSignInError) throw mgmtSignInError;

  // MANAGEMENT (staff) can log a package for the resident's unit.
  const testId = 'pkg-verify-' + Date.now();
  const { error: insertErr } = await mgmtClient.from('packages').insert({
    id: testId, unit: RESIDENT_UNIT, description: 'Test package', courier: 'Test Courier',
    received_by_name: 'Verify Script',
  });
  if (insertErr) throw insertErr;
  assert(true, `MANAGEMENT can log a package for ${RESIDENT_UNIT}`);

  const residentClient = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: residentSignInError } = await residentClient.auth.signInWithPassword({
    email: RESIDENT_EMAIL, password: RESIDENT_PASSWORD,
  });
  if (residentSignInError) throw residentSignInError;

  // RESIDENT cannot write to packages.
  const { error: residentWriteErr } = await residentClient.from('packages').insert({
    id: 'pkg-should-fail', unit: RESIDENT_UNIT, received_by_name: 'Resident',
  });
  assert(!!residentWriteErr, 'RESIDENT is blocked from writing packages');

  // RESIDENT can read their own unit's package.
  const { data: ownPackages, error: ownErr } = await residentClient.from('packages').select('*').eq('unit', RESIDENT_UNIT);
  if (ownErr) throw ownErr;
  assert(ownPackages.some(p => p.id === testId), `RESIDENT can read own unit packages (found test package)`);

  // RESIDENT cannot see another unit's packages.
  const { data: otherPackages, error: otherErr } = await residentClient.from('packages').select('*').eq('unit', OTHER_UNIT);
  if (otherErr) throw otherErr;
  assert(otherPackages.length === 0, `RESIDENT cannot see ${OTHER_UNIT}'s packages`);

  // MANAGEMENT can mark it collected.
  const { error: collectErr } = await mgmtClient.from('packages').update({
    status: 'collected', collected_at: new Date().toISOString(), collected_by_name: 'Verify Script',
  }).eq('id', testId);
  if (collectErr) throw collectErr;
  const { data: collected } = await mgmtClient.from('packages').select('status').eq('id', testId).single();
  assert(collected.status === 'collected', 'MANAGEMENT can mark a package collected');

  console.log('\nAll package RLS assertions passed.');
}

run().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 4: Run the verification script**

```bash
node --env-file=.env scripts/verify-packages-rls.mjs
```
(with `VERIFY_RESIDENT_EMAIL=karwai.wong@email.com`,
`VERIFY_RESIDENT_PASSWORD=Nadayu28!`, `VERIFY_RESIDENT_UNIT=B-06-02`,
`VERIFY_MANAGEMENT_EMAIL=hafiz.a@email.com`,
`VERIFY_MANAGEMENT_PASSWORD=Nadayu28!` set as env vars for this
invocation only.)
Expected: every line prints `OK:`, ending with "All package RLS
assertions passed."

- [ ] **Step 5: Verify build unaffected**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add supabase_packages.sql scripts/verify-packages-rls.mjs
git commit -m "feat: add package/delivery notifications schema and RLS"
```

---

### Task 2: dataService.ts — types and data functions

**Files:**
- Modify: `services/dataService.ts`

**Interfaces:**
- Consumes: `public.packages` from Task 1.
- Produces (consumed by Tasks 3 and 5):
  - `interface Package { id: string; unit: string; description: string | null; courier: string | null; receivedAt: string; receivedByName: string; status: 'waiting' | 'collected'; collectedAt: string | null; collectedByName: string | null; }`
  - `fetchPackages(unit: string): Promise<Package[]>`
  - `fetchAllPackages(): Promise<Package[]>`
  - `logPackage(params: { unit: string; description?: string; courier?: string }): Promise<void>`
  - `markPackageCollected(id: string): Promise<void>`

- [ ] **Step 1: Add the types, mapper, and functions**

Append to `services/dataService.ts` (after the Billing section added in
Phase 4a):

```ts
// ── Packages ─────────────────────────────────────────────────

export interface Package {
  id: string;
  unit: string;
  description: string | null;
  courier: string | null;
  receivedAt: string;
  receivedByName: string;
  status: 'waiting' | 'collected';
  collectedAt: string | null;
  collectedByName: string | null;
}

function toPackage(row: Record<string, unknown>): Package {
  return {
    id: row.id as string,
    unit: row.unit as string,
    description: (row.description as string) ?? null,
    courier: (row.courier as string) ?? null,
    receivedAt: row.received_at as string,
    receivedByName: (row.received_by_name as string) ?? 'Unknown',
    status: row.status as Package['status'],
    collectedAt: (row.collected_at as string) ?? null,
    collectedByName: (row.collected_by_name as string) ?? null,
  };
}

export async function fetchPackages(unit: string): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .eq('unit', unit)
    .order('received_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toPackage);
}

export async function fetchAllPackages(): Promise<Package[]> {
  const { data, error } = await supabase
    .from('packages')
    .select('*')
    .order('received_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toPackage);
}

export async function logPackage(params: { unit: string; description?: string; courier?: string }): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();

  const { error } = await supabase.from('packages').insert({
    id: 'pkg' + Date.now(),
    unit: params.unit,
    description: params.description || null,
    courier: params.courier || null,
    received_by: user?.id,
    received_by_name: profile?.full_name ?? 'Unknown',
  });
  if (error) throw error;
}

export async function markPackageCollected(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();

  const { error } = await supabase.from('packages').update({
    status: 'collected',
    collected_at: new Date().toISOString(),
    collected_by: user?.id,
    collected_by_name: profile?.full_name ?? 'Unknown',
  }).eq('id', id);
  if (error) throw error;
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
git commit -m "feat: add package data functions (log, fetch, mark collected)"
```

---

### Task 3: components/Packages.tsx

**Files:**
- Create: `components/Packages.tsx`

**Interfaces:**
- Consumes: `fetchPackages`, `fetchAllPackages`, `logPackage`,
  `markPackageCollected`, `Package` from Task 2; `useAuth()`
  (`currentUserRole`, `userProfile.unit`).
- Produces: a self-contained page component with no props.

- [ ] **Step 1: Write the component**

```tsx
import React, { useEffect, useState } from 'react';
import { Package as PackageIcon, Truck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { fetchPackages, fetchAllPackages, logPackage, markPackageCollected, Package } from '../services/dataService';

export const Packages: React.FC = () => {
  const { currentUserRole, userProfile } = useAuth();
  const isStaff = currentUserRole === UserRole.SECURITY || currentUserRole === UserRole.MANAGEMENT;

  const [packages, setPackages] = useState<Package[]>([]);
  const [logUnit, setLogUnit] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [logCourier, setLogCourier] = useState('');
  const [isLogging, setIsLogging] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const load = () => {
    if (isStaff) {
      fetchAllPackages().then(setPackages).catch(() => {});
    } else if (userProfile?.unit) {
      fetchPackages(userProfile.unit).then(setPackages).catch(() => {});
    }
  };
  useEffect(() => { load(); }, [isStaff, userProfile?.unit]);

  const handleLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logUnit.trim()) return;
    setIsLogging(true);
    try {
      await logPackage({ unit: logUnit.trim(), description: logDescription.trim(), courier: logCourier.trim() });
      setLogUnit('');
      setLogDescription('');
      setLogCourier('');
      load();
    } finally {
      setIsLogging(false);
    }
  };

  const handleMarkCollected = async (id: string) => {
    setMarkingId(id);
    try {
      await markPackageCollected(id);
      load();
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-nadayu-panel rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-nadayu-accent rounded-2xl flex items-center justify-center flex-shrink-0">
          <PackageIcon size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Packages</h2>
          <p className="mt-1 text-sm text-nadayu-muted">
            {isStaff ? 'Log deliveries and track pickup at the lobby.' : `Deliveries for ${userProfile?.unit ?? 'your unit'}.`}
          </p>
        </div>
      </div>

      {isStaff && (
        <div className="bg-white border border-nadayu-border rounded-2xl p-6 mb-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Truck size={18} /> Log Package
          </h3>
          <form onSubmit={handleLog} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Unit *</label>
                <input type="text" value={logUnit} onChange={(e) => setLogUnit(e.target.value)}
                  placeholder="e.g. B-06-02"
                  className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Description</label>
                <input type="text" value={logDescription} onChange={(e) => setLogDescription(e.target.value)}
                  placeholder="e.g. Amazon box"
                  className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-nadayu-muted uppercase tracking-wider">Courier</label>
                <input type="text" value={logCourier} onChange={(e) => setLogCourier(e.target.value)}
                  placeholder="e.g. J&T"
                  className="w-full px-4 py-3 bg-nadayu-cream border border-nadayu-border rounded-xl focus:ring-2 focus:ring-nadayu-accent/30 focus:border-nadayu-accent outline-none font-medium text-gray-900 transition-all" />
              </div>
            </div>
            <button type="submit" disabled={isLogging || !logUnit.trim()}
              className="px-6 py-3 rounded-xl font-bold text-white bg-nadayu-panel hover:brightness-110 transition-all disabled:opacity-50">
              {isLogging ? 'Logging...' : 'Log Package'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white border border-nadayu-border rounded-2xl overflow-hidden divide-y divide-gray-50">
        {packages.length === 0 && (
          <p className="text-sm text-nadayu-muted text-center py-12">No packages yet.</p>
        )}
        {packages.map(pkg => (
          <div key={pkg.id} className="flex items-center justify-between px-6 py-4 hover:bg-nadayu-cream/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-nadayu-cream rounded-xl flex items-center justify-center flex-shrink-0">
                <PackageIcon size={18} className="text-nadayu-muted" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  {isStaff && <span className="text-nadayu-accent">{pkg.unit}</span>}
                  {isStaff && pkg.description ? ' · ' : ''}
                  {pkg.description ?? (isStaff ? '' : 'Package')}
                </p>
                <p className="text-xs text-nadayu-muted mt-0.5">
                  {pkg.courier ? `${pkg.courier} · ` : ''}{pkg.receivedByName} · {new Date(pkg.receivedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                pkg.status === 'collected' ? 'bg-nadayu-success/15 text-nadayu-success' : 'bg-orange-50 text-orange-500'
              }`}>
                {pkg.status}
              </span>
              {isStaff && pkg.status === 'waiting' && (
                <button onClick={() => handleMarkCollected(pkg.id)} disabled={markingId === pkg.id}
                  className="flex items-center gap-1.5 text-xs font-bold text-nadayu-muted hover:text-nadayu-panel transition-colors disabled:opacity-50">
                  <CheckCircle2 size={14} /> Mark Collected
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

Note: `Package` (lucide-react icon) and `Package` (the TypeScript type
from `dataService`) share a name — the import aliases the icon as
`PackageIcon` to avoid the collision. Use this alias consistently.

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add components/Packages.tsx
git commit -m "feat: add Packages page (staff logging, resident/tenant view)"
```

---

### Task 4: Wire the 'packages' view into navigation (all 4 roles)

**Files:**
- Modify: `App.tsx`
- Modify: `components/Navigation.tsx`
- Modify: `components/MoreMenu.tsx`
- Modify: `components/MobileTabBar.tsx`

**Interfaces:**
- Consumes: `Packages` component from Task 3.
- Produces: `'packages'` is a reachable `currentView` for all four roles.

- [ ] **Step 1: Add the case to `App.tsx`**

Add the import (alongside the other component imports):
```tsx
import { Packages } from './components/Packages';
```

Add the case (in `renderContent`'s `switch`, alongside the `'billing'`
case added in Phase 4a):
```tsx
      case 'packages':
        return <Packages />;
```

- [ ] **Step 2: Add to `Navigation.tsx`'s desktop sidebar list**

Add `Package as PackageIcon` to the `lucide-react` import (same
name-collision reason as Task 3 — `Package` the icon vs. any local
naming; here it's just for consistency, but check the import list
doesn't already have a plain `Package` bound to something else before
aliasing).

Add a new entry to `navItems`, positioned after `'documents'` (and, since
Phase 4a already inserted `billing` right after `documents`, `packages`
goes after `billing` — reads as a natural "Documents → Billing →
Packages" reference-item cluster). All four roles get it:

```tsx
    { id: 'packages',     label: 'Packages',           icon: PackageIcon,   roles: [UserRole.RESIDENT, UserRole.TENANT, UserRole.SECURITY, UserRole.MANAGEMENT] },
```

- [ ] **Step 3: Add to `MoreMenu.tsx`'s lists for all four roles**

Add `Package as PackageIcon` to the `lucide-react` import.

Add an entry to `MORE_ITEMS` for every role. RESIDENT and TENANT (append
after the `billing` entry added in Phase 4a):

```tsx
    { id: 'packages', label: 'Packages', icon: PackageIcon },
```

SECURITY (append after `documents`):

```tsx
    { id: 'packages', label: 'Packages', icon: PackageIcon },
```

MANAGEMENT (currently `[]` — becomes a one-item array, which is what
gives MANAGEMENT its first-ever "More" tab on mobile, per Step 4 below):

```tsx
  [UserRole.MANAGEMENT]: [
    { id: 'packages', label: 'Packages', icon: PackageIcon },
  ],
```

- [ ] **Step 4: Add to `MobileTabBar.tsx`'s `more` arrays for all four roles**

Add `Package as PackageIcon` to the `lucide-react` import.

Add to RESIDENT's and TENANT's `more` arrays (after the `billing` entry):

```tsx
      { id: 'packages', label: 'Packages', icon: PackageIcon },
```

Add to SECURITY's `more` array (after `documents`):

```tsx
      { id: 'packages', label: 'Packages', icon: PackageIcon },
```

Change MANAGEMENT's config from `more: []` to:

```tsx
    more: [
      { id: 'packages', label: 'Packages', icon: PackageIcon },
    ],
```

This is the change that makes `MobileTabBar`'s existing
`showMoreTab = config.more.length > 0` logic (already in the component
from Phase 4a) start rendering a 6th "More" tab for MANAGEMENT on mobile
— no other change to that logic is needed, it already handles a
role having zero-vs-nonzero `more` items correctly.

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add App.tsx components/Navigation.tsx components/MoreMenu.tsx components/MobileTabBar.tsx
git commit -m "feat: wire Packages into desktop sidebar and mobile More menu for all roles"
```

---

### Task 5: Dashboard.tsx — real notifications

**Files:**
- Modify: `components/Dashboard.tsx`

**Interfaces:**
- Consumes: `fetchPackages`, `Package` from Task 2; `userProfile.unit`
  (already used elsewhere in this file).

- [ ] **Step 1: Read the current file in full**

Read `components/Dashboard.tsx` completely before editing to reconfirm
line numbers. The current top of the file (confirmed via direct read) is:

```tsx
import React, { useEffect, useState } from "react";
import { Booking, Announcement } from "../types";
import { MOCK_ANNOUNCEMENTS, MOCK_BOOKINGS, USE_MOCK_DATA } from "../constants";
import { fetchBookings, fetchAnnouncements } from "../services/dataService";
import { Bell, Clock, ChevronRight, Activity, ArrowUpRight, Car, Dumbbell, MessageSquare, AlertTriangle, Zap, UserPlus } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigation } from "../contexts/NavigationContext";
import { useI18n } from "../contexts/I18nContext";

export const Dashboard: React.FC = () => {
  const { userProfile } = useAuth();
  const { setCurrentView } = useNavigation();
  const { t } = useI18n();
  const [activeBookings, setActiveBookings] = useState<Booking[]>(USE_MOCK_DATA ? MOCK_BOOKINGS.filter(b => b.status === "active") : []);
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>(USE_MOCK_DATA ? MOCK_ANNOUNCEMENTS.slice(0, 3) : []);

  useEffect(() => {
    fetchBookings().then(data => setActiveBookings(data.filter(b => b.status === "active"))).catch(() => {});
    fetchAnnouncements().then(data => setRecentAnnouncements(data.slice(0, 3))).catch(() => {});
  }, []);
```

Confirm this matches before proceeding (Phase 4a's contrast-fix pass only
touched JSX further down this file, not this top section, but verify
anyway since the rule for this whole project is "read before editing").

- [ ] **Step 2: Add the import and state**

Replace:
```tsx
import { fetchBookings, fetchAnnouncements } from "../services/dataService";
```
with:
```tsx
import { fetchBookings, fetchAnnouncements, fetchPackages, Package } from "../services/dataService";
```

Replace:
```tsx
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>(USE_MOCK_DATA ? MOCK_ANNOUNCEMENTS.slice(0, 3) : []);

  useEffect(() => {
    fetchBookings().then(data => setActiveBookings(data.filter(b => b.status === "active"))).catch(() => {});
    fetchAnnouncements().then(data => setRecentAnnouncements(data.slice(0, 3))).catch(() => {});
  }, []);
```
with:
```tsx
  const [recentAnnouncements, setRecentAnnouncements] = useState<Announcement[]>(USE_MOCK_DATA ? MOCK_ANNOUNCEMENTS.slice(0, 3) : []);
  const [waitingPackages, setWaitingPackages] = useState<Package[]>([]);

  useEffect(() => {
    fetchBookings().then(data => setActiveBookings(data.filter(b => b.status === "active"))).catch(() => {});
    fetchAnnouncements().then(data => setRecentAnnouncements(data.slice(0, 3))).catch(() => {});
    if (userProfile?.unit) {
      fetchPackages(userProfile.unit).then(pkgs => setWaitingPackages(pkgs.filter(p => p.status === 'waiting'))).catch(() => {});
    }
  }, [userProfile?.unit]);
```

(The effect's dependency array changes from `[]` to `[userProfile?.unit]`
— this is necessary, not optional: `userProfile` loads asynchronously
after login, so a `[]`-only effect would run once before it's populated
and never re-fetch once it is. `fetchBookings`/`fetchAnnouncements` don't
need the unit and are unaffected by running an extra time if
`userProfile?.unit` changes from `undefined` to a real value.)

- [ ] **Step 3: Replace the hardcoded notifications array**

Replace the current block:
```tsx
              {[
                { text: "Gymnasium maintenance scheduled tomorrow at 9 AM", time: "2h ago" },
                { text: "Package delivery confirmed at the main lobby", time: "5h ago" },
              ].map((n, i) => (
                <div key={i} className={"flex items-start gap-3 py-3" + (i !== 0 ? " border-t border-gray-50" : "")}>
                  <span className="w-1.5 h-1.5 bg-nadayu-accent rounded-full mt-1.5 flex-shrink-0"></span>
                  <p className="text-gray-600 text-xs flex-1 leading-relaxed">{n.text}</p>
                  <span className="text-gray-300 text-[10px] flex-shrink-0 ml-3">{n.time}</span>
                </div>
              ))}
```
with:
```tsx
              {waitingPackages.length === 0 && (
                <p className="text-gray-400 text-xs py-3">No new notifications.</p>
              )}
              {waitingPackages.map((pkg, i) => (
                <div key={pkg.id} className={"flex items-start gap-3 py-3" + (i !== 0 ? " border-t border-gray-50" : "")}>
                  <span className="w-1.5 h-1.5 bg-nadayu-accent rounded-full mt-1.5 flex-shrink-0"></span>
                  <p className="text-gray-600 text-xs flex-1 leading-relaxed">
                    Package waiting for pickup at the lobby{pkg.courier ? ` (${pkg.courier})` : ''}{pkg.description ? ` — ${pkg.description}` : ''}
                  </p>
                  <span className="text-gray-300 text-[10px] flex-shrink-0 ml-3">{new Date(pkg.receivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                </div>
              ))}
```

- [ ] **Step 4: Replace the hardcoded "2 new" badge**

Replace:
```tsx
              <span className="text-[10px] font-bold text-white bg-nadayu-panel px-2 py-0.5 rounded-full">2 {t.dashboard.newNotif}</span>
```
with:
```tsx
              {waitingPackages.length > 0 && (
                <span className="text-[10px] font-bold text-white bg-nadayu-panel px-2 py-0.5 rounded-full">{waitingPackages.length} {t.dashboard.newNotif}</span>
              )}
```
(the badge now only renders when there's something to show, rather than
always claiming "2" regardless of reality).

- [ ] **Step 5: Verify**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 6: Commit**

```bash
git add components/Dashboard.tsx
git commit -m "feat: wire Dashboard notifications to real waiting packages"
```

---

### Task 6: Full regression pass and deploy

**Files:** none (verification only)

**Interfaces:**
- Consumes: the complete feature from Tasks 1-5.

- [ ] **Step 1: Re-run the RLS verification script**

```bash
node --env-file=.env scripts/verify-packages-rls.mjs
```
(with the same `VERIFY_*` env vars as Task 1 Step 4)
Expected: all `OK:` lines, ending with "All package RLS assertions
passed."

- [ ] **Step 2: Grep sweep**

```bash
grep -rn "Gymnasium maintenance scheduled tomorrow" components/
```
Expected: no output (confirms the hardcoded fake notification text is
fully gone, not just supplemented).

- [ ] **Step 3: Full build verification**

```bash
npx tsc --noEmit
npm run build
```
Expected: both succeed.

- [ ] **Step 4: Manual Playwright pass**

Start the dev server. Using the seeded accounts:

- Log in as `siewling.ng@email.com` (SECURITY), go to Packages, log a
  new package for unit `B-06-02` with a description and courier. Confirm
  it appears in the table with status `waiting`.
- Log in as `karwai.wong@email.com` (RESIDENT, unit `B-06-02`). Confirm
  the Dashboard's Notifications card shows the real package notification
  (not the old hardcoded text) and the count badge shows `1`. Go to
  Packages, confirm the same package appears with a `waiting` badge.
- Log back in as SECURITY, go to Packages, click "Mark Collected" on that
  package. Confirm its status flips to `collected`.
- Log back in as the RESIDENT. Confirm the Dashboard notification for
  that package is now gone (badge disappears or count drops to 0, with
  "No new notifications." showing if it was the only one), and the
  Packages page shows it as `collected`.
- At 390px width, confirm "Packages" is NOT one of the direct bottom
  tabs for any role (it's a "More" item everywhere per the plan), and
  that MANAGEMENT — which had no "More" tab at all before this phase —
  now has one, containing "Packages".
- Confirm `siewling.ng@email.com` (SECURITY) sees the log form; confirm
  `karwai.wong@email.com` (RESIDENT) does NOT see a log form, only the
  read-only list.

- [ ] **Step 5: Deploy**

```bash
git push origin main
npx vercel deploy --prod --scope ty28
```
Expected: deployment succeeds, production alias
`https://nadayu28-booking.vercel.app` updates.
