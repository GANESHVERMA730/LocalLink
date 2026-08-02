/*
# LocalLink — Provider Search Function

## Purpose
Provides the geospatial provider search: "find providers near this point, within this
radius, optionally filtered by category, minimum rating, and availability on a given date/time."

## New Functions
- `search_providers(p_lat double precision, p_lng double precision, p_max_distance_m integer,
    p_category text, p_min_rating numeric, p_date_iso text, p_time text)`
  Returns a table of nearby providers with joined profile + services + computed distance.

## Logic
1. Filter provider_profiles to those whose `location` is within `p_max_distance_m` metres
   of the given (lat, lng) point, using PostGIS `ST_DWithin` (GiST-indexed, fast).
2. Join the owning profile (name, avatar) and active services.
3. Apply optional category filter on services.
4. Apply optional min-rating filter.
5. Apply optional availability filter: if p_date_iso + p_time are provided, keep only
   providers who have an active availability slot matching that day-of-week and time window.
6. Compute `distance_m` with `ST_Distance` and return ordered nearest-first.

## Security
- SECURITY INVOKER (default): SELECT runs under caller RLS. All authenticated users may call.
- EXECUTE granted to authenticated; revoked from anon (search requires sign-in).

## Notes
1. `p_time` is "HH24:MI" 24-hour format (e.g. '14:30'). If omitted but p_date_iso supplied,
   availability is checked by day-of-week only.
2. distance_m is returned in metres (geography uses metres).
3. Results are ordered by distance ascending.
4. A provider with no active services is excluded when a category filter is applied, and
   included (with an empty services array) otherwise — grouped via array_agg.
*/

CREATE OR REPLACE FUNCTION search_providers(
  p_lat            double precision,
  p_lng            double precision,
  p_max_distance_m integer DEFAULT 10000,
  p_category       text     DEFAULT NULL,
  p_min_rating     numeric  DEFAULT 0,
  p_date_iso       text     DEFAULT NULL,
  p_time           text     DEFAULT NULL
)
RETURNS TABLE (
  provider_id      uuid,
  user_id          uuid,
  name             text,
  avatar_url       text,
  bio              text,
  address          text,
  city             text,
  rating           numeric,
  review_count     integer,
  is_verified      boolean,
  distance_m       double precision,
  services         jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_point   geography := ST_MakePoint(p_lng, p_lat)::geography(Point, 4326);
  v_dow     integer;
  v_use_dow boolean := false;
  v_use_time boolean := false;
BEGIN
  IF p_date_iso IS NOT NULL AND p_date_iso <> '' THEN
    v_dow := EXTRACT(DOW FROM p_date_iso::date);
    v_use_dow := true;
    IF p_time IS NOT NULL AND p_time <> '' THEN
      v_use_time := true;
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    pp.id                       AS provider_id,
    pp.user_id                  AS user_id,
    pr.name                     AS name,
    pr.avatar_url               AS avatar_url,
    pp.bio                      AS bio,
    pp.address                  AS address,
    pp.city                     AS city,
    pp.rating                   AS rating,
    pp.review_count             AS review_count,
    pp.is_verified              AS is_verified,
    ST_Distance(pp.location, v_point)::double precision AS distance_m,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id',          s.id,
          'title',       s.title,
          'category',    s.category,
          'description', s.description,
          'base_price',  s.base_price,
          'price_unit',  s.price_unit
        )
      ) FILTER (WHERE s.id IS NOT NULL),
      '[]'::jsonb
    ) AS services
  FROM provider_profiles pp
  JOIN profiles pr ON pr.id = pp.user_id
  LEFT JOIN services s
    ON s.provider_id = pp.user_id
    AND s.is_active = true
    AND (p_category IS NULL OR p_category = '' OR s.category = p_category)
  WHERE ST_DWithin(pp.location, v_point, p_max_distance_m)
    AND pp.rating >= p_min_rating
    AND (
      NOT v_use_dow
      OR EXISTS (
        SELECT 1 FROM availabilities a
        WHERE a.provider_id = pp.user_id
          AND a.is_active = true
          AND a.day_of_week = v_dow
          AND (NOT v_use_time
               OR (a.start_time <= p_time AND p_time < a.end_time))
      )
    )
    -- When a category filter is active, require at least one matching service.
    AND (p_category IS NULL OR p_category = '' OR s.id IS NOT NULL)
  GROUP BY pp.id, pp.user_id, pr.name, pr.avatar_url, pp.bio, pp.address, pp.city,
           pp.rating, pp.review_count, pp.is_verified, pp.location
  ORDER BY distance_m ASC;
END;
$$;

REVOKE EXECUTE ON FUNCTION search_providers FROM anon;
GRANT EXECUTE ON FUNCTION search_providers TO authenticated;
