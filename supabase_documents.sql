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
