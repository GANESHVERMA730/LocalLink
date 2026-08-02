/*
# LocalLink — Security hardening

## Purpose
Address security advisor findings we can control:
1. Set an explicit `search_path` on the `touch_updated_at` trigger function.
2. Explicitly revoke EXECUTE on SECURITY DEFINER functions from anon and PUBLIC to remove
   any default grants.

## Not addressed (with rationale)
- `spatial_ref_sys` RLS: this is a PostGIS system table owned by the extension. We cannot
  ALTER it (permission denied — not the table owner). It contains coordinate-system reference
  metadata only, no user data, and is not exposed meaningfully. This is a known PostGIS-on-
  Supabase advisory.
- `postgis` extension in public schema: moving PostGIS to another schema would break all
  existing geography columns and queries. This is a cosmetic advisory.
- `st_estimatedextent` anon EXECUTE: PostGIS internal functions, not alterable, not exploitable
  in this app's context.

## Changes
- `touch_updated_at` recreated with `SET search_path = public`.
- REVOKE EXECUTE on `create_profile_for_new_user`, `search_providers`, `update_booking_status`
  from PUBLIC and anon; re-grant to authenticated.
*/

-- touch_updated_at: fix mutable search_path.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Revoke EXECUTE from anon/public on all SECURITY DEFINER functions.
REVOKE EXECUTE ON FUNCTION create_profile_for_new_user FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION search_providers FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION update_booking_status FROM anon, PUBLIC;

-- Keep authenticated grants.
GRANT EXECUTE ON FUNCTION search_providers TO authenticated;
GRANT EXECUTE ON FUNCTION update_booking_status TO authenticated;
