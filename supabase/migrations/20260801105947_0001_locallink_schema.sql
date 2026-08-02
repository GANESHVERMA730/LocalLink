/*
# LocalLink — Core Schema

## Purpose
A local services marketplace connecting customers with nearby service providers.
Customers search providers by location/category/availability, send booking requests,
and chat in real time. Providers manage profiles, services, weekly availability, and
respond to booking requests.

## New Tables
1. `profiles` — user metadata (role, name, phone, avatar) linked 1:1 to auth.users.
   - id (uuid, PK, references auth.users), role (customer|provider), name, phone, avatar_url, created_at, updated_at
2. `provider_profiles` — extended profile for role=provider users.
   - id, user_id (FK profiles, unique), bio, location (geography Point, SRID 4326),
     address, city, rating (protected), review_count (protected), is_verified (protected),
     created_at, updated_at
   - GiST index on location for geospatial nearest-neighbour search.
3. `services` — a service offered by a provider.
   - id, provider_id (FK profiles), title, category, description, base_price, price_unit,
     is_active, created_at, updated_at
4. `availabilities` — weekly recurring availability slots for a provider.
   - id, provider_id (FK profiles), day_of_week (0-6), start_time, end_time, is_active,
     created_at, updated_at
   - Unique constraint on (provider_id, day_of_week, start_time, end_time)
5. `bookings` — a booking request from a customer to a provider for a service.
   - id, customer_id (FK profiles), provider_id (FK profiles), service_id (FK services),
     status (pending|accepted|rejected|completed|cancelled, protected — set only via RPC),
     scheduled_at, duration_minutes, customer_notes, provider_notes, created_at, updated_at
6. `messages` — chat messages scoped to a booking.
   - id, booking_id (FK bookings), sender_id (FK profiles), text, created_at

## Security — Row Level Security
- `profiles`: each user reads/updates only their own row; provider rows are publicly
  readable (so customers can view provider profiles). Role column is NOT client-writable.
- `provider_profiles`: public read (for search); only the owning provider can insert/update
  their own. rating, review_count, is_verified columns are revoked from direct update.
- `services`: public read of active services; provider owns create/update/delete on theirs.
- `availabilities`: public read (search filtering + provider page); provider owns CRUD.
- `bookings`: both customer and provider on a booking can read it; only the customer can
  insert; status transitions go through a SECURITY DEFINER RPC (column revoked).
- `messages`: participants of a booking can read and send; text is the only writable field.

## Security — Column-Level Privileges (protected columns)
- profiles.role — never client-writable (set only at signup via RPC).
- provider_profiles.rating, review_count, is_verified — never client-writable.
- bookings.status — never client-writable directly (transitions via update_booking_status RPC).

## Security — SECURITY DEFINER Functions
- `create_profile_for_new_user` — trigger on auth.users insert: creates the profile row
  with the role from user metadata. Keeps role assignment server-side.
- `update_booking_status` — the only path to change booking.status. Verifies the caller is
  part of the booking, enforces the allowed state-machine transition, emits the new booking.

## Realtime
- bookings and messages are added to the supabase_realtime publication so the frontend can
  subscribe to live chat and booking-status updates.

## Notes
1. PostGIS extension enabled for geography type + GiST nearest-neighbour search.
2. `profiles.id` is the same uuid as `auth.users.id` (no separate PK) so auth.uid() maps
   directly to ownership checks.
3. Owner columns default to auth.uid() so client inserts that omit the owner still satisfy
   the INSERT policy WITH CHECK.
*/

-- ─────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS postgis;

-- ─────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'customer' CHECK (role IN ('customer','provider')),
  name        text NOT NULL DEFAULT '',
  phone       text DEFAULT '',
  avatar_url  text DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can read provider profiles (customers browse them); users read their own.
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR role = 'provider');

-- A user may update only their own non-protected columns.
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Inserts are handled server-side via the new-user trigger; no direct client INSERT.
-- (The trigger runs as SECURITY DEFINER, bypassing RLS.)

