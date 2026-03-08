-- ============================================================
-- Nadayu28 - Create 20 Auth Users + Update Profiles
-- Run AFTER supabase_seed.sql
-- Supabase Dashboard > SQL Editor > New Query
-- ============================================================
-- Default password for all users: Nadayu28!
-- Users can reset their password after first login.
-- ============================================================


-- ── STEP 1: Create 20 auth users ────────────────────────────
-- The handle_new_user trigger auto-creates profiles

-- Block A - Residents (4)
INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'ahmad.razali@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Ahmad Razali","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'siti.nur@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Siti Nurhaliza","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'weiming.tan@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Tan Wei Ming","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'priya.devi@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Priya Devi","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

-- Block A - Tenants (3)
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'jiaxin.lee@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Lee Jia Xin","role":"TENANT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'faiz.m@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Muhammad Faiz","role":"TENANT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'kavitha.r@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Kavitha Rajan","role":"TENANT"}'::jsonb, NOW(), NOW()),

-- Block B - Residents (4)
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'karwai.wong@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Wong Kar Wai","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'nurul.aisyah@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Nurul Aisyah","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'rajesh.k@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Rajesh Kumar","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'ck.lim@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Lim Chee Keong","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

-- Block B - Tenants (3)
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'amirah.h@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Amirah Hanim","role":"TENANT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'yuhan.chen@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Chen Yu Han","role":"TENANT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'darren.loh@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Darren Loh","role":"TENANT"}'::jsonb, NOW(), NOW()),

-- Block C - Residents (4)
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'hafiz.a@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Hafiz Abdullah","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'siewling.ng@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Ng Siew Ling","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'ganesh.m@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Ganesh Muthu","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'zulaikha.i@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Zulaikha Ismail","role":"RESIDENT"}'::jsonb, NOW(), NOW()),

-- Block C - Tenants (2)
  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'jiayi.ong@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Ong Jia Yi","role":"TENANT"}'::jsonb, NOW(), NOW()),

  ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
   'syafiq.a@email.com', crypt('Nadayu28!', gen_salt('bf')), NOW(),
   '{"full_name":"Syafiq Azman","role":"TENANT"}'::jsonb, NOW(), NOW());


-- ── STEP 2: Update profiles with unit + phone ───────────────
-- The trigger created profiles with full_name + role only,
-- now we add unit and phone info.

UPDATE public.profiles SET unit = 'A-06-01', phone = '012-3456789' WHERE id = (SELECT id FROM auth.users WHERE email = 'ahmad.razali@email.com');
UPDATE public.profiles SET unit = 'A-08-03', phone = '013-2345678' WHERE id = (SELECT id FROM auth.users WHERE email = 'siti.nur@email.com');
UPDATE public.profiles SET unit = 'A-10-05', phone = '016-7890123' WHERE id = (SELECT id FROM auth.users WHERE email = 'weiming.tan@email.com');
UPDATE public.profiles SET unit = 'A-12-02', phone = '017-8901234' WHERE id = (SELECT id FROM auth.users WHERE email = 'priya.devi@email.com');
UPDATE public.profiles SET unit = 'A-07-04', phone = '018-9012345' WHERE id = (SELECT id FROM auth.users WHERE email = 'jiaxin.lee@email.com');
UPDATE public.profiles SET unit = 'A-11-06', phone = '019-0123456' WHERE id = (SELECT id FROM auth.users WHERE email = 'faiz.m@email.com');
UPDATE public.profiles SET unit = 'A-09-01', phone = '012-1112233' WHERE id = (SELECT id FROM auth.users WHERE email = 'kavitha.r@email.com');

UPDATE public.profiles SET unit = 'B-06-02', phone = '013-3344556' WHERE id = (SELECT id FROM auth.users WHERE email = 'karwai.wong@email.com');
UPDATE public.profiles SET unit = 'B-08-05', phone = '016-4455667' WHERE id = (SELECT id FROM auth.users WHERE email = 'nurul.aisyah@email.com');
UPDATE public.profiles SET unit = 'B-10-01', phone = '017-5566778' WHERE id = (SELECT id FROM auth.users WHERE email = 'rajesh.k@email.com');
UPDATE public.profiles SET unit = 'B-12-04', phone = '018-6677889' WHERE id = (SELECT id FROM auth.users WHERE email = 'ck.lim@email.com');
UPDATE public.profiles SET unit = 'B-07-03', phone = '019-7788990' WHERE id = (SELECT id FROM auth.users WHERE email = 'amirah.h@email.com');
UPDATE public.profiles SET unit = 'B-09-06', phone = '012-8899001' WHERE id = (SELECT id FROM auth.users WHERE email = 'yuhan.chen@email.com');
UPDATE public.profiles SET unit = 'B-11-02', phone = '013-9900112' WHERE id = (SELECT id FROM auth.users WHERE email = 'darren.loh@email.com');

UPDATE public.profiles SET unit = 'C-06-03', phone = '016-1122334' WHERE id = (SELECT id FROM auth.users WHERE email = 'hafiz.a@email.com');
UPDATE public.profiles SET unit = 'C-08-01', phone = '017-2233445' WHERE id = (SELECT id FROM auth.users WHERE email = 'siewling.ng@email.com');
UPDATE public.profiles SET unit = 'C-10-06', phone = '018-3344556' WHERE id = (SELECT id FROM auth.users WHERE email = 'ganesh.m@email.com');
UPDATE public.profiles SET unit = 'C-12-04', phone = '019-4455667' WHERE id = (SELECT id FROM auth.users WHERE email = 'zulaikha.i@email.com');
UPDATE public.profiles SET unit = 'C-07-02', phone = '012-5566778' WHERE id = (SELECT id FROM auth.users WHERE email = 'jiayi.ong@email.com');
UPDATE public.profiles SET unit = 'C-09-05', phone = '013-6677889' WHERE id = (SELECT id FROM auth.users WHERE email = 'syafiq.a@email.com');


