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
