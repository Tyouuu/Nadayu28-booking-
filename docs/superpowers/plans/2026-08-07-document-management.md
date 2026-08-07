# Document Management (Phase 3a) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let MANAGEMENT upload documents (AGM minutes, house rules, financial reports) that every logged-in user can browse by category and download, with MANAGEMENT also able to delete them.

**Architecture:** Same direct-Supabase-client pattern as every other feature in this app — a new `documents` table + a new private Storage bucket (`documents`), thin CRUD wrappers in `services/dataService.ts`, and a single new role-aware component wired into the existing nav/route switch.

**Tech Stack:** React 19 + TypeScript + Vite, Supabase (Postgres + RLS + Storage) — no new dependencies.

## Global Constraints

- **No formal test suite exists in this repo.** Verification per task is `npx tsc --noEmit` + `npm run build`; behavioral verification is a manual Playwright smoke pass plus a live-Supabase RLS check, exactly as done for Phase 1 and Phase 2.
- Any `MANAGEMENT`-only RLS check must use the `public.is_management()` SECURITY DEFINER function created in Phase 2's migration (`supabase_audit_trail.sql`) — do not write a raw `EXISTS (SELECT 1 FROM public.profiles WHERE ...)` subquery on a policy attached to `profiles` itself (that caused a live production recursion bug in Phase 2). It's safe to use a raw subquery on policies attached to other tables (`documents`, `storage.objects`), but `is_management()` is used everywhere in this plan anyway for consistency and easier auditing.
- Match existing visual style: `#111111` dark panels, `#C8FF00` lime accent, `rounded-2xl`/`rounded-xl` cards, pill-style filter buttons (see `components/Maintenance.tsx`).
- Every `dataService.ts` function in this codebase throws on Supabase error (`if (error) throw error;`) — keep that pattern.

---

## Task 1: Database migration — documents table, documents storage bucket

**Files:**
- Create: `supabase_documents.sql`

**Interfaces:**
- Produces: table `public.documents` (columns: `id, title, category, file_path, file_name, uploaded_by, uploaded_by_name, created_at`), private storage bucket `documents`.

- [ ] **Step 1: Write the migration SQL file**

```sql
-- ============================================================
-- Nadayu28 Community Portal - Document Management (Phase 3a)
-- Run AFTER supabase_audit_trail.sql (requires public.is_management())
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.documents (
  id                TEXT        PRIMARY KEY,
  title             TEXT        NOT NULL,
  category          TEXT        NOT NULL
                                CHECK (category IN ('Meeting Minutes','House Rules','Financial Reports','Other')),
  file_path         TEXT        NOT NULL,
  file_name         TEXT        NOT NULL,
  uploaded_by       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_name  TEXT        NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_category   ON public.documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON public.documents(created_at);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "documents_select" ON public.documents;
DROP POLICY IF EXISTS "documents_insert" ON public.documents;
DROP POLICY IF EXISTS "documents_delete" ON public.documents;

CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (public.is_management());

CREATE POLICY "documents_delete" ON public.documents
  FOR DELETE USING (public.is_management());

-- ── STORAGE: documents (private, all authenticated can read) ──
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "documents_staff_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_staff_delete" ON storage.objects;

CREATE POLICY "documents_staff_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND public.is_management()
  );

CREATE POLICY "documents_authenticated_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' AND auth.role() = 'authenticated'
  );

CREATE POLICY "documents_staff_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents' AND public.is_management()
  );

-- ── VERIFY ──────────────────────────────────────────────────
SELECT 'documents' AS tbl, COUNT(*) AS rows FROM public.documents;

SELECT policyname FROM pg_policies WHERE tablename = 'documents' ORDER BY policyname;

SELECT id, public FROM storage.buckets WHERE id = 'documents';
```

- [ ] **Step 2: Run the migration**

Open the Supabase project dashboard > SQL Editor > New Query, paste the full file contents, and run it. This must run after `supabase_audit_trail.sql` since it depends on `public.is_management()` already existing — if it errors with "function public.is_management() does not exist", Phase 2's migration hasn't been applied to this database yet.

