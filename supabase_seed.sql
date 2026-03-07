-- ============================================================
-- Nadayu28 Community Portal - New Tables + Seed Data
-- Run AFTER supabase_schema_complete.sql & supabase_facilities.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================


-- ── STEP 1: Update profiles role CHECK to include TENANT ────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('RESIDENT','TENANT','SECURITY','MANAGEMENT'));


-- ── TABLE: announcements ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.announcements (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL,
  content     TEXT        NOT NULL,
  date        DATE        NOT NULL,
  priority    TEXT        DEFAULT 'low'
                          CHECK (priority IN ('low','medium','high')),
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE: violations ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.violations (
  id          TEXT        PRIMARY KEY,
  unit        TEXT        NOT NULL,
  type        TEXT        NOT NULL,
  date        DATE        NOT NULL,
  status      TEXT        DEFAULT 'pending'
                          CHECK (status IN ('pending','paid')),
  amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes       TEXT,
  created_by  UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE: reports ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
  id              TEXT        PRIMARY KEY,
  date            DATE        NOT NULL,
  category        TEXT        NOT NULL,
  description     TEXT        NOT NULL,
  status          TEXT        DEFAULT 'Received'
                              CHECK (status IN ('Received','In Progress','Resolved')),
  resident_unit   TEXT,
  images          TEXT[],
  assigned_to     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE: community_posts ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.community_posts (
  id              TEXT        PRIMARY KEY,
  author_unit     TEXT        NOT NULL,
  author_name     TEXT        NOT NULL,
  title           TEXT        NOT NULL,
  content         TEXT        NOT NULL,
  date            DATE        NOT NULL,
  category        TEXT        DEFAULT 'general'
                              CHECK (category IN ('general','event','marketplace','lost-found')),
  likes           INTEGER     DEFAULT 0,
  comments        INTEGER     DEFAULT 0,
  user_id         UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ── INDEXES ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_announcements_date     ON public.announcements(date);
CREATE INDEX IF NOT EXISTS idx_announcements_priority ON public.announcements(priority);
CREATE INDEX IF NOT EXISTS idx_violations_unit        ON public.violations(unit);
CREATE INDEX IF NOT EXISTS idx_violations_status      ON public.violations(status);
CREATE INDEX IF NOT EXISTS idx_reports_status         ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_unit           ON public.reports(resident_unit);
CREATE INDEX IF NOT EXISTS idx_community_posts_date   ON public.community_posts(date);
CREATE INDEX IF NOT EXISTS idx_community_posts_cat    ON public.community_posts(category);


-- ── AUTO updated_at TRIGGERS ────────────────────────────────
DROP TRIGGER IF EXISTS trg_announcements_updated_at   ON public.announcements;
DROP TRIGGER IF EXISTS trg_violations_updated_at      ON public.violations;
DROP TRIGGER IF EXISTS trg_reports_updated_at         ON public.reports;
DROP TRIGGER IF EXISTS trg_community_posts_updated_at ON public.community_posts;

CREATE TRIGGER trg_announcements_updated_at
  BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_violations_updated_at
  BEFORE UPDATE ON public.violations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ── ROW LEVEL SECURITY ──────────────────────────────────────
ALTER TABLE public.announcements   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- announcements: everyone can read; MANAGEMENT can write
DROP POLICY IF EXISTS "announcements_read_all"   ON public.announcements;
DROP POLICY IF EXISTS "announcements_write_mgmt" ON public.announcements;

CREATE POLICY "announcements_read_all" ON public.announcements
  FOR SELECT USING (true);

CREATE POLICY "announcements_write_mgmt" ON public.announcements
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'MANAGEMENT')
  );

-- violations: residents see own unit; staff see all
DROP POLICY IF EXISTS "violations_select" ON public.violations;
DROP POLICY IF EXISTS "violations_write_staff" ON public.violations;

CREATE POLICY "violations_select" ON public.violations
  FOR SELECT USING (
    unit = (SELECT unit FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

CREATE POLICY "violations_write_staff" ON public.violations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

-- reports: residents see own; staff see all
DROP POLICY IF EXISTS "reports_select"       ON public.reports;
DROP POLICY IF EXISTS "reports_insert_auth"  ON public.reports;
DROP POLICY IF EXISTS "reports_update_staff" ON public.reports;

CREATE POLICY "reports_select" ON public.reports
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

CREATE POLICY "reports_insert_auth" ON public.reports
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reports_update_staff" ON public.reports
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('SECURITY','MANAGEMENT'))
  );

-- community_posts: everyone can read; authenticated can write
DROP POLICY IF EXISTS "community_posts_read_all"    ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_insert_auth" ON public.community_posts;
DROP POLICY IF EXISTS "community_posts_update_own"  ON public.community_posts;

CREATE POLICY "community_posts_read_all" ON public.community_posts
  FOR SELECT USING (true);

CREATE POLICY "community_posts_insert_auth" ON public.community_posts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "community_posts_update_own" ON public.community_posts
  FOR UPDATE USING (auth.uid() = user_id);


-- ============================================================
-- SEED DATA
-- ============================================================


-- ── SEED: announcements (10) ────────────────────────────────
INSERT INTO public.announcements (id, title, content, date, priority) VALUES
  ('a1',  'Gym Maintenance',           'The Gymnasium will be closed for equipment servicing on 15th Mar from 10 AM to 4 PM.', '2026-03-05', 'high'),
  ('a2',  'New Parking Regulations',   'Please ensure visitor vehicles are registered 1 hour prior to arrival. New system effective from April 1st.', '2026-03-01', 'medium'),
  ('a3',  'Community BBQ Event',       'Join us for the annual community gathering at the poolside BBQ area next Saturday, March 15th from 5 PM.', '2026-02-28', 'low'),
  ('a4',  'Water Supply Disruption',   'Water supply will be temporarily disrupted on March 20th from 9 AM to 3 PM for pipe maintenance in Block B.', '2026-03-06', 'high'),
  ('a5',  'Swimming Pool Cleaning',    'The swimming pool will undergo monthly cleaning on March 12th. Pool access will resume by 6 PM.', '2026-03-03', 'medium'),
  ('a6',  'AGM Notice',               'Annual General Meeting is scheduled for April 5th at the Party Room, 8 PM. All residents are encouraged to attend.', '2026-02-25', 'high'),
  ('a7',  'Lift Upgrade Schedule',     'Lift A in Block C will be upgraded from March 25th to April 2nd. Please use Lift B during this period.', '2026-03-04', 'medium'),
  ('a8',  'Pest Control Treatment',    'Quarterly pest control will be conducted across all blocks on March 18th. Please close all windows.', '2026-03-02', 'medium'),
  ('a9',  'New Guard Shift Hours',     'Security shift hours have been updated. Main gate will now have 24/7 coverage with 3 shifts.', '2026-02-20', 'low'),
  ('a10', 'Recycling Program Launch',  'New recycling bins have been placed at Level 5 of each block. Please separate recyclables accordingly.', '2026-02-15', 'low')
ON CONFLICT (id) DO NOTHING;


-- ── SEED: bookings (28) ─────────────────────────────────────
INSERT INTO public.bookings (id, facility_type, date, start_time, duration_hours, status, resident_unit, details, is_overnight) VALUES
  ('b1',  'PARKING',              '2026-03-08', '14:00', 4,  'active',    'A-06-01', 'WCD 5521', false),
  ('b2',  'PARKING',              '2026-03-08', '10:00', 3,  'active',    'B-08-05', 'JQR 7788', false),
  ('b3',  'PARKING',              '2026-03-07', '18:00', 12, 'completed', 'C-06-03', 'VBK 3344', true),
  ('b4',  'PARKING',              '2026-03-06', '09:00', 2,  'completed', 'A-12-02', 'WNB 1234', false),
  ('b5',  'PARKING',              '2026-03-09', '15:00', 5,  'active',    'B-12-04', 'PKR 9012', false),
  ('b6',  'GYM',                  '2026-03-08', '07:00', 1,  'active',    'A-10-05', NULL, false),
  ('b7',  'GYM',                  '2026-03-07', '17:00', 1,  'completed', 'B-06-02', NULL, false),
  ('b8',  'GYM',                  '2026-03-06', '09:00', 1,  'completed', 'C-10-06', NULL, false),
  ('b9',  'SWIMMING_POOL',        '2026-03-08', '08:00', 2,  'active',    'A-07-04', NULL, false),
  ('b10', 'SWIMMING_POOL',        '2026-03-05', '16:00', 1,  'completed', 'B-07-03', NULL, false),
  ('b11', 'SWIMMING_POOL',        '2026-03-09', '10:00', 2,  'active',    'C-07-02', NULL, false),
  ('b12', 'BBQ',                  '2026-03-08', '18:00', 3,  'active',    'A-08-03', NULL, false),
  ('b13', 'BBQ',                  '2026-03-01', '17:00', 4,  'completed', 'C-12-04', NULL, false),
  ('b14', 'BBQ',                  '2026-03-04', '18:00', 3,  'cancelled', 'B-10-01', NULL, false),
  ('b15', 'PARTY_ROOM',           '2026-03-10', '14:00', 4,  'active',    'A-09-01', NULL, false),
  ('b16', 'PARTY_ROOM',           '2026-02-28', '19:00', 5,  'completed', 'B-09-06', NULL, false),
  ('b17', 'TENNIS',               '2026-03-08', '07:00', 1,  'active',    'C-08-01', NULL, false),
  ('b18', 'TENNIS',               '2026-03-06', '17:00', 2,  'completed', 'A-11-06', NULL, false),
  ('b19', 'TENNIS',               '2026-03-05', '08:00', 1,  'cancelled', 'B-11-02', NULL, false),
  ('b20', 'SQUASH_COURT',         '2026-03-09', '09:00', 1,  'active',    'C-09-05', NULL, false),
  ('b21', 'SQUASH_COURT',         '2026-03-03', '18:00', 1,  'completed', 'A-06-01', NULL, false),
  ('b22', 'BASKETBALL_COURT',     '2026-03-08', '17:00', 2,  'active',    'B-06-02', NULL, false),
  ('b23', 'BASKETBALL_COURT',     '2026-03-02', '16:00', 2,  'completed', 'C-06-03', NULL, false),
  ('b24', 'BASKETBALL_COURT',     '2026-03-07', '09:00', 1,  'cancelled', 'A-07-04', NULL, false),
  ('b25', 'MULTI_PURPOSE_COURT',  '2026-03-09', '08:00', 2,  'active',    'B-08-05', NULL, false),
  ('b26', 'MULTI_PURPOSE_COURT',  '2026-03-04', '19:00', 2,  'completed', 'A-12-02', NULL, false),
  ('b27', 'MULTI_PURPOSE_COURT',  '2026-03-01', '10:00', 2,  'completed', 'C-10-06', NULL, false),
  ('b28', 'MULTI_PURPOSE_COURT',  '2026-03-06', '15:00', 1,  'cancelled', 'B-12-04', NULL, false)
ON CONFLICT (id) DO NOTHING;


-- ── SEED: violations (10) ───────────────────────────────────
INSERT INTO public.violations (id, unit, type, date, status, amount) VALUES
  ('v1',  'B-07-03', 'Late Cancellation',    '2026-03-05', 'pending', 10),
  ('v2',  'A-06-01', 'Overstay Parking',     '2026-02-20', 'paid',    50),
  ('v3',  'C-10-06', 'Noise Complaint',       '2026-03-01', 'pending', 100),
  ('v4',  'A-11-06', 'Unauthorized Parking',  '2026-02-15', 'paid',    50),
  ('v5',  'B-09-06', 'Late Cancellation',     '2026-03-03', 'pending', 10),
  ('v6',  'C-07-02', 'Facility Damage',       '2026-02-10', 'paid',    200),
  ('v7',  'A-08-03', 'Overstay Parking',      '2026-03-06', 'pending', 50),
  ('v8',  'B-12-04', 'No Show Booking',       '2026-02-25', 'paid',    20),
  ('v9',  'C-12-04', 'Noise Complaint',        '2026-03-07', 'pending', 100),
  ('v10', 'A-10-05', 'Unauthorized Parking',   '2026-01-30', 'paid',    50)
ON CONFLICT (id) DO NOTHING;


-- ── SEED: reports (12) ──────────────────────────────────────
INSERT INTO public.reports (id, date, category, description, status, resident_unit) VALUES
  ('r1',  '2026-03-06', 'Gymnasium',     'Treadmill #2 belt is slipping and making loud noises.', 'In Progress', 'A-10-05'),
  ('r2',  '2026-02-28', 'Lifts',         'Lift B button panel in Block A is dirty and unresponsive on floor 8.', 'Resolved', 'A-08-03'),
  ('r3',  '2026-03-07', 'Parking',       'Parking bay P-23 has oil stain that has not been cleaned for a week.', 'Received', 'B-06-02'),
  ('r4',  '2026-03-04', 'Swimming Pool', 'Pool shower head in male changing room is broken.', 'In Progress', 'C-06-03'),
  ('r5',  '2026-03-01', 'Corridor',      'Corridor light on Level 9, Block B is flickering.', 'Resolved', 'B-09-06'),
  ('r6',  '2026-03-05', 'Plumbing',      'Water leaking from ceiling in unit corridor, Level 7 Block A.', 'In Progress', 'A-07-04'),
  ('r7',  '2026-03-08', 'Security',      'CCTV at Block C ground floor lobby seems to be offline.', 'Received', 'C-08-01'),
  ('r8',  '2026-02-25', 'Playground',    'Swing set has a loose bolt, potential safety hazard for children.', 'Resolved', 'B-10-01'),
  ('r9',  '2026-03-03', 'BBQ Area',      'BBQ pit #2 grill grate is rusted and needs replacement.', 'In Progress', 'C-12-04'),
  ('r10', '2026-03-07', 'Lifts',         'Lift A in Block C makes grinding sound between floor 10-12.', 'Received', 'C-10-06'),
  ('r11', '2026-02-20', 'Landscaping',   'Tree near Block B entrance has overgrown branches blocking walkway.', 'Resolved', 'B-12-04'),
  ('r12', '2026-03-06', 'Tennis Court',  'Tennis court net is sagging in the middle, needs tightening.', 'Received', 'A-12-02')
ON CONFLICT (id) DO NOTHING;


-- ── SEED: community_posts (10) ──────────────────────────────
INSERT INTO public.community_posts (id, author_unit, author_name, title, content, date, category, likes, comments) VALUES
  ('p1',  'A-06-01', 'Ahmad Razali',   'Weekend Badminton Group',       'Looking for residents interested in a Saturday morning badminton group at the sport court. All skill levels welcome!', '2026-03-07', 'event', 12, 5),
  ('p2',  'B-08-05', 'Nurul Aisyah',   'Selling IKEA Bookshelf',        'Moving out sale - BILLY bookshelf in white, good condition. RM80 negotiable. Self-collect from Block B.', '2026-03-06', 'marketplace', 3, 2),
  ('p3',  'C-08-01', 'Ng Siew Ling',   'Lost Cat - Orange Tabby',       'Our orange tabby cat "Mochi" escaped from our unit yesterday evening. Please contact us if spotted around the compound.', '2026-03-08', 'lost-found', 18, 7),
  ('p4',  'A-10-05', 'Tan Wei Ming',   'Recommendation for Plumber',    'Can anyone recommend a reliable plumber? Need to fix kitchen sink issue. Thanks in advance!', '2026-03-05', 'general', 5, 8),
  ('p5',  'B-07-03', 'Amirah Hanim',   'Yoga Session at Pool Deck',     'Free yoga session every Sunday 7 AM at the pool deck. Bring your own mat. All are welcome to join!', '2026-03-04', 'event', 22, 6),
  ('p6',  'C-10-06', 'Ganesh Muthu',   'Free Study Table',              'Giving away a study table in decent condition. First come first serve. WhatsApp me to arrange pickup.', '2026-03-03', 'marketplace', 7, 4),
  ('p7',  'A-09-01', 'Kavitha Rajan',  'Found Keys Near Playground',    'Found a set of car keys (Perodua) near the playground area this morning. Please claim at guard house.', '2026-03-07', 'lost-found', 9, 3),
  ('p8',  'B-12-04', 'Lim Chee Keong', 'Internet Service Provider Survey', 'Thinking of switching ISP. Which provider has the best coverage in our area? Currently using Unifi.', '2026-03-02', 'general', 14, 11),
  ('p9',  'C-07-02', 'Ong Jia Yi',     'Hari Raya Open House',          'All neighbours are invited to our Hari Raya open house on April 1st from 10 AM. Food and drinks provided!', '2026-03-01', 'event', 30, 9),
  ('p10', 'A-11-06', 'Muhammad Faiz',  'Noise After 10 PM',             'Friendly reminder to keep noise levels down after 10 PM especially on weekdays. Some of us have early shifts. Thank you for understanding.', '2026-02-28', 'general', 25, 13)
ON CONFLICT (id) DO NOTHING;


-- ── VERIFY ──────────────────────────────────────────────────
SELECT 'announcements'   AS tbl, COUNT(*) AS rows FROM public.announcements
UNION ALL
SELECT 'bookings',        COUNT(*) FROM public.bookings
UNION ALL
SELECT 'violations',      COUNT(*) FROM public.violations
UNION ALL
SELECT 'reports',         COUNT(*) FROM public.reports
UNION ALL
SELECT 'community_posts', COUNT(*) FROM public.community_posts
ORDER BY tbl;
