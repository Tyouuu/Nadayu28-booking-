-- ============================================================
-- Nadayu28 - Facilities & Time Slots Schema
-- Run AFTER supabase_schema_complete.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================


-- ── TABLE: facilities ─────────────────────────────────────
-- Master list of all community amenities
CREATE TABLE IF NOT EXISTS public.facilities (
  id               TEXT        PRIMARY KEY,   -- matches FacilityType enum
  name             TEXT        NOT NULL,
  icon             TEXT,
  category         TEXT        DEFAULT 'sport'
                               CHECK (category IN ('sport','leisure','event','other')),
  capacity         INTEGER     DEFAULT 10,    -- max people per session
  session_duration INTEGER     DEFAULT 2,     -- hours per booking slot
  status           TEXT        DEFAULT 'active'
                               CHECK (status IN ('active','maintenance','closed')),
  description      TEXT,
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);


-- ── SEED: insert all facilities from the app ──────────────
INSERT INTO public.facilities (id, name, icon, category, capacity, session_duration, status, description) VALUES
  ('GYM',               'Gymnasium',          'Dumbbell',     'sport',   20, 2, 'active',      '2-hour sessions, fully equipped with modern machines'),
  ('SWIMMING_POOL',     'Swimming Pool',      'Waves',        'leisure', 30, 2, 'active',      '2-hour sessions, heated 25m lap pool'),
  ('BBQ',               'BBQ Pit',            'Flame',        'leisure',  8, 3, 'active',      '3-hour slots, includes charcoal and grill setup'),
  ('PARTY_ROOM',        'Party Room',         'PartyPopper',  'event',   40, 4, 'active',      '4-hour rental, fully air-conditioned with AV equipment'),
  ('TENNIS',            'Tennis Court',       'Activity',     'sport',    4, 2, 'active',      '1.5-hour courts, includes racket rental'),
  ('SQUASH_COURT',      'Squash Court',       'Trophy',       'sport',    2, 1, 'active',      '1-hour slots, professional standard court'),
  ('BASKETBALL_COURT',  'Basketball Court',   'Activity',     'sport',   10, 2, 'active',      '2-hour sessions, full size court'),
  ('MULTI_PURPOSE_COURT','3-in-1 Sport Court','LayoutGrid',  'sport',   10, 2, 'active',      '2-hour sessions, badminton / futsal / volleyball')
ON CONFLICT (id) DO UPDATE SET
  name             = EXCLUDED.name,
  icon             = EXCLUDED.icon,
  category         = EXCLUDED.category,
  capacity         = EXCLUDED.capacity,
  session_duration = EXCLUDED.session_duration,
  description      = EXCLUDED.description,
  updated_at       = NOW();


-- ── TABLE: facility_slots ─────────────────────────────────
-- Tracks booked time slots per facility per date
-- Prevents double-booking the same facility at the same time
CREATE TABLE IF NOT EXISTS public.facility_slots (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id   TEXT        NOT NULL REFERENCES public.facilities(id) ON DELETE CASCADE,
  booking_id    TEXT        REFERENCES public.bookings(id) ON DELETE SET NULL,
  date          DATE        NOT NULL,
  start_time    TEXT        NOT NULL,   -- e.g. '09:00'
  end_time      TEXT        NOT NULL,   -- e.g. '11:00'
  status        TEXT        DEFAULT 'booked'
                            CHECK (status IN ('booked','cancelled','completed')),
  booked_by     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (facility_id, date, start_time)  -- prevent double booking
);


-- ── INDEXES ───────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_facility_slots_facility ON public.facility_slots(facility_id);
CREATE INDEX IF NOT EXISTS idx_facility_slots_date     ON public.facility_slots(date);
CREATE INDEX IF NOT EXISTS idx_facility_slots_status   ON public.facility_slots(status);
CREATE INDEX IF NOT EXISTS idx_facilities_status       ON public.facilities(status);


-- ── AUTO updated_at for facilities ────────────────────────
DROP TRIGGER IF EXISTS trg_facilities_updated_at ON public.facilities;
CREATE TRIGGER trg_facilities_updated_at
  BEFORE UPDATE ON public.facilities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── ROW LEVEL SECURITY ────────────────────────────────────
ALTER TABLE public.facilities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_slots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facilities_read_all"         ON public.facilities;
DROP POLICY IF EXISTS "facilities_write_management" ON public.facilities;
DROP POLICY IF EXISTS "slots_read_all"              ON public.facility_slots;
DROP POLICY IF EXISTS "slots_insert_auth"           ON public.facility_slots;
DROP POLICY IF EXISTS "slots_update_own"            ON public.facility_slots;
DROP POLICY IF EXISTS "slots_update_staff"          ON public.facility_slots;

-- facilities: everyone can read; only MANAGEMENT can modify
CREATE POLICY "facilities_read_all" ON public.facilities
  FOR SELECT USING (true);

CREATE POLICY "facilities_write_management" ON public.facilities
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'MANAGEMENT'
    )
  );

-- facility_slots: everyone can read (to see availability)
CREATE POLICY "slots_read_all" ON public.facility_slots
  FOR SELECT USING (true);

-- authenticated users can book a slot
CREATE POLICY "slots_insert_auth" ON public.facility_slots
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- users can cancel their own slot
CREATE POLICY "slots_update_own" ON public.facility_slots
  FOR UPDATE USING (auth.uid() = booked_by);

-- staff can update any slot
CREATE POLICY "slots_update_staff" ON public.facility_slots
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT')
    )
  );


-- ── REAL-TIME on facility_slots ───────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE public.facility_slots;


-- ── VERIFY ────────────────────────────────────────────────
SELECT
  f.id,
  f.name,
  f.category,
  f.session_duration || 'h' AS duration,
  f.capacity,
  f.status
FROM public.facilities f
ORDER BY f.category, f.name;