- [ ] **Step 3: Verify**

Confirm the three verification `SELECT`s return: `documents` row count = 0; `documents` policies are exactly `documents_delete`, `documents_insert`, `documents_select`; one row for bucket `documents` with `public = false`.

- [ ] **Step 4: Commit**

```bash
git add supabase_documents.sql
git commit -m "feat: add documents table and documents storage bucket"
```

---

## Task 2: dataService — Document CRUD

**Files:**
- Modify: `services/dataService.ts`

**Interfaces:**
- Consumes: `supabase` client (existing import).
- Produces:
  - `interface Document { id, title, category, filePath, fileName, uploadedBy, uploadedByName, createdAt }`
  - `fetchDocuments(category?: string): Promise<Document[]>`
  - `uploadDocument(params: { title: string; category: string; file: File }): Promise<void>`
  - `deleteDocument(id: string): Promise<void>`
  - `getDocumentDownloadUrl(filePath: string): Promise<string>`

- [ ] **Step 1: Add the `Document` type, mapper, and CRUD functions**

Append to the end of `services/dataService.ts` (after the `updateUserRole` function):

```ts
// ── Documents ─────────────────────────────────────────────────

export interface Document {
  id: string;
  title: string;
  category: string;
  filePath: string;
  fileName: string;
  uploadedBy: string | null;
  uploadedByName: string;
  createdAt: string;
}

function toDocument(row: Record<string, unknown>): Document {
  return {
    id: row.id as string,
    title: row.title as string,
    category: row.category as string,
    filePath: row.file_path as string,
    fileName: row.file_name as string,
    uploadedBy: (row.uploaded_by as string) ?? null,
    uploadedByName: row.uploaded_by_name as string,
    createdAt: row.created_at as string,
  };
}

export async function fetchDocuments(category?: string): Promise<Document[]> {
  let query = supabase.from('documents').select('*').order('created_at', { ascending: false });
  if (category) query = query.eq('category', category);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toDocument);
}

export async function uploadDocument(params: { title: string; category: string; file: File }): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user?.id).single();

  const id = 'd' + Date.now();
  const path = `${id}/${params.file.name}`;

  const { error: uploadError } = await supabase.storage.from('documents').upload(path, params.file);
  if (uploadError) throw uploadError;

  const { error: insertError } = await supabase.from('documents').insert({
    id,
    title: params.title,
    category: params.category,
    file_path: path,
    file_name: params.file.name,
    uploaded_by: user?.id,
    uploaded_by_name: profile?.full_name ?? 'Unknown',
  });
  if (insertError) {
    // Metadata row must not be missing while the file exists — roll back.
    await supabase.storage.from('documents').remove([path]);
    throw insertError;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const { data: doc, error: fetchError } = await supabase.from('documents').select('file_path').eq('id', id).single();
  if (fetchError) throw fetchError;

  const { error: deleteError } = await supabase.from('documents').delete().eq('id', id);
  if (deleteError) throw deleteError;

  if (doc) {
    await supabase.storage.from('documents').remove([doc.file_path]).catch(() => {});
  }
}

export async function getDocumentDownloadUrl(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('documents').createSignedUrl(filePath, 300);
  if (error) throw error;
  return data.signedUrl;
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add services/dataService.ts
git commit -m "feat: add document CRUD functions to dataService"
```

---

## Task 3: Documents page — component, nav item, route

**Files:**
- Create: `components/Documents.tsx`
- Modify: `components/Navigation.tsx`
- Modify: `App.tsx`

**Interfaces:**
- Consumes: `fetchDocuments`, `uploadDocument`, `deleteDocument`, `getDocumentDownloadUrl`, `Document` (Task 2), `useAuth()` for `currentUserRole`, `UserRole` from `../types`.
- Produces: nav view id `'documents'` reachable by all four roles.

