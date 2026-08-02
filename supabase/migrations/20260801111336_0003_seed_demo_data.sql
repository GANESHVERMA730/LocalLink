/*
# LocalLink — Seed Demo Data

## Purpose
Populate the database with demo providers (with real coordinates, services, and weekly
availability) and one demo customer, so the app is immediately explorable without manual
setup. All demo users share the password "demo123456".

## What it creates
1. Three provider auth users + profiles (role=provider) + provider_profiles with GeoJSON
   locations in the New York City area + services across different categories + weekly
   availability (Mon–Fri 9–17 plus some evening/weekend slots).
2. One customer auth user + profile (role=customer).

## Demo credentials (all password: demo123456)
- plumber@local.link     — "Mario Rossi" (plumber, Brooklyn)
- electric@local.link    — "Sarah Chen" (electrician, Manhattan)
- tutor@local.link       — "James Okafor" (tutor, Queens)
- customer@local.link    — "Alex Johnson" (customer)

## Notes
1. Uses auth.users insert with bcrypt-hashed passwords via crypt() + gen_salt('bf').
2. The on_auth_user_created trigger automatically creates the matching profiles row with
   the role from user metadata — so we do NOT insert into profiles directly.
3. Coordinates are real NYC-area lat/lng so geospatial search works.
4. Safe to re-run: checks for existing users/profiles/services before inserting.
*/

