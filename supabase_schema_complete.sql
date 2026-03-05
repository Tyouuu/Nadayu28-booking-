-- ============================================================
-- Nadayu28 Community Portal - Complete Database Schema
-- Run this in: Supabase Dashboard > SQL Editor > New Query
-- ============================================================


-- ── TABLE 1: profiles ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  unit        TEXT,
  role        TEXT        DEFAULT 'RESIDENT'
                          CHECK (role IN ('RESIDENT','SECURITY','MANAGEMENT')),
  phone       TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE 2: bookings ─────────────────────────────────────
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

-- ── TABLE 3: parking_slots ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.parking_slots (
  id          TEXT        PRIMARY KEY,          -- e.g. P01, P02 ... P72
  slot_number INTEGER     NOT NULL,
  zone        TEXT        NOT NULL              -- 'Visitor Parking' | 'Overnight Parking'
                          CHECK (zone IN ('Visitor Parking','Overnight Parking')),
  status      TEXT        DEFAULT 'available'
                          CHECK (status IN ('available','occupied','reserved','maintenance')),
  booked_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  booking_id  TEXT        REFERENCES public.bookings(id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE 4: vehicles ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehicles (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plate        TEXT        NOT NULL,
  make         TEXT,                            -- e.g. Toyota
  model        TEXT,                            -- e.g. Vios
  color        TEXT,
  is_default   BOOLEAN     DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, plate)
);


-- ── SEED: parking_slots (P01–P36 Visitor, P37–P72 Overnight) ─
INSERT INTO public.parking_slots (id, slot_number, zone, status)
SELECT
  'P' || LPAD(n::TEXT, 2, '0'),
  n,
  CASE WHEN n <= 36 THEN 'Visitor Parking' ELSE 'Overnight Parking' END,
  'available'
FROM generate_series(1, 72) AS n
ON CONFLICT (id) DO NOTHING;


-- ── INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_bookings_user_id     ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date        ON public.bookings(date);
CREATE INDEX IF NOT EXISTS idx_parking_slots_status ON public.parking_slots(status);
CREATE INDEX IF NOT EXISTS idx_parking_slots_zone   ON public.parking_slots(zone);
CREATE INDEX IF NOT EXISTS idx_vehicles_user_id     ON public.vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role        ON public.profiles(role);


-- ── AUTO updated_at TRIGGER ───────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bookings_updated_at      ON public.bookings;
DROP TRIGGER IF EXISTS trg_profiles_updated_at      ON public.profiles;
DROP TRIGGER IF EXISTS trg_parking_slots_updated_at ON public.parking_slots;

CREATE TRIGGER trg_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_parking_slots_updated_at
  BEFORE UPDATE ON public.parking_slots
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── AUTO-CREATE profile on signup ─────────────────────────
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


-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles      ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (safe re-run)
DROP POLICY IF EXISTS "profiles_select_own"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"      ON public.profiles;
DROP POLICY IF EXISTS "bookings_select"          ON public.bookings;
DROP POLICY IF EXISTS "bookings_insert"          ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_own"      ON public.bookings;
DROP POLICY IF EXISTS "bookings_update_staff"    ON public.bookings;
DROP POLICY IF EXISTS "bookings_delete_own"      ON public.bookings;
DROP POLICY IF EXISTS "parking_select_all"       ON public.parking_slots;
DROP POLICY IF EXISTS "parking_update_staff"     ON public.parking_slots;
DROP POLICY IF EXISTS "vehicles_select_own"      ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_insert_own"      ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_update_own"      ON public.vehicles;
DROP POLICY IF EXISTS "vehicles_delete_own"      ON public.vehicles;

-- profiles: users read/edit their own only
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

CREATE POLICY "bookings_insert" ON public.bookings
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "bookings_update_own" ON public.bookings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "bookings_update_staff" ON public.bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT')
    )
  );

CREATE POLICY "bookings_delete_own" ON public.bookings
  FOR DELETE USING (auth.uid() = user_id);

-- parking_slots: everyone can read; only MANAGEMENT can update
CREATE POLICY "parking_select_all" ON public.parking_slots
  FOR SELECT USING (true);

CREATE POLICY "parking_update_staff" ON public.parking_slots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'MANAGEMENT'
    )
  );

-- vehicles: users manage their own vehicles only
CREATE POLICY "vehicles_select_own" ON public.vehicles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "vehicles_insert_own" ON public.vehicles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "vehicles_update_own" ON public.vehicles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "vehicles_delete_own" ON public.vehicles
  FOR DELETE USING (auth.uid() = user_id);


-- ── REAL-TIME ─────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.parking_slots;


-- ── VERIFY ───────────────────────────────────────────────
SELECT
  t.table_name,
  COUNT(c.column_name) AS columns,
  (SELECT COUNT(*) FROM pg_policies p WHERE p.tablename = t.table_name) AS rls_policies
FROM information_schema.tables t
JOIN information_schema.columns c
  ON c.table_name = t.table_name AND c.table_schema = 'public'
WHERE t.table_schema = 'public'
  AND t.table_name IN ('profiles','bookings','parking_slots','vehicles')
GROUP BY t.table_name
ORDER BY t.table_name;
