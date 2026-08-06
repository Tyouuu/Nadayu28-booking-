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