- [ ] **Step 1: Create `components/Documents.tsx`**

```tsx
import React, { useState, useEffect } from 'react';
import { FileText, Upload, Download, Trash2, FolderOpen } from 'lucide-react';
import { fetchDocuments, uploadDocument, deleteDocument, getDocumentDownloadUrl, Document } from '../services/dataService';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';

const CATEGORIES = ['Meeting Minutes', 'House Rules', 'Financial Reports', 'Other'] as const;

export const Documents: React.FC = () => {
  const { currentUserRole } = useAuth();
  const isManagement = currentUserRole === UserRole.MANAGEMENT;

  const [documents, setDocuments] = useState<Document[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | typeof CATEGORIES[number]>('all');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('Meeting Minutes');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = () => {
    fetchDocuments(categoryFilter === 'all' ? undefined : categoryFilter).then(setDocuments).catch(() => {});
  };
  useEffect(() => { load(); }, [categoryFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    if (!title.trim() || !file) {
      setUploadError('Title and file are required.');
      return;
    }
    setIsUploading(true);
    try {
      await uploadDocument({ title: title.trim(), category, file });
      setTitle('');
      setFile(null);
      load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    const url = await getDocumentDownloadUrl(doc.filePath);
    window.open(url, '_blank');
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteDocument(id);
      load();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="pb-12">
      <div className="bg-[#111111] rounded-2xl p-8 flex items-center gap-4 mb-5">
        <div className="w-14 h-14 bg-[#C8FF00] rounded-2xl flex items-center justify-center flex-shrink-0">
          <FolderOpen size={28} className="text-[#111111]" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Documents</h2>
          <p className="mt-1 text-sm text-gray-400">Meeting minutes, house rules, and other community documents.</p>
        </div>
      </div>

      {isManagement && (
        <div className="bg-white border border-gray-100 rounded-2xl p-6 mb-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Upload size={18} /> Upload Document
          </h3>
          <form onSubmit={handleUpload} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AGM Minutes - March 2026"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none font-medium text-gray-900 transition-all" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value as typeof CATEGORIES[number])}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#C8FF00]/30 focus:border-[#C8FF00] outline-none font-medium text-gray-900 transition-all">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">File</label>
              <input type="file" accept=".pdf,.doc,.docx,image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:font-bold file:bg-[#111111] file:text-white hover:file:bg-[#222222]" />
            </div>
            {uploadError && <p className="text-sm text-red-500 px-4 py-2 rounded-xl bg-red-50">{uploadError}</p>}
            <button type="submit" disabled={isUploading}
              className="px-6 py-3 rounded-xl font-bold text-white bg-[#111111] hover:bg-[#222222] transition-all disabled:opacity-50">
              {isUploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        {(['all', ...CATEGORIES] as const).map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide transition-colors ${
              categoryFilter === c ? 'bg-[#111111] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>
            {c === 'all' ? 'All' : c}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden divide-y divide-gray-50">
        {documents.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-12">No documents in this category.</p>
        )}
        {documents.map(doc => (
          <div key={doc.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <FileText size={18} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{doc.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{doc.category} · {doc.uploadedByName} · {new Date(doc.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleDownload(doc)}
                className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#111111] px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <Download size={14} /> Download
              </button>
              {isManagement && (
                <button onClick={() => handleDelete(doc.id)} disabled={deletingId === doc.id}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50">
                  <Trash2 size={16} />
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

- [ ] **Step 2: Wire the nav item**

In `components/Navigation.tsx`, add `FolderOpen` to the `lucide-react` import list, then insert a new entry into the `navItems` array right after the `'dashboard'` entry:

```ts
{ id: 'documents', label: 'Documents', icon: FolderOpen, roles: [UserRole.RESIDENT, UserRole.TENANT, UserRole.SECURITY, UserRole.MANAGEMENT] },
```

- [ ] **Step 3: Wire the route**

In `App.tsx`, add the import:

```ts
import { Documents } from './components/Documents';
```

and add a case to `renderContent()`'s switch, after `case 'dashboard':`:

```ts
case 'documents':
  return <Documents />;