-- Column-level: role must never be set via the data API.
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (name, phone, avatar_url) ON profiles TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- provider_profiles
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS provider_profiles (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  bio          text DEFAULT '',
  location     geography(Point, 4326),
  address      text DEFAULT '',
  city         text DEFAULT '',
  rating       numeric(2,1) NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  is_verified  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- Nearest-neighbour geospatial index.
CREATE INDEX IF NOT EXISTS provider_profiles_location_gix
  ON provider_profiles USING GIST (location);

ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;

-- Public read so customers can search and view providers.
DROP POLICY IF EXISTS "provider_profiles_select" ON provider_profiles;
CREATE POLICY "provider_profiles_select" ON provider_profiles FOR SELECT
  TO authenticated USING (true);

-- Only the owning provider can insert their own profile.
DROP POLICY IF EXISTS "provider_profiles_insert_own" ON provider_profiles;
CREATE POLICY "provider_profiles_insert_own" ON provider_profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Only the owning provider can update their own profile.
DROP POLICY IF EXISTS "provider_profiles_update_own" ON provider_profiles;
CREATE POLICY "provider_profiles_update_own" ON provider_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Protected columns: rating, review_count, is_verified never client-writable.
REVOKE UPDATE ON provider_profiles FROM authenticated;
GRANT UPDATE (bio, location, address, city) ON provider_profiles TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- services
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  category    text NOT NULL,
  description text DEFAULT '',
  base_price  numeric(10,2) DEFAULT 0,
  price_unit  text DEFAULT 'per visit',
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS services_provider_id_idx ON services(provider_id);
CREATE INDEX IF NOT EXISTS services_category_idx ON services(category);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- Public read (search + provider pages).
DROP POLICY IF EXISTS "services_select" ON services;
CREATE POLICY "services_select" ON services FOR SELECT
  TO authenticated USING (true);

-- Provider creates their own services.
DROP POLICY IF EXISTS "services_insert_own" ON services;
CREATE POLICY "services_insert_own" ON services FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = provider_id);

-- Provider updates their own services.
DROP POLICY IF EXISTS "services_update_own" ON services;
CREATE POLICY "services_update_own" ON services FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

-- Provider deletes their own services.
DROP POLICY IF EXISTS "services_delete_own" ON services;
CREATE POLICY "services_delete_own" ON services FOR DELETE
  TO authenticated USING (auth.uid() = provider_id);

-- ─────────────────────────────────────────────────────────────────
-- availabilities
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availabilities (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time  text NOT NULL,
  end_time    text NOT NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS availabilities_provider_id_idx ON availabilities(provider_id);
CREATE INDEX IF NOT EXISTS availabilities_day_idx ON availabilities(day_of_week);
-- One slot per provider/day/window to prevent duplicate entries.
CREATE UNIQUE INDEX IF NOT EXISTS availabilities_provider_day_time_uq
  ON availabilities (provider_id, day_of_week, start_time, end_time);

ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "availabilities_select" ON availabilities;
CREATE POLICY "availabilities_select" ON availabilities FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "availabilities_insert_own" ON availabilities;
CREATE POLICY "availabilities_insert_own" ON availabilities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "availabilities_update_own" ON availabilities;
CREATE POLICY "availabilities_update_own" ON availabilities FOR UPDATE
  TO authenticated
  USING (auth.uid() = provider_id)
  WITH CHECK (auth.uid() = provider_id);

DROP POLICY IF EXISTS "availabilities_delete_own" ON availabilities;
CREATE POLICY "availabilities_delete_own" ON availabilities FOR DELETE
  TO authenticated USING (auth.uid() = provider_id);

-- ─────────────────────────────────────────────────────────────────
-- bookings
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  service_id      uuid NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  status          text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','accepted','rejected','completed','cancelled')),
  scheduled_at    timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60 CHECK (duration_minutes > 0),
  customer_notes  text DEFAULT '',
  provider_notes  text DEFAULT '',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS bookings_customer_id_idx ON bookings(customer_id);
CREATE INDEX IF NOT EXISTS bookings_provider_id_idx ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS bookings_status_idx ON bookings(status);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Both customer and provider on a booking can read it.
DROP POLICY IF EXISTS "bookings_select" ON bookings;
CREATE POLICY "bookings_select" ON bookings FOR SELECT
  TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- Only a customer can create a booking (as the customer).
DROP POLICY IF EXISTS "bookings_insert" ON bookings;
CREATE POLICY "bookings_insert" ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = customer_id);

-- Updates: notes fields are editable by participants; status is RPC-only.
DROP POLICY IF EXISTS "bookings_update" ON bookings;
CREATE POLICY "bookings_update" ON bookings FOR UPDATE
  TO authenticated
  USING (auth.uid() = customer_id OR auth.uid() = provider_id)
  WITH CHECK (auth.uid() = customer_id OR auth.uid() = provider_id);

