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
DROP POLICY IF EXISTS "profiles_select_staff" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_staff" ON public.profiles;

CREATE POLICY "profiles_select_staff" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MANAGEMENT')
  );

CREATE POLICY "profiles_update_staff" ON public.profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MANAGEMENT')
  );

-- ── VERIFY ──────────────────────────────────────────────────
SELECT 'audit_log' AS tbl, COUNT(*) AS rows FROM public.audit_log;

SELECT policyname FROM pg_policies WHERE tablename = 'audit_log' ORDER BY policyname;

SELECT policyname FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;
