-- ============================================================
-- Nadayu28 Community Portal - Maintenance Fee Billing (Phase 4a)
-- Run AFTER supabase_documents.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================

CREATE TABLE IF NOT EXISTS public.fee_schedules (
  unit           TEXT PRIMARY KEY,
  monthly_amount NUMERIC(10,2) NOT NULL,
  updated_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id                TEXT PRIMARY KEY,
  unit              TEXT NOT NULL,
  period            TEXT NOT NULL,
  amount            NUMERIC(10,2) NOT NULL,
  due_date          DATE NOT NULL,
  status            TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid','paid')),
  paid_date         DATE,
  payment_method    TEXT CHECK (payment_method IN ('bank_transfer','cash','cheque','other')),
  payment_reference TEXT,
  recorded_by       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (unit, period)
);

CREATE INDEX IF NOT EXISTS idx_invoices_unit ON public.invoices(unit);
CREATE INDEX IF NOT EXISTS idx_invoices_period ON public.invoices(period);

ALTER TABLE public.fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "fee_schedules_select" ON public.fee_schedules;
DROP POLICY IF EXISTS "fee_schedules_write_staff" ON public.fee_schedules;
DROP POLICY IF EXISTS "invoices_select" ON public.invoices;
DROP POLICY IF EXISTS "invoices_write_staff" ON public.invoices;

CREATE POLICY "fee_schedules_select" ON public.fee_schedules
  FOR SELECT USING (
    unit = (SELECT unit FROM public.profiles WHERE id = auth.uid())
    OR public.is_management()
  );

CREATE POLICY "fee_schedules_write_staff" ON public.fee_schedules
  FOR ALL USING (public.is_management());

CREATE POLICY "invoices_select" ON public.invoices
  FOR SELECT USING (
    unit = (SELECT unit FROM public.profiles WHERE id = auth.uid())
    OR public.is_management()
  );

CREATE POLICY "invoices_write_staff" ON public.invoices
  FOR ALL USING (public.is_management());

CREATE OR REPLACE FUNCTION public.ensure_invoices_for_unit(p_unit TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_period TEXT := to_char(CURRENT_DATE, 'YYYY-MM');
  v_amount NUMERIC(10,2);
  v_due_date DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '13 days')::date;
BEGIN
  SELECT monthly_amount INTO v_amount FROM public.fee_schedules WHERE unit = p_unit;
  IF v_amount IS NULL THEN RETURN; END IF;

  INSERT INTO public.invoices (id, unit, period, amount, due_date, status)
  VALUES (p_unit || '-' || v_period, p_unit, v_period, v_amount, v_due_date, 'unpaid')
  ON CONFLICT (unit, period) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_invoices_for_unit(TEXT) TO authenticated;

-- ── extend audit_log to cover invoice payments ──────────────
ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_action_check;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_action_check
  CHECK (action IN ('violation_status_change','report_update','role_change','invoice_payment_recorded'));

ALTER TABLE public.audit_log DROP CONSTRAINT IF EXISTS audit_log_entity_type_check;
ALTER TABLE public.audit_log ADD CONSTRAINT audit_log_entity_type_check
  CHECK (entity_type IN ('violation','report','profile','invoice'));

-- ── VERIFY ───────────────────────────────────────────────────
-- SELECT * FROM public.fee_schedules;
-- SELECT * FROM public.invoices;