-- ── STEP 3: Link bookings to user_ids ───────────────────────
UPDATE public.bookings SET user_id = p.id FROM public.profiles p WHERE bookings.resident_unit = p.unit AND bookings.user_id IS NULL;

-- ── STEP 4: Link reports to user_ids ────────────────────────
UPDATE public.reports SET user_id = p.id FROM public.profiles p WHERE reports.resident_unit = p.unit AND reports.user_id IS NULL;

-- ── STEP 5: Link community_posts to user_ids ────────────────
UPDATE public.community_posts SET user_id = p.id FROM public.profiles p WHERE community_posts.author_unit = p.unit AND community_posts.user_id IS NULL;

-- ── STEP 6: Insert vehicles linked to users ─────────────────
INSERT INTO public.vehicles (user_id, plate, make, model, is_default) VALUES
  -- Block A
  ((SELECT id FROM auth.users WHERE email = 'ahmad.razali@email.com'),  'WNB 1234', 'Honda',    'City',     true),
  ((SELECT id FROM auth.users WHERE email = 'ahmad.razali@email.com'),  'VAB 8888', 'Toyota',   'Veloz',    false),
  ((SELECT id FROM auth.users WHERE email = 'siti.nur@email.com'),      'BPC 5678', 'Perodua',  'Myvi',     true),
  ((SELECT id FROM auth.users WHERE email = 'weiming.tan@email.com'),   'WCD 5521', 'Proton',   'X50',      true),
  ((SELECT id FROM auth.users WHERE email = 'priya.devi@email.com'),    'JMR 9900', 'Honda',    'HR-V',     true),
  ((SELECT id FROM auth.users WHERE email = 'jiaxin.lee@email.com'),    'WA 3456 T','Perodua',  'Ativa',    true),
  ((SELECT id FROM auth.users WHERE email = 'faiz.m@email.com'),        'VDN 7712', 'Toyota',   'Vios',     true),
  ((SELECT id FROM auth.users WHERE email = 'faiz.m@email.com'),        'BKJ 2201', 'Mazda',    'CX-5',     false),
  ((SELECT id FROM auth.users WHERE email = 'kavitha.r@email.com'),     'WHN 4433', 'Proton',   'Saga',     true),
  -- Block B
  ((SELECT id FROM auth.users WHERE email = 'karwai.wong@email.com'),   'WKD 6677', 'Perodua',  'Axia',     true),
  ((SELECT id FROM auth.users WHERE email = 'nurul.aisyah@email.com'),  'JQR 7788', 'Honda',    'Civic',    true),
  ((SELECT id FROM auth.users WHERE email = 'rajesh.k@email.com'),      'BNT 1122', 'Toyota',   'Camry',    true),
  ((SELECT id FROM auth.users WHERE email = 'rajesh.k@email.com'),      'WA 9988 S','Proton',   'X70',      false),
  ((SELECT id FROM auth.users WHERE email = 'ck.lim@email.com'),        'PKR 9012', 'Perodua',  'Bezza',    true),
  ((SELECT id FROM auth.users WHERE email = 'amirah.h@email.com'),      'VCH 3344', 'Nissan',   'Almera',   true),
  ((SELECT id FROM auth.users WHERE email = 'yuhan.chen@email.com'),    'WRF 5566', 'Mazda',    '3',        true),
  ((SELECT id FROM auth.users WHERE email = 'yuhan.chen@email.com'),    'BJK 8800', 'Honda',    'City',     false),
  ((SELECT id FROM auth.users WHERE email = 'darren.loh@email.com'),    'WMN 2211', 'Toyota',   'Yaris',    true),
  -- Block C
  ((SELECT id FROM auth.users WHERE email = 'hafiz.a@email.com'),       'VBK 3344', 'Proton',   'Persona',  true),
  ((SELECT id FROM auth.users WHERE email = 'siewling.ng@email.com'),   'WA 7766 R','Perodua',  'Aruz',     true),
  ((SELECT id FROM auth.users WHERE email = 'ganesh.m@email.com'),      'JHS 4455', 'Honda',    'BR-V',     true),
  ((SELECT id FROM auth.users WHERE email = 'ganesh.m@email.com'),      'BGL 9988', 'Toyota',   'Rush',     false),
  ((SELECT id FROM auth.users WHERE email = 'zulaikha.i@email.com'),    'WPN 6600', 'Perodua',  'Myvi',     true),
  ((SELECT id FROM auth.users WHERE email = 'jiayi.ong@email.com'),     'VDR 1177', 'Proton',   'Iriz',     true),
  ((SELECT id FROM auth.users WHERE email = 'syafiq.a@email.com'),      'WKS 8822', 'Mazda',    'CX-3',     true),
  ((SELECT id FROM auth.users WHERE email = 'syafiq.a@email.com'),      'BNR 3399', 'Honda',    'Jazz',     false);


-- ── VERIFY ──────────────────────────────────────────────────
SELECT 'auth_users'  AS tbl, COUNT(*) AS rows FROM auth.users
UNION ALL
SELECT 'profiles',    COUNT(*) FROM public.profiles
UNION ALL
SELECT 'vehicles',    COUNT(*) FROM public.vehicles
UNION ALL
SELECT 'bookings_linked', COUNT(*) FROM public.bookings WHERE user_id IS NOT NULL
UNION ALL
SELECT 'reports_linked',  COUNT(*) FROM public.reports WHERE user_id IS NOT NULL
UNION ALL
SELECT 'posts_linked',    COUNT(*) FROM public.community_posts WHERE user_id IS NOT NULL
ORDER BY tbl;