-- Column-level: customer_id, provider_id, service_id, status, timestamps not writable.
REVOKE UPDATE ON bookings FROM authenticated;
GRANT UPDATE (customer_notes, provider_notes) ON bookings TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- messages
-- ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id  uuid NOT NULL DEFAULT auth.uid() REFERENCES profiles(id) ON DELETE CASCADE,
  text       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_booking_id_idx ON messages(booking_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Participants of a booking can read its messages.
DROP POLICY IF EXISTS "messages_select" ON messages;
CREATE POLICY "messages_select" ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = messages.booking_id
        AND (b.customer_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- A participant can send a message in a booking they belong to.
DROP POLICY IF EXISTS "messages_insert" ON messages;
CREATE POLICY "messages_insert" ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.id = messages.booking_id
        AND (b.customer_id = auth.uid() OR b.provider_id = auth.uid())
    )
  );

-- Messages are immutable once sent.
-- (No UPDATE or DELETE policies.)

-- ─────────────────────────────────────────────────────────────────
-- updated_at triggers
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_touch ON profiles;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS provider_profiles_touch ON provider_profiles;
CREATE TRIGGER provider_profiles_touch BEFORE UPDATE ON provider_profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS services_touch ON services;
CREATE TRIGGER services_touch BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS availabilities_touch ON availabilities;
CREATE TRIGGER availabilities_touch BEFORE UPDATE ON availabilities
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

DROP TRIGGER IF EXISTS bookings_touch ON bookings;
CREATE TRIGGER bookings_touch BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ─────────────────────────────────────────────────────────────────
-- New-user trigger: create profile row from signup metadata.
-- The role is stored in raw_user_meta_data at signup and copied here so it
-- can never be set directly through the data API.
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION create_profile_for_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_role text;
  v_name text;
BEGIN
  v_role := COALESCE(new.raw_user_meta_data->>'role', 'customer');
  IF v_role NOT IN ('customer','provider') THEN
    v_role := 'customer';
  END IF;
  v_name := COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  INSERT INTO profiles (id, role, name)
  VALUES (new.id, v_role, v_name);

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_profile_for_new_user();

-- ─────────────────────────────────────────────────────────────────
-- Booking status state machine (SECURITY DEFINER).
-- The ONLY path to change bookings.status. Validates caller membership and
-- enforces allowed transitions.
--   provider:  pending -> accepted | rejected
--   either:    accepted -> completed | cancelled
--   customer:  pending -> cancelled
-- ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_booking_status(p_booking_id uuid, p_new_status text)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_booking bookings%ROWTYPE;
  v_caller  uuid := auth.uid();
  v_role    text;
BEGIN
  IF p_new_status NOT IN ('pending','accepted','rejected','completed','cancelled') THEN
    RAISE EXCEPTION 'Invalid status';
  END IF;

  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  SELECT role INTO v_role FROM profiles WHERE id = v_caller;

  -- Caller must be a participant.
  IF v_caller IS DISTINCT FROM v_booking.customer_id
     AND v_caller IS DISTINCT FROM v_booking.provider_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Allowed transitions.
  IF v_caller = v_booking.provider_id AND v_role = 'provider' THEN
    IF NOT ( (v_booking.status = 'pending' AND p_new_status IN ('accepted','rejected'))
          OR (v_booking.status = 'accepted' AND p_new_status IN ('completed','cancelled')) ) THEN
      RAISE EXCEPTION 'Provider cannot transition % to %', v_booking.status, p_new_status;
    END IF;
  ELSIF v_caller = v_booking.customer_id THEN
    IF NOT ( (v_booking.status = 'pending' AND p_new_status = 'cancelled')
          OR (v_booking.status = 'accepted' AND p_new_status = 'cancelled') ) THEN
      RAISE EXCEPTION 'Customer cannot transition % to %', v_booking.status, p_new_status;
    END IF;
  ELSE
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE bookings
    SET status = p_new_status, updated_at = now()
    WHERE id = p_booking_id
    RETURNING * INTO v_booking;

  RETURN v_booking;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_booking_status FROM anon;
GRANT EXECUTE ON FUNCTION update_booking_status TO authenticated;

-- ─────────────────────────────────────────────────────────────────
-- Realtime publication
-- ─────────────────────────────────────────────────────────────────
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE provider_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE services;
ALTER PUBLICATION supabase_realtime ADD TABLE availabilities;
