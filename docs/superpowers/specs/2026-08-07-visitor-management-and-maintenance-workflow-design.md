# Phase 1: Visitor Management & Maintenance Workflow Closed-Loop

## Context

Nadayu28 is a community management portal being built for a real residential
property (Nadayu28), with the eventual goal of pitching it to Nadayu28's
property management office for actual use. The outreach email to management
specifically calls out two pain points as the reason this project exists:

1. Visitor registration and record-keeping at the guardhouse is still
   handled manually / on paper.
2. Facility booking conflicts and maintenance request tracking are
   informal and hard to trace.

The app already has a working data layer (Supabase, direct client + RLS,
`services/dataService.ts`), is deployed to Vercel, and has verified
end-to-end flows for login, facility booking, parking, QR-based booking
validation, and issue reporting (submission only, no follow-up).

This spec covers the two features that most directly deliver on what was
promised in the outreach email. A visual redesign and a possible Next.js
migration were considered but are explicitly deferred — see "Deferred work"
below.

**Timeline**: ~1 month total for the project. This phase should be
completable well within that window, leaving room for Phase 2 (audit trail)
and any design/framework work afterward.

## Goals

- A resident can invite a visitor and get a QR code to share with them.
- Security can scan that QR code, see the visitor's expected details, flag
  arrivals that don't match the expected time window, and capture a photo
  of the visitor's MyKad as part of check-in.
- A submitted maintenance report can be assigned (by name, not a login
  account), progressed through statuses, and the resident can see that
  progress without calling anyone.
- Management has a simple, visible signal for reports that have sat
  untouched too long.

## Non-goals (explicitly out of scope for this phase)

- Payment/billing (Nadayu28 likely already has a separate system for this).
- Real user accounts / logins for maintenance staff — assignment is a text
  note, not a portal role.
- Automated escalation, SMS/push notifications, or a full ticketing SLA
  engine — just a visible "overdue" count.
- Visual redesign or Next.js migration (deferred; see below).

## Deferred work (not in this spec, tracked for later)

- **Phase 2**: Audit trail (who changed what, when) for sensitive actions
  (violation edits, report status changes, role changes).
- **Phase 3 / stretch, order TBD**: Document management (AGM minutes, house
  rules), full visual redesign, Next.js migration. None of these change
  whether the app is usable/sellable, so they're intentionally last.

---

## Feature 1: Visitor Management

### Data model

New table `public.visitors`:

| column | type | notes |
|---|---|---|
| `id` | text (PK) | e.g. `v` + timestamp, matches existing id convention |
| `resident_id` | uuid, FK `auth.users(id)` | who invited the visitor |
| `resident_unit` | text | denormalized for fast RLS/lookup, matches existing pattern (e.g. `bookings.resident_unit`) |
| `visitor_name` | text, not null | |
| `visitor_phone` | text | |
| `purpose` | text | optional, free text |
| `expected_arrival` | timestamptz, not null | |
| `expected_departure` | timestamptz | optional |
| `status` | text, default `'scheduled'` | `scheduled \| arrived \| departed \| flagged` |
| `actual_arrival` | timestamptz | set when security scans them in |
| `id_photo_path` | text | Supabase Storage object path, not a public URL |
| `qr_code` | text | JSON payload, same pattern as `bookings.qr_code` |
| `created_at` | timestamptz, default now() | |

RLS, following the existing pattern used for `bookings`/`reports`:
- `visitors_select`: `auth.uid() = resident_id OR profiles.role IN ('SECURITY','MANAGEMENT')`
- `visitors_insert`: `auth.role() = 'authenticated'`
- `visitors_update_staff`: only `SECURITY`/`MANAGEMENT` can update (check-in,
  flag, attach photo) — residents cannot edit after creation.

**Storage**: new Supabase Storage bucket `visitor-ids`, private (not public).
Bucket policy: only `SECURITY`/`MANAGEMENT` roles can read; only
`SECURITY`/`MANAGEMENT` can write. Residents have no access, including to
their own invited visitors' photos — this is a security-only record.

### Resident flow

New "Invite Visitor" entry point (Dashboard quick action + nav item,
following the existing card pattern already used for Amenities/Parking).
Form: visitor name, phone, purpose (optional), expected arrival, expected
departure (optional). On submit, generate a QR payload (same shape as
`ParkingBooking`'s: enough fields for the scanner to look the record up,
e.g. `{ type: 'visitor', id }`) and show it full-screen for the resident to
share (screenshot / share sheet), matching the existing `QRCodeSVG` pattern
from `ParkingBooking.tsx`.

