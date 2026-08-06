# Phase 2: Audit Trail

## Context

Nadayu28 is a community management portal being built for a real residential
property, with the eventual goal of being used by Nadayu28's actual property
management office. Phase 1 (visitor management with MyKad photo capture, and
a maintenance report closed-loop workflow) has shipped to production.

Phase 1's design spec flagged the next priority: an audit trail for sensitive
staff actions, so management has visibility into who changed what and when.
This matters because several mutations in the app (violation status, report
status/assignment) are performed by SECURITY/MANAGEMENT on behalf of
residents, with no current record of who made the change.

This spec covers Phase 2 in full. It also adds a small role-change feature
that didn't previously exist in the UI, because auditing "role changes" only
makes sense once there's a way to make one.

## Goals

- Every change to a violation's status, a report's status/assignment/notes,
  or a user's role is recorded: who did it, when, what changed, from what
  value to what value.
- MANAGEMENT can view this history in one place, filterable by action type.
- MANAGEMENT can change a resident's or staff member's role, where
  previously this required a direct database edit.

## Non-goals (explicitly out of scope for this phase)

- Database-trigger-level capture (would also catch direct DB edits, but
  this app has no direct-DB-edit workflow worth defending against — see
  "Approach" below).
- Retention/archival policy for audit_log rows (grows unbounded for now;
  flagged as a future consideration for Nadayu28 management, same pattern
  as the MyKad photo retention note in the Phase 1 spec).
- Auditing visitor check-in/departed or facility/parking bookings — these
  are resident-initiated or routine operational actions, not the kind of
  after-the-fact "who did this" accountability question this phase targets.
- Notifications or alerts on audit events.
- Special-casing a MANAGEMENT user changing their own role — RLS permits
  it like any other role change; not worth extra guard rails for a single
  internal tool with a handful of staff accounts.

## Approach: application-level logging, not database triggers

Two implementations were considered:

1. **Application-level logging** (chosen): the `dataService.ts` functions
   that perform sensitive updates (`updateViolationStatus`, `updateReport`,
   and the new `updateUserRole`) each call a small `logAudit()` helper after
   a successful update, passing exactly which field changed and its
   before/after values.
2. **Postgres triggers**: `AFTER UPDATE` triggers on `violations`, `reports`,
   `profiles` that write raw `OLD`/`NEW` row diffs into an audit table
   automatically, including changes made outside the app.

This app has no backend API layer and no direct-database-edit workflow in
normal operation — every mutation already goes through `dataService.ts`.
Triggers would mainly buy protection against someone editing rows directly
in the Supabase dashboard, which isn't a real threat model for this project
right now, and would cost significantly more implementation complexity
(PL/pgSQL, raw JSONB diffs that aren't human-readable per field) for no
practical benefit here. Application-level logging is simpler, matches the
codebase's existing direct-client pattern, and produces readable per-field
log entries.

## Data model

New table `public.audit_log`:

| column | type | notes |
|---|---|---|
| `id` | text (PK) | e.g. `al` + timestamp, matches existing id convention |
| `actor_id` | uuid, FK `auth.users(id)` | who made the change |
| `actor_name` | text | snapshot of the actor's name at the time of the action, so renaming a staff member later doesn't rewrite history |
| `action` | text | `violation_status_change` \| `report_update` \| `role_change` |
| `entity_type` | text | `violation` \| `report` \| `profile` |
| `entity_id` | text | id of the row that was changed |
| `field` | text | which field changed, e.g. `status`, `assigned_to_name`, `resolution_notes`, `role` |
| `before_value` | text | nullable |
| `after_value` | text | nullable |
| `created_at` | timestamptz, default now() | |

RLS, following the existing pattern used for `reports`/`community_posts`:
- `audit_log_select`: only `MANAGEMENT` can read.
- `audit_log_insert`: any authenticated user can insert — actual writes are
  gated by what `dataService.ts` chooses to log, not by RLS; this mirrors
  `reports_insert_auth`/`community_posts_insert_auth`.

`profiles` currently only has `profiles_update_own` (a user can update their
own row). This phase adds `profiles_update_staff`, allowing `MANAGEMENT` to
update any profile — required for the new role-change feature.

## Application-level logging

New internal helper in `dataService.ts`:

```ts
async function logAudit(entry: {
  action: string;
  entityType: string;
  entityId: string;
  field: string;
  before: string | null;
  after: string | null;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();
  await supabase.from('audit_log').insert({
    id: 'al' + Date.now(),
    actor_id: user?.id,
    actor_name: profile?.full_name ?? 'Unknown',
    ...entry,
  });
}
```

Wired into existing and new functions:

- `updateViolationStatus(id, status)`: fetch the violation's current status
  before updating; after a successful update, if the status actually
  changed, call `logAudit` with `action: 'violation_status_change'`,
  `entityType: 'violation'`, `field: 'status'`.
- `updateReport(id, fields)`: fetch the report's current `status`,
  `assigned_to_name`, `resolution_notes` before updating; after a
  successful update, call `logAudit` once per field that actually changed
  value (a single save that changes both status and resolution notes
  produces two log rows), with `action: 'report_update'`,
  `entityType: 'report'`.
- `updateUserRole(userId, newRole)` (new): fetch the profile's current
  role, update it, then call `logAudit` with `action: 'role_change'`,
  `entityType: 'profile'`, `field: 'role'`.

No changes are needed in the calling components (`Maintenance.tsx`,
`AdminPanel.tsx`'s violation modal) — logging happens inside `dataService.ts`
transparently.

## Role-change feature

New "Users" tab inside `AdminPanel.tsx` (not a new nav item — this is
MANAGEMENT-only, same as the rest of `AdminPanel`). Lists all profiles via
the existing `fetchUsers()`, one row per user, each with a role `<select>`
(`RESIDENT` / `TENANT` / `SECURITY` / `MANAGEMENT`) that calls
`updateUserRole` on change and refreshes the list.

## Audit log viewer

New "Audit Log" tab inside `AdminPanel.tsx`, alongside "Users". A single
table, most recent first: timestamp, actor name, action type, entity,
field, before → after value. A simple dropdown filters by `action`
(`All` / `Violation` / `Report` / `Role`). No pagination in this phase —
the table is expected to stay small enough for a single-building portal
that only three action types are logged for.

## Testing / verification approach

Same pattern as Phase 1: no formal test suite exists in this project.
Verification is `npx tsc --noEmit` + `npm run build` after each change,
plus a manual Playwright smoke pass covering: change a violation's status
and confirm a log row appears with the right before/after values; change a
report's status and resolution notes together and confirm two log rows
appear; change a user's role and confirm a log row appears and the role
actually took effect (re-login as that user, confirm their nav changed);
confirm a RESIDENT/SECURITY account cannot read `audit_log` (RLS check).

## Open questions / risks

- **Unbounded growth**: `audit_log` has no retention policy. Fine at this
  project's scale (one building, three logged action types); would need a
  cleanup policy if this ever scales to many buildings — flagged as a
  future consideration, not blocking.
- **`profiles_update_staff` is broad**: it lets MANAGEMENT update any
  column on any profile, not just `role` — RLS in this codebase is
  consistently row-level rather than column-level (see `bookings_update_staff`,
  `reports_update_staff`), so this matches existing precedent rather than
  introducing a new pattern.