```

- [ ] **Step 4: Type-check and build**

Run: `npx tsc --noEmit && npm run build`
Expected: no errors.

- [ ] **Step 5: Manual smoke test**

Start the dev server, log in as MANAGEMENT, open Documents, confirm the upload form is visible, upload a small test PDF (title "Test Doc", category "Other"), confirm it appears in the list below with a Download button and a delete (trash) icon. Click Download and confirm a new tab opens with the file. Click the trash icon and confirm the row disappears. Then log in as a RESIDENT/TENANT test account, open Documents, confirm no upload form and no delete icons are shown, but any documents MANAGEMENT has left in place are still visible and downloadable.

- [ ] **Step 6: Commit**

```bash
git add components/Documents.tsx components/Navigation.tsx App.tsx
git commit -m "feat: add Documents page with category browsing and MANAGEMENT upload/delete"
```

---

## Task 4: Full regression pass — RLS check + Playwright smoke test

**Files:**
- Create: `scripts/verify-documents-rls.mjs`

**Interfaces:**
- Consumes: `@supabase/supabase-js` directly, `.env` (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`), a seeded RESIDENT test account's credentials.

- [ ] **Step 1: Write the RLS verification script**

```js
// scripts/verify-documents-rls.mjs
// Run with: node --env-file=.env scripts/verify-documents-rls.mjs
import { createClient } from '@supabase/supabase-js';

function assert(cond, msg) {
  if (!cond) throw new Error('FAILED: ' + msg);
  console.log('OK: ' + msg);
}

const RESIDENT_EMAIL = process.env.VERIFY_RESIDENT_EMAIL;
const RESIDENT_PASSWORD = process.env.VERIFY_RESIDENT_PASSWORD;

async function run() {
  const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
  const { error: signInError } = await client.auth.signInWithPassword({
    email: RESIDENT_EMAIL, password: RESIDENT_PASSWORD,
  });
  if (signInError) throw signInError;

  const { data: readRows, error: readError } = await client.from('documents').select('*');
  if (readError) throw readError;
  assert(true, `RESIDENT can read documents without an RLS error (${readRows.length} rows visible)`);

  const { error: insertError } = await client.from('documents').insert({
    id: 'dtest' + Date.now(),
    title: 'Should not insert',
    category: 'Other',
    file_path: 'x',
    file_name: 'x',
    uploaded_by_name: 'Test',
  });
  assert(!!insertError, 'RESIDENT insert into documents is rejected by RLS');

  console.log('\nAll documents RLS assertions passed.');
}

run().catch(err => { console.error(err); process.exit(1); });
```

- [ ] **Step 2: Run the script**

Run: `node --env-file=.env scripts/verify-documents-rls.mjs` with `VERIFY_RESIDENT_EMAIL`/`VERIFY_RESIDENT_PASSWORD` set to a seeded RESIDENT test account (password `Nadayu28!`).

Expected: both `OK:` assertions print, then `All documents RLS assertions passed.`

- [ ] **Step 3: Playwright smoke pass**

Using the same headless-Chromium approach established in Phase 1/2, drive through, against the local dev server:

1. Log in as MANAGEMENT → Documents → confirm the upload form renders → upload a test file → confirm it appears in the list.
2. Filter by the category used in step 1 → confirm the uploaded document is still visible; filter by a different category → confirm it disappears from the list.
3. Click Download on the uploaded document → confirm a new browser tab/context opens (a signed URL was returned, not an error).
4. Delete the uploaded test document → confirm it's removed from the list.
5. Log in as a RESIDENT/TENANT test account → Documents → confirm no upload form and no delete icons render, but the page itself loads without error.

Expected: no thrown errors; each assertion (form visibility, list membership after filtering, deletion) holds.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-documents-rls.mjs
git commit -m "test: add documents RLS verification script and complete Phase 3a regression pass"
```