-- ─────────────────────────────────────────────────────────────
-- Provider 1: Mario Rossi (Plumber, Brooklyn)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user_id uuid;
  v_pp_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'plumber@local.link';
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'plumber@local.link',
      crypt('demo123456', gen_salt('bf')),
      now(),
      jsonb_build_object('name', 'Mario Rossi', 'role', 'provider', 'phone', '+1 555 010 1111'),
      now(), now()
    )
    RETURNING id INTO v_user_id;
  END IF;

  -- Ensure profile role is provider (in case trigger defaulted it).
  UPDATE profiles SET role = 'provider', name = 'Mario Rossi', phone = '+1 555 010 1111' WHERE id = v_user_id;

  -- Provider profile with Brooklyn coordinates.
  INSERT INTO provider_profiles (user_id, bio, address, city, location, rating, review_count, is_verified)
  VALUES (
    v_user_id,
    'Licensed master plumber with 15+ years of experience. Specializing in emergency repairs, pipe replacement, and bathroom renovations. Fully insured and available 24/7 for emergencies.',
    '456 Atlantic Ave',
    'Brooklyn, NY',
    ST_MakePoint(-73.9903, 40.6834)::geography(Point, 4326),
    4.8, 27, true
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_pp_id;

  IF v_pp_id IS NULL THEN
    SELECT id INTO v_pp_id FROM provider_profiles WHERE user_id = v_user_id;
  END IF;

  -- Services.
  INSERT INTO services (provider_id, title, category, description, base_price, price_unit, is_active)
  VALUES
    (v_user_id, 'Emergency plumbing repair', 'plumber', 'Burst pipe, leak, or backup? I will arrive within the hour and fix the issue fast.', 120, 'per visit', true),
    (v_user_id, 'Drain cleaning & unclogging', 'plumber', 'Professional drain snaking and hydro-jetting for kitchens, bathrooms, and main lines.', 90, 'per visit', true),
    (v_user_id, 'Bathroom fixture installation', 'plumber', 'Toilet, sink, faucet, or shower installation with all parts included.', 75, 'per hour', true)
  ON CONFLICT DO NOTHING;

  -- Weekly availability: Mon–Fri 8–18, Sat 9–14.
  INSERT INTO availabilities (provider_id, day_of_week, start_time, end_time, is_active)
  VALUES
    (v_user_id, 1, '08:00', '18:00', true),
    (v_user_id, 2, '08:00', '18:00', true),
    (v_user_id, 3, '08:00', '18:00', true),
    (v_user_id, 4, '08:00', '18:00', true),
    (v_user_id, 5, '08:00', '18:00', true),
    (v_user_id, 6, '09:00', '14:00', true)
  ON CONFLICT DO NOTHING;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Provider 2: Sarah Chen (Electrician, Manhattan)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user_id uuid;
  v_pp_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'electric@local.link';
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'electric@local.link',
      crypt('demo123456', gen_salt('bf')),
      now(),
      jsonb_build_object('name', 'Sarah Chen', 'role', 'provider', 'phone', '+1 555 020 2222'),
      now(), now()
    )
    RETURNING id INTO v_user_id;
  END IF;

  UPDATE profiles SET role = 'provider', name = 'Sarah Chen', phone = '+1 555 020 2222' WHERE id = v_user_id;

  INSERT INTO provider_profiles (user_id, bio, address, city, location, rating, review_count, is_verified)
  VALUES (
    v_user_id,
    'Licensed electrician serving Manhattan and Brooklyn. Residential and commercial wiring, panel upgrades, lighting installation, and safety inspections. NEC certified.',
    '789 Broadway, Suite 200',
    'New York, NY',
    ST_MakePoint(-73.9916, 40.7233)::geography(Point, 4326),
    4.9, 41, true
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_pp_id;

  IF v_pp_id IS NULL THEN
    SELECT id INTO v_pp_id FROM provider_profiles WHERE user_id = v_user_id;
  END IF;

  INSERT INTO services (provider_id, title, category, description, base_price, price_unit, is_active)
  VALUES
    (v_user_id, 'Electrical panel inspection', 'electrician', 'Comprehensive panel inspection with safety report. Identify hazards before they become problems.', 150, 'per visit', true),
    (v_user_id, 'Lighting installation', 'electrician', 'Recessed lights, chandeliers, ceiling fans, and smart lighting setup.', 85, 'per hour', true),
    (v_user_id, 'Outlet & switch repair', 'electrician', 'Replace faulty outlets, install GFCI in kitchens and baths, add new circuits.', 70, 'per visit', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO availabilities (provider_id, day_of_week, start_time, end_time, is_active)
  VALUES
    (v_user_id, 1, '09:00', '17:00', true),
    (v_user_id, 2, '09:00', '17:00', true),
    (v_user_id, 3, '09:00', '17:00', true),
    (v_user_id, 4, '09:00', '17:00', true),
    (v_user_id, 5, '09:00', '17:00', true)
  ON CONFLICT DO NOTHING;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Provider 3: James Okafor (Tutor, Queens)
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user_id uuid;
  v_pp_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'tutor@local.link';
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'tutor@local.link',
      crypt('demo123456', gen_salt('bf')),
      now(),
      jsonb_build_object('name', 'James Okafor', 'role', 'provider', 'phone', '+1 555 030 3333'),
      now(), now()
    )
    RETURNING id INTO v_user_id;
  END IF;

  UPDATE profiles SET role = 'provider', name = 'James Okafor', phone = '+1 555 030 3333' WHERE id = v_user_id;

  INSERT INTO provider_profiles (user_id, bio, address, city, location, rating, review_count, is_verified)
  VALUES (
    v_user_id,
    'Former high school math teacher with a masters in education. SAT/ACT prep, algebra through calculus, and physics tutoring. In-person or online sessions.',
    '120 Astoria Blvd',
    'Queens, NY',
    ST_MakePoint(-73.9293, 40.7699)::geography(Point, 4326),
    4.7, 18, false
  )
  ON CONFLICT (user_id) DO NOTHING
  RETURNING id INTO v_pp_id;

  IF v_pp_id IS NULL THEN
    SELECT id INTO v_pp_id FROM provider_profiles WHERE user_id = v_user_id;
  END IF;

  INSERT INTO services (provider_id, title, category, description, base_price, price_unit, is_active)
  VALUES
    (v_user_id, 'SAT/ACT math prep', 'tutor', 'One-on-one test prep with proven strategies and practice tests. Average score improvement: 180 points.', 60, 'per hour', true),
    (v_user_id, 'Algebra & calculus tutoring', 'tutor', 'Middle school through AP calculus. Patient, concept-first teaching style.', 50, 'per hour', true),
    (v_user_id, 'Physics tutoring', 'tutor', 'AP Physics 1 & 2, honors physics, and intro college physics.', 55, 'per hour', true)
  ON CONFLICT DO NOTHING;

  INSERT INTO availabilities (provider_id, day_of_week, start_time, end_time, is_active)
  VALUES
    (v_user_id, 1, '15:00', '20:00', true),
    (v_user_id, 2, '15:00', '20:00', true),
    (v_user_id, 3, '15:00', '20:00', true),
    (v_user_id, 4, '15:00', '20:00', true),
    (v_user_id, 6, '10:00', '16:00', true)
  ON CONFLICT DO NOTHING;
END $$;

-- ─────────────────────────────────────────────────────────────
-- Customer: Alex Johnson
-- ─────────────────────────────────────────────────────────────
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'customer@local.link';
  IF v_user_id IS NULL THEN
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      'customer@local.link',
      crypt('demo123456', gen_salt('bf')),
      now(),
      jsonb_build_object('name', 'Alex Johnson', 'role', 'customer', 'phone', '+1 555 040 4444'),
      now(), now()
    )
    RETURNING id INTO v_user_id;
  END IF;

  UPDATE profiles SET role = 'customer', name = 'Alex Johnson', phone = '+1 555 040 4444' WHERE id = v_user_id;
END $$;
