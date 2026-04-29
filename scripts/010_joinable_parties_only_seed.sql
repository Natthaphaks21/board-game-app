-- 010_joinable_parties_only_seed.sql
-- Joinable-only party seed (resilient version).
-- Works even when demo users 900x do not exist.
-- Safe to run multiple times.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    RAISE EXCEPTION 'Table public.users not found.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'parties'
  ) THEN
    RAISE EXCEPTION 'Table public.parties not found.';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'party_joins'
  ) THEN
    RAISE EXCEPTION 'Table public.party_joins not found.';
  END IF;

  IF (SELECT COUNT(*) FROM public.users) = 0 THEN
    RAISE EXCEPTION 'No users found. Create at least one user before running this seed.';
  END IF;
END $$;

-- Pick available users from your current DB (no hard dependency on 900x users).
WITH picked AS (
  SELECT
    (SELECT uid FROM public.users ORDER BY created_at, uid LIMIT 1) AS u1,
    (SELECT uid FROM public.users ORDER BY created_at, uid OFFSET 1 LIMIT 1) AS u2,
    (SELECT uid FROM public.users ORDER BY created_at, uid OFFSET 2 LIMIT 1) AS u3,
    (SELECT uid FROM public.users ORDER BY created_at, uid OFFSET 3 LIMIT 1) AS u4,
    (SELECT uid FROM public.users ORDER BY created_at, uid OFFSET 4 LIMIT 1) AS u5
),
resolved AS (
  SELECT
    COALESCE(u1, u2, u3, u4, u5) AS h1,
    COALESCE(u2, u1, u3, u4, u5) AS h2,
    COALESCE(u3, u1, u2, u4, u5) AS h3,
    COALESCE(u4, u1, u2, u3, u5) AS p1,
    COALESCE(u5, u1, u2, u3, u4) AS p2
  FROM picked
)
INSERT INTO public.parties (
  pid,
  party_name,
  location_data,
  host_id,
  appointment_time,
  created_at
)
SELECT
  seed.pid,
  seed.party_name,
  seed.location_data,
  seed.host_id,
  seed.appointment_time,
  seed.created_at
FROM resolved r
CROSS JOIN LATERAL (
  VALUES
    (
      9161::BIGINT,
      'Ari Casual Game Night'::VARCHAR,
      jsonb_build_object(
        'displayName', 'Ari Board Game Cafe',
        'formattedAddress', 'Ari, Bangkok',
        'venueType', 'cafe',
        'description', 'Casual table for quick and friendly rounds.',
        'tags', jsonb_build_array('Casual', 'Beginner Friendly'),
        'selectedGames', jsonb_build_array('Codenames', 'Sushi Go!'),
        'maxPlayers', 8,
        'isManuallyEntered', true
      ),
      r.h1::BIGINT,
      NOW() + INTERVAL '1 day',
      NOW() - INTERVAL '2 hours'
    ),
    (
      9162::BIGINT,
      'Strategy Thursday'::VARCHAR,
      jsonb_build_object(
        'displayName', 'Rama 9 Strategy Hub',
        'formattedAddress', 'Rama 9, Bangkok',
        'venueType', 'cafe',
        'description', 'Medium-heavy strategy table.',
        'tags', jsonb_build_array('Strategy'),
        'selectedGames', jsonb_build_array('Catan', 'Ticket to Ride'),
        'maxPlayers', 6,
        'isManuallyEntered', true
      ),
      r.h2::BIGINT,
      NOW() + INTERVAL '2 days',
      NOW() - INTERVAL '3 hours'
    ),
    (
      9163::BIGINT,
      'After Work Fast Games'::VARCHAR,
      jsonb_build_object(
        'displayName', 'Silom Community Room',
        'formattedAddress', 'Silom, Bangkok',
        'venueType', 'community',
        'description', 'Short games under 45 minutes.',
        'tags', jsonb_build_array('Quick Rounds', 'Party'),
        'selectedGames', jsonb_build_array('Love Letter', 'Insider'),
        'maxPlayers', 7,
        'isManuallyEntered', true
      ),
      r.h3::BIGINT,
      NOW() + INTERVAL '3 days',
      NOW() - INTERVAL '4 hours'
    )
) AS seed(pid, party_name, location_data, host_id, appointment_time, created_at)
ON CONFLICT (pid) DO UPDATE
SET
  party_name = EXCLUDED.party_name,
  location_data = EXCLUDED.location_data,
  host_id = EXCLUDED.host_id,
  appointment_time = EXCLUDED.appointment_time,
  created_at = EXCLUDED.created_at;

-- Pending/accepted joins below max capacity (still joinable).
WITH picked AS (
  SELECT
    (SELECT uid FROM public.users ORDER BY created_at, uid LIMIT 1) AS u1,
    (SELECT uid FROM public.users ORDER BY created_at, uid OFFSET 1 LIMIT 1) AS u2,
    (SELECT uid FROM public.users ORDER BY created_at, uid OFFSET 2 LIMIT 1) AS u3,
    (SELECT uid FROM public.users ORDER BY created_at, uid OFFSET 3 LIMIT 1) AS u4,
    (SELECT uid FROM public.users ORDER BY created_at, uid OFFSET 4 LIMIT 1) AS u5
),
resolved AS (
  SELECT
    COALESCE(u1, u2, u3, u4, u5) AS h1,
    COALESCE(u2, u1, u3, u4, u5) AS h2,
    COALESCE(u3, u1, u2, u4, u5) AS h3,
    COALESCE(u4, u1, u2, u3, u5) AS p1,
    COALESCE(u5, u1, u2, u3, u4) AS p2
  FROM picked
),
join_rows AS (
  SELECT 9161::BIGINT AS party_id, r.p1::BIGINT AS user_id, 'accepted'::join_status AS status, NOW() - INTERVAL '90 minutes' AS request_time FROM resolved r
  UNION ALL
  SELECT 9161::BIGINT, r.p2::BIGINT, 'pending'::join_status, NOW() - INTERVAL '70 minutes' FROM resolved r
  UNION ALL
  SELECT 9162::BIGINT, r.p2::BIGINT, 'accepted'::join_status, NOW() - INTERVAL '60 minutes' FROM resolved r
  UNION ALL
  SELECT 9162::BIGINT, r.p1::BIGINT, 'pending'::join_status, NOW() - INTERVAL '50 minutes' FROM resolved r
  UNION ALL
  SELECT 9163::BIGINT, r.p1::BIGINT, 'accepted'::join_status, NOW() - INTERVAL '40 minutes' FROM resolved r
)
INSERT INTO public.party_joins (
  party_id,
  user_id,
  request_time,
  status,
  checked_in_at,
  confirmed_arrival
)
SELECT
  jr.party_id,
  jr.user_id,
  jr.request_time,
  jr.status,
  NULL::TIMESTAMPTZ,
  false
FROM join_rows jr
JOIN public.parties p ON p.pid = jr.party_id
WHERE jr.user_id IS NOT NULL
  AND jr.user_id <> p.host_id
ON CONFLICT (party_id, user_id) DO UPDATE
SET
  request_time = EXCLUDED.request_time,
  status = EXCLUDED.status,
  checked_in_at = EXCLUDED.checked_in_at,
  confirmed_arrival = EXCLUDED.confirmed_arrival;

SELECT setval(
  pg_get_serial_sequence('public.parties', 'pid'),
  GREATEST((SELECT COALESCE(MAX(pid), 1) FROM public.parties), 1),
  true
);
