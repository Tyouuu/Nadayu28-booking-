-- ============================================================
-- Nadayu28 Community Portal - Complete Supabase Schema
-- Run in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================


-- ── STEP 1: Create profiles table ─────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  unit        TEXT,
  role        TEXT DEFAULT 'RESIDENT'
                   CHECK (role IN ('RESIDENT','SECURITY','MANAGEMENT')),
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── STEP 2: Create bookings table ─────────────────────────
CREATE TABLE IF NOT EXISTS public.bookings (
  id              TEXT        PRIMARY KEY,
  facility_type   TEXT        NOT NULL,
  date            DATE        NOT NULL,
  start_time      TEXT        NOT NULL,
  duration_hours  INTEGER     NOT NULL CHECK (duration_hours > 0),
  status          TEXT        DEFAULT 'active'
                              CHECK (status IN ('active','cancelled','expired','completed')),
  resident_unit   TEXT,
  details         TEXT,
  qr_code         TEXT,
  is_overnight    BOOLEAN     DEFAULT FALSE,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── STEP 3: Indexes for performance ───────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_user_id   ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status    ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date      ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_profiles_role      ON public.profiles(role);

-- ── STEP 4: Auto-update updated_at timestamp ──────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_updated_at ON public.bookings;
CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── STEP 5: Auto-create profile on signup ─────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'RESIDENT')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ── STEP 6: Row Level Security ────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings  ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (safe re-run)
DROP POLICY IF EXISTS "profiles_select_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON public.profiles;
DROP POLICY IF EXISTS "bookings_select"        ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert"        ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_own"    ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_staff"  ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete_own"    ON public.bookings;

-- profiles: users can read/edit only their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- bookings: residents see their own; staff see all
CREATE POLICY "bookings_select" ON public.bookings
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT')
    )
  );

-- bookings insert: authenticated users only
CREATE POLICY "bookings_insert" ON public.bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- bookings update: own record OR staff
CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bookings_update_staff" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT')
    )
  );

-- bookings delete: own record only
CREATE POLICY "bookings_delete_own" ON public.bookings
  FOR DELETE USING (auth.uid() = user_id);

-- ── STEP 7: Real-time ─────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- ── STEP 8: Verify tables created ────────────────────────
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'bookings')
ORDER BY table_name;