### Security flow

Extend the existing `SecurityScanner.tsx` (it already has a working
camera/QR pipeline via `html5-qrcode` — this reuses it, not a rewrite)
with a mode toggle: **Booking QR** (existing behavior, untouched) vs
**Visitor QR** (new). On a successful visitor scan:

1. Look up the visitor record, show name / phone / host unit / expected
   window.
2. Compare `now()` to `expected_arrival`: if the difference is more than
   30 minutes, show a flagged/warning state (matches the anomaly-detection
   idea from the original `INTEGRATION_GUIDE.md`).
3. Prompt to capture a MyKad photo — reuse the same
   `<input type="file" accept="image/*" capture="environment">` pattern
   already used in `Reporting.tsx` for issue photos, upload to the
   `visitor-ids` bucket, store the path on the visitor row.
4. Security marks the visitor "Arrived" (sets `actual_arrival`, `status`)
   via a button on the result screen. A separate "Mark Departed" button
   (shown once a visitor is in "arrived" state, findable via a simple
   today's-arrivals list) sets `status = 'departed'` — no second QR scan
   required, to keep the flow simple.

### PDPA note

MyKad photos are sensitive personal data under Malaysia's Personal Data
Protection Act. This spec keeps the technical side correct (private
bucket, staff-only RLS, no resident access) but does **not** implement a
consent flow or retention policy — that's a process/legal decision for
Nadayu28's management, not a code change. Worth raising with them
separately.

---

## Feature 2: Maintenance Workflow Closed-Loop

### Data model changes

`public.reports` already has `assigned_to uuid REFERENCES auth.users(id)`
from the existing schema. Since maintenance staff won't have portal
accounts, this is being replaced with a free-text field instead of a user
reference:

- `ALTER TABLE public.reports DROP COLUMN assigned_to;`
- `ALTER TABLE public.reports ADD COLUMN assigned_to_name text;`
- `ALTER TABLE public.reports ADD COLUMN resolution_notes text;`

Status values stay as already defined: `Received | In Progress | Resolved`.

RLS: existing `reports_update_staff` policy (SECURITY/MANAGEMENT can
update) already covers this — no policy changes needed, just new columns.

### Management-side UI

New "Maintenance" nav item, visible to both `SECURITY` and `MANAGEMENT`
(not nested inside `AdminPanel`, since that page is currently
`MANAGEMENT`-only and this needs to be reachable by `SECURITY` too),
listing all reports with filters by status. Each row can be expanded to:
- Change status (`Received → In Progress → Resolved`)
- Set `assigned_to_name` (plain text input)
- Add `resolution_notes`

This is a new `dataService.ts` function, `updateReport(id, fields)`,
following the existing `updateViolationStatus` pattern already in the file.

### Resident-side visibility

`Profile.tsx` (or wherever a resident's own reports are listed — needs a
`fetchReports(unit)` call, which already exists in `dataService.ts` but
isn't wired into any component yet) shows status + resolution notes for
each report the resident submitted.

### Overdue signal

In `AdminPanel`, a simple stat tile: count of reports where
`status = 'Received'` and `created_at` is more than 24 hours ago. Pure
client-side computation on the already-fetched reports list — no new
backend logic, no cron job, no notifications.

---

## Testing / verification approach

Following the pattern already used in this project (no formal test suite
yet — verification has been manual end-to-end checks against the live
Supabase project via a headless browser):

- Apply the schema migration (new `visitors` table, storage bucket, altered
  `reports` columns) directly against the Supabase project.
- Seed 1-2 test visitor records for manual QR-scan verification.
- Re-run the same kind of Playwright-driven smoke check used earlier this
  session: invite a visitor as a resident, scan as security, confirm the
  photo upload and flag logic; submit a report, change its status as
  management, confirm the resident view reflects it.

## Open questions / risks

- **MyKad photo storage cost/retention**: not addressed here — Supabase
  Storage free tier has limits; if this becomes real, a retention policy
  (auto-delete after N days) would need defining with Nadayu28 management.
- **"Assigned to" as free text** means no accountability tracking of *when*
  it was assigned or by whom beyond the resolution notes — acceptable
  given the no-staff-accounts constraint, but worth knowing as a
  limitation if this ever needs to scale beyond one building.
