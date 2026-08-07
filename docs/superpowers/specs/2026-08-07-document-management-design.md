# Phase 3a: Document Management

## Context

Nadayu28 is a community management portal being built for a real residential
property, with the eventual goal of being used by Nadayu28's actual property
management office. Phase 1 (visitor management, maintenance workflow) and
Phase 2 (audit trail for violation/report/role changes) have both shipped
to production.

Phase 3 was originally scoped as three loosely-related items: document
management, a full visual redesign, and a Next.js migration. The latter two
are polish/tech-debt work that don't add functional capability, so they're
being pushed further out; this spec covers document management on its own,
as the first (and, for now, only) piece of Phase 3 being built.

The app already has an `announcements` feature (short free-text posts,
MANAGEMENT-only write, shown on the Dashboard) and one existing private
Storage bucket (`visitor-ids`, from Phase 1, staff-only). This phase adds a
second bucket for file uploads (AGM minutes, house rules, etc.), kept
deliberately separate from announcements — different content shape (files
vs. short text), different audience needs (browse/search a library vs. a
feed), and mixing them would complicate the existing, working announcements
UI for no benefit.

## Goals

- MANAGEMENT can upload a document (title, category, file) and it becomes
  visible to every logged-in user.
- Any logged-in user (RESIDENT, TENANT, SECURITY, MANAGEMENT) can browse
  documents by category and download one.
- MANAGEMENT can delete a document.

## Non-goals (explicitly out of scope for this phase)

- Version history — updating a document means deleting the old one and
  uploading a new one; no old-version retrieval.
- Notifications when a new document is uploaded.
- Integration with the `announcements` feature (kept separate; see Context).
- Search (category filtering is enough at this project's scale).
- File size/type enforcement beyond what the file input's `accept`
  attribute suggests to the browser — Supabase Storage's default bucket
  limits apply, and there's no dedicated validation layer for this.

## Data model

New table `public.documents`:

| column | type | notes |
|---|---|---|
| `id` | text (PK) | e.g. `d` + timestamp, matches existing id convention |
| `title` | text, not null | human-entered title, not the raw filename |
| `category` | text, not null | `Meeting Minutes` \| `House Rules` \| `Financial Reports` \| `Other` |
| `file_path` | text, not null | Storage object path in the `documents` bucket |
| `file_name` | text, not null | original filename, for display next to the title |
| `uploaded_by` | uuid, FK `auth.users(id)` | who uploaded it |
| `uploaded_by_name` | text, not null | snapshot of the uploader's name at upload time, same pattern as `audit_log.actor_name` |
| `created_at` | timestamptz, default now() | |

RLS on `documents`:
- `documents_select`: any authenticated user.
- `documents_insert`: `MANAGEMENT` only.
- `documents_delete`: `MANAGEMENT` only.

**Storage**: new bucket `documents`, private (not public). Bucket policy on
`storage.objects`:
- `documents_staff_insert`: only `MANAGEMENT` can upload.
- `documents_authenticated_select`: any authenticated user can read (so
  downloads work) — unlike `visitor-ids` (staff-only), this bucket's whole
  point is resident-facing content.
- `documents_staff_delete`: only `MANAGEMENT` can delete.

The `MANAGEMENT`-only checks on `documents` and `documents`-bucket policies
must use the `public.is_management()` helper function introduced in Phase 2
(a raw `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND
role = 'MANAGEMENT')` subquery is safe here since neither `documents` nor
`storage.objects` is the same table being queried — recursion only happens
when a policy on `profiles` subqueries `profiles` itself, which Phase 2 hit
and fixed. Using `is_management()` everywhere anyway is simpler to audit
than reasoning about which specific case is safe.)

## Application layer (`services/dataService.ts`)

- `fetchDocuments(category?: string): Promise<Document[]>` — lists
  documents, most recent first, optionally filtered by category.
- `uploadDocument(params: { title: string; category: string; file: File }): Promise<void>` —
  uploads the file to the `documents` bucket (path shaped like
  `visitor-ids` uploads: `${id}/${filename}`), then inserts the metadata
  row. Rolls back the storage object if the metadata insert fails (mirrors
  `createFacilityBooking`'s rollback-on-partial-failure pattern).
- `deleteDocument(id: string): Promise<void>` — deletes the metadata row
  and the storage object. If the row is gone but the storage delete fails,
  that's logged-and-ignored rather than blocking the UI — an orphaned
  storage object with no metadata row is invisible to every list/query in
  this app, so it's harmless clutter rather than a correctness bug.
- `getDocumentDownloadUrl(filePath: string): Promise<string>` — calls
  `supabase.storage.from('documents').createSignedUrl(filePath, 300)` (5
  minute expiry) since the bucket is private; the returned URL is what the
  download link/button actually points to.

## UI

New nav item "Documents", visible to all four roles (unlike Maintenance or
the security scanner, this one has no role-gated content — the difference
between a resident and MANAGEMENT viewing this page is purely whether the
upload form and delete buttons render).

**All users see**: a category filter (`All` / `Meeting Minutes` /
`House Rules` / `Financial Reports` / `Other`) above a list of documents —
title, category badge, uploader name, upload date, and a "Download" button
that calls `getDocumentDownloadUrl` and opens the result.

**MANAGEMENT additionally sees**: an "Upload Document" form (title text
input, category `<select>`, file input using the same
`accept=".pdf,.doc,.docx,image/*"` pattern already used for the tenancy
agreement upload in `Login.tsx`) above the list, and a delete button on
each row.

## Testing / verification approach

Same pattern as Phase 1 and 2: no formal test suite exists. Verification
is `npx tsc --noEmit` + `npm run build` per task, plus a manual Playwright
smoke pass (MANAGEMENT uploads a document, confirms it appears in the
list, downloads it, deletes it; a RESIDENT account confirms they can see
and download the same document but see no upload form or delete button),
and a live-Supabase RLS check confirming a RESIDENT account's insert/delete
attempts against `documents` are rejected.

## Open questions / risks

- **No file size limit is enforced by this app** — relies entirely on
  Supabase Storage's project-level default (currently generous enough for
  PDFs of meeting minutes/house rules). Worth flagging to Nadayu28
  management if this ever needs a stricter policy.
- **Deleting a document is immediate and irreversible** (no version
  history, no trash/undo) — acceptable given MANAGEMENT is a small,
  trusted group of staff accounts, same reasoning already applied to
  other MANAGEMENT-only destructive actions in this app.
