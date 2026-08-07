# Package/Delivery Notifications (Phase 4b)

## Context

Part of the same competitive-parity push as Phase 4a (billing) — see
[[project-gotomarket-strategy]]. Real platforms track package/delivery
arrivals as part of the front-desk/visitor-management workflow
(i-Neighbour explicitly supports "pre-register guests and delivery
drivers"). Nadayu28's Dashboard already displays a "Package delivery
confirmed at the main lobby" notification, but it's hardcoded fake text —
identified by the user as the next concrete gap to close after billing.

## Data model

One new table, migration `supabase_packages.sql`, run after
`supabase_billing.sql`:

```sql
CREATE TABLE public.packages (
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
```

`description` and `courier` are optional free text (e.g. "Amazon box",
"J&T") — logging staff may not always know or bother recording these,
matching how `Report`'s `description` and `Violation`'s fields are
handled elsewhere: required fields are the minimum needed for the
workflow to function (`unit`), optional ones capture extra context when
available.

## RLS

Same shape as `visitors` (the existing precedent for "staff logs,
resident-scoped-or-staff reads" — confirmed via `supabase_visitors_and_maintenance.sql`):

```sql
CREATE POLICY "packages_select" ON public.packages
  FOR SELECT USING (
    unit = (SELECT unit FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

CREATE POLICY "packages_write_staff" ON public.packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );
```

(Uses the inline `role IN ('SECURITY','MANAGEMENT')` check rather than
`is_management()`, because `is_management()` only covers MANAGEMENT —
this needs both roles, exactly matching `visitors_update_staff`'s
existing pattern.)

## UI

One new component, `components/Packages.tsx`, one new nav item
**Packages** visible to all four roles (same visibility pattern as
Documents) — content differs by role within the single component
(same `isStaff = currentUserRole === SECURITY || MANAGEMENT` branching
pattern `Documents.tsx` already uses for `isManagement`):

- **SECURITY / MANAGEMENT**: a log-new-package form (unit, description,
  courier — unit required, rest optional) and a table of all packages
  (unit, description, courier, received time, status) with a "Mark
  Collected" action on `waiting` rows.
- **RESIDENT / TENANT**: read-only list of their own unit's packages,
  newest first, with a status badge (waiting = accent-colored/pending
  styling matching how `unpaid` invoices render, collected =
  `nadayu-success` matching every other "done" state in the app).

## Dashboard notification wiring

`Dashboard.tsx`'s "Notifications" card currently renders a hardcoded
2-item array (`Gymnasium maintenance...`, `Package delivery
confirmed...`). Replace it with a real fetch: packages for the current
user's unit with `status = 'waiting'`, each rendered as "Package waiting
for pickup at the lobby" (plus courier/description if present) with a
relative time ("2h ago"-style, computed from `received_at`). If there are
zero waiting packages, show an empty-state line ("No new notifications")
rather than leaving stale fake content or an empty card. The "2 new"
badge next to the card header becomes the real waiting-package count.

## Non-goals

- No push notifications, SMS, or email — this is in-app display only,
  consistent with the rest of the app's notification-free architecture.
- No photo upload for packages (unlike visitor ID photos) — a courier
  drop-off doesn't need identity verification the way a visitor does.
- No multi-package-per-resident batching UI (e.g., "3 packages waiting"
  grouped specially) — each package is its own list row; this is fine at
  this project's scale.
- No barcode/tracking-number scanning — `description`/`courier` are
  freeform text, not integrated with any courier API.

## Testing / verification approach

Same as every previous phase: `npx tsc --noEmit` + `npm run build` per
task, a `scripts/verify-packages-rls.mjs` (resident can read own unit's
packages and not others', resident cannot write, SECURITY/MANAGEMENT can
read and write all), and a manual Playwright pass: SECURITY logs a
package for a test unit, confirms it appears in the resident's Packages
list AND in that resident's Dashboard notification card, marks it
collected, confirms the Dashboard notification clears and the Packages
list shows the collected status.
