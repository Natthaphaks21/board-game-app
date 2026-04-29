-- 010_joinable_parties_only_seed.sql
-- Adds ONLY joinable parties:
-- - future appointment_time
-- - no cancelledAt field
-- - available slots (maxPlayers > accepted joins)
-- Safe to run multiple times.

-- ---------------------------------------------------------------------------
-- 1) Insert joinable parties only
-- ---------------------------------------------------------------------------
INSERT INTO public.parties (
  pid,
  party_name,
  location_data,
  host_id,
  appointment_time,
  created_at
)
VALUES
  (
    9161,
    'Ari Casual Game Night',
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
    9001,
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '2 hours'
  ),
  (
    9162,
    'Strategy Thursday',
    jsonb_build_object(
      'displayName', 'Rama 9 Strategy Hub',
      'formattedAddress', 'Rama 9, Bangkok',
      'venueType', 'cafe',
      'description', 'Medium-heavy strategy table.',
      'tags', jsonb_build_array('Strategy'),
      'selectedGames', jsonb_build_array('Catan', 'Terraforming Mars'),
      'maxPlayers', 6,
      'isManuallyEntered', true
    ),
    9004,
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '3 hours'
  ),
  (
    9163,
    'After Work Fast Games',
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
    9005,
    NOW() + INTERVAL '3 days',
    NOW() - INTERVAL '4 hours'
  ),
  (
    9164,
    'Family Weekend Table',
    jsonb_build_object(
      'displayName', 'Phrom Phong Co-Play Space',
      'formattedAddress', 'Phrom Phong, Bangkok',
      'venueType', 'community',
      'description', 'Family-friendly table for all ages.',
      'tags', jsonb_build_array('Family', 'Relaxed'),
      'selectedGames', jsonb_build_array('Ticket to Ride', 'Carcassonne'),
      'maxPlayers', 6,
      'isManuallyEntered', true
    ),
    9002,
    NOW() + INTERVAL '4 days',
    NOW() - INTERVAL '5 hours'
  ),
  (
    9165,
    'Co-op Mission Night',
    jsonb_build_object(
      'displayName', 'Ladprao Play Cafe',
      'formattedAddress', 'Ladprao, Bangkok',
      'venueType', 'cafe',
      'description', 'Team-focused co-op night.',
      'tags', jsonb_build_array('Co-op'),
      'selectedGames', jsonb_build_array('Pandemic', 'The Crew'),
      'maxPlayers', 5,
      'isManuallyEntered', true
    ),
    9006,
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '6 hours'
  )
ON CONFLICT (pid) DO UPDATE
SET
  party_name = EXCLUDED.party_name,
  location_data = EXCLUDED.location_data,
  host_id = EXCLUDED.host_id,
  appointment_time = EXCLUDED.appointment_time,
  created_at = EXCLUDED.created_at;

-- ---------------------------------------------------------------------------
-- 2) Accepted/pending joins (kept below maxPlayers so still joinable)
-- ---------------------------------------------------------------------------
INSERT INTO public.party_joins (
  party_id,
  user_id,
  request_time,
  status,
  checked_in_at,
  confirmed_arrival
)
VALUES
  (9161, 9002, NOW() - INTERVAL '90 minutes', 'accepted', NULL, false),
  (9161, 9003, NOW() - INTERVAL '80 minutes', 'pending', NULL, false),

  (9162, 9001, NOW() - INTERVAL '70 minutes', 'accepted', NULL, false),
  (9162, 9003, NOW() - INTERVAL '65 minutes', 'pending', NULL, false),

  (9163, 9004, NOW() - INTERVAL '60 minutes', 'accepted', NULL, false),
  (9163, 9007, NOW() - INTERVAL '55 minutes', 'pending', NULL, false),

  (9164, 9005, NOW() - INTERVAL '50 minutes', 'accepted', NULL, false),

  (9165, 9008, NOW() - INTERVAL '45 minutes', 'accepted', NULL, false),
  (9165, 9004, NOW() - INTERVAL '40 minutes', 'pending', NULL, false)
ON CONFLICT (party_id, user_id) DO UPDATE
SET
  request_time = EXCLUDED.request_time,
  status = EXCLUDED.status,
  checked_in_at = EXCLUDED.checked_in_at,
  confirmed_arrival = EXCLUDED.confirmed_arrival;

-- ---------------------------------------------------------------------------
-- 3) Keep sequence ahead
-- ---------------------------------------------------------------------------
SELECT setval(
  pg_get_serial_sequence('public.parties', 'pid'),
  GREATEST((SELECT COALESCE(MAX(pid), 1) FROM public.parties), 1),
  true
);
