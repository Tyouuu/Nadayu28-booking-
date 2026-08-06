-- =============================================
-- Nadayu28 Community Portal - Supabase Schema
-- Run this in: Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  unit        TEXT,
  role        TEXT DEFAULT 'RESIDENT',
  phone       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'RESIDENT')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Bookings
CREATE TABLE IF NOT EXISTS public.bookings (
  id              TEXT PRIMARY KEY,
  facility_type   TEXT NOT NULL,
  date            DATE NOT NULL,
  start_time      TEXT NOT NULL,
  duration_hours  INTEGER NOT NULL,
  status          TEXT DEFAULT 'active',
  resident_unit   TEXT,
  details         TEXT,
  qr_code         TEXT,
  is_overnight    BOOLEAN DEFAULT FALSE,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "bookings_select" ON public.bookings FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
);
CREATE POLICY "bookings_insert" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings_update_own" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "bookings_update_staff" ON public.bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
);

-- 4. Enable real-time
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- 5. Maintenance / repair tasks (Reporting flow)
CREATE TABLE IF NOT EXISTS public.maintenance_tasks (
  id                 TEXT PRIMARY KEY,
  category           TEXT NOT NULL,
  subcategory        TEXT,
  title              TEXT NOT NULL,
  description        TEXT,
  location           TEXT DEFAULT 'Common Area',
  priority           TEXT DEFAULT 'medium',
  status             TEXT DEFAULT 'reported',
  images             TEXT[] DEFAULT '{}',
  resident_unit      TEXT,
  user_id            UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expected_response  TEXT,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "maintenance_select" ON public.maintenance_tasks FOR SELECT USING (
  auth.uid() = user_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
);
CREATE POLICY "maintenance_insert" ON public.maintenance_tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "maintenance_update_staff" ON public.maintenance_tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
);

ALTER PUBLICATION supabase_realtime ADD TABLE public.maintenance_tasks;
