-- Demo seed data for BoardBuddies (safe for repeated runs)
-- Purpose: quickly populate catalogue, physical games, parties, and joins for UI demo.
-- Note: this is demo-only data, not for production.

-- Ensure core columns exist for mixed environments (after 002/003).
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_id UUID;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS thai_citizen_id_hash TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS thai_citizen_id_last4 VARCHAR(4);

-- Ensure optional columns from 004 exist (idempotent).
ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT 'Board Game';

ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

-- ---------------------------------------------------------------------------
-- 1) Demo/Fallback users (used only when real auth users are not enough)
-- ---------------------------------------------------------------------------
INSERT INTO public.users (
  uid,
  auth_id,
  name,
  surname,
  username,
  google_auth_id,
  thai_citizen_id_hash,
  thai_citizen_id_last4,
  created_at
)
VALUES
  (9001, NULL, 'Demo', 'Host', 'demo_host', 'demo_google_host', 'demo_hash_9001', '9001', NOW() - INTERVAL '30 days'),
  (9002, NULL, 'Demo', 'PlayerA', 'demo_player_a', 'demo_google_9002', 'demo_hash_9002', '9002', NOW() - INTERVAL '20 days'),
  (9003, NULL, 'Demo', 'PlayerB', 'demo_player_b', 'demo_google_9003', 'demo_hash_9003', '9003', NOW() - INTERVAL '10 days')
ON CONFLICT (uid) DO UPDATE
SET
  name = EXCLUDED.name,
  surname = EXCLUDED.surname,
  username = EXCLUDED.username,
  google_auth_id = EXCLUDED.google_auth_id,
  thai_citizen_id_hash = EXCLUDED.thai_citizen_id_hash,
  thai_citizen_id_last4 = EXCLUDED.thai_citizen_id_last4;

-- Make all real auth users members for easier demo testing.
INSERT INTO public.members (vid, subscription_date)
SELECT uid, NOW() - INTERVAL '3 days'
FROM public.users
WHERE auth_id IS NOT NULL
ON CONFLICT (vid) DO NOTHING;

-- Fallback demo members.
INSERT INTO public.members (vid, subscription_date)
VALUES
  (9001, NOW() - INTERVAL '15 days'),
  (9002, NOW() - INTERVAL '15 days'),
  (9003, NOW() - INTERVAL '15 days')
ON CONFLICT (vid) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2) Board game catalogue + cover images
-- Best practice supported by app:
-- - cover_image_path can be a storage path in bucket `boardgame-covers`
-- - or a full URL (used here for quick demo)
-- ---------------------------------------------------------------------------
INSERT INTO public.board_game_catalogue (catalogue_id, game_name, category, cover_image_path)
VALUES
  (9201, 'Catan', 'Strategy', 'https://images.unsplash.com/photo-1632501641765-e568d28b0015?auto=format&fit=crop&w=400&q=80'),
  (9202, 'Ticket to Ride', 'Family', 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=400&q=80'),
  (9203, 'Codenames', 'Party', 'https://images.unsplash.com/photo-1606503153255-59d8b8b5b7f9?auto=format&fit=crop&w=400&q=80'),
  (9204, 'Wingspan', 'Engine Building', 'https://images.unsplash.com/photo-1585504198199-20277593b94f?auto=format&fit=crop&w=400&q=80'),
  (9205, 'Azul', 'Abstract', 'https://images.unsplash.com/photo-1606053896989-1ff2f7976db5?auto=format&fit=crop&w=400&q=80'),
  (9206, 'Pandemic', 'Cooperative', 'https://images.unsplash.com/photo-1603732551658-5fabbafa84eb?auto=format&fit=crop&w=400&q=80')
ON CONFLICT (catalogue_id) DO UPDATE
SET
  game_name = EXCLUDED.game_name,
  category = EXCLUDED.category,
  cover_image_path = EXCLUDED.cover_image_path;

-- ---------------------------------------------------------------------------
-- 3) Physical board games (inventory)
-- Some available, some borrowed for demo states.
-- ---------------------------------------------------------------------------
WITH first_member AS (
  SELECT vid FROM public.members ORDER BY subscription_date ASC, vid ASC LIMIT 1
), second_member AS (
  SELECT vid FROM public.members ORDER BY subscription_date ASC, vid ASC OFFSET 1 LIMIT 1
)
INSERT INTO public.physical_board_games (
  item_id,
  catalogue_id,
  borrower_id,
  status,
  last_updated
)
VALUES
  (9301, 9201, NULL, 'available', NOW() - INTERVAL '1 day'),
  (9302, 9201, (SELECT vid FROM first_member), 'lended', NOW() - INTERVAL '5 days'),
  (9303, 9202, NULL, 'available', NOW() - INTERVAL '2 days'),
  (9304, 9202, NULL, 'maintenance', NOW() - INTERVAL '1 day'),
  (9305, 9203, (SELECT vid FROM second_member), 'lended', NOW() - INTERVAL '8 days'),
  (9306, 9203, NULL, 'available', NOW() - INTERVAL '1 day'),
  (9307, 9204, NULL, 'available', NOW() - INTERVAL '1 day'),
  (9308, 9205, NULL, 'available', NOW() - INTERVAL '1 day'),
  (9309, 9206, NULL, 'available', NOW() - INTERVAL '1 day')
ON CONFLICT (item_id) DO UPDATE
SET
  catalogue_id = EXCLUDED.catalogue_id,
  borrower_id = EXCLUDED.borrower_id,
  status = EXCLUDED.status,
  last_updated = EXCLUDED.last_updated;

-- ---------------------------------------------------------------------------
-- 4) Parties + joins
-- Tries to use real auth users first; falls back to demo users.
-- ---------------------------------------------------------------------------
WITH host_pick AS (
  SELECT COALESCE(
    (SELECT uid FROM public.users WHERE auth_id IS NOT NULL ORDER BY created_at ASC LIMIT 1),
    9001
  ) AS host_uid
), player_a AS (
  SELECT COALESCE(
    (SELECT uid FROM public.users WHERE auth_id IS NOT NULL ORDER BY created_at ASC OFFSET 1 LIMIT 1),
    9002
  ) AS uid
), player_b AS (
  SELECT COALESCE(
    (SELECT uid FROM public.users WHERE auth_id IS NOT NULL ORDER BY created_at ASC OFFSET 2 LIMIT 1),
    9003
  ) AS uid
)
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
    9101,
    'Friday Strategy Night',
    jsonb_build_object(
      'displayName', 'BoardBuddies Cafe',
      'formattedAddress', 'Sukhumvit Rd, Bangkok',
      'venueType', 'cafe',
      'description', 'Chill strategy night for all levels.',
      'tags', jsonb_build_array('Strategy', 'Beginner Friendly'),
      'selectedGames', jsonb_build_array('Catan', 'Ticket to Ride'),
      'maxPlayers', 6,
      'isManuallyEntered', true
    ),
    (SELECT host_uid FROM host_pick),
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '2 days'
  ),
  (
    9102,
    'Weekend Party Games',
    jsonb_build_object(
      'displayName', 'Community Library Hall',
      'formattedAddress', 'Rama IV Rd, Bangkok',
      'venueType', 'community',
      'description', 'Fast and fun social games.',
      'tags', jsonb_build_array('Party', 'Casual'),
      'selectedGames', jsonb_build_array('Codenames'),
      'maxPlayers', 8,
      'isManuallyEntered', true
    ),
    (SELECT host_uid FROM host_pick),
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '1 day'
  ),
  (
    9103,
    'Past Session: Co-op Night',
    jsonb_build_object(
      'displayName', 'Demo Game Hub',
      'formattedAddress', 'Silom, Bangkok',
      'venueType', 'cafe',
      'description', 'Co-op run for history stats.',
      'tags', jsonb_build_array('Co-op'),
      'selectedGames', jsonb_build_array('Pandemic'),
      'maxPlayers', 5,
      'isManuallyEntered', true
    ),
    (SELECT host_uid FROM host_pick),
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '9 days'
  )
ON CONFLICT (pid) DO UPDATE
SET
  party_name = EXCLUDED.party_name,
  location_data = EXCLUDED.location_data,
  host_id = EXCLUDED.host_id,
  appointment_time = EXCLUDED.appointment_time,
  created_at = EXCLUDED.created_at;

WITH player_a AS (
  SELECT COALESCE(
    (SELECT uid FROM public.users WHERE auth_id IS NOT NULL ORDER BY created_at ASC OFFSET 1 LIMIT 1),
    9002
  ) AS uid
), player_b AS (
  SELECT COALESCE(
    (SELECT uid FROM public.users WHERE auth_id IS NOT NULL ORDER BY created_at ASC OFFSET 2 LIMIT 1),
    9003
  ) AS uid
)
INSERT INTO public.party_joins (
  party_id,
  user_id,
  request_time,
  status,
  checked_in_at,
  confirmed_arrival
)
VALUES
  (9101, (SELECT uid FROM player_a), NOW() - INTERVAL '1 day', 'accepted', NULL, false),
  (9101, (SELECT uid FROM player_b), NOW() - INTERVAL '20 hours', 'pending', NULL, false),
  (9102, (SELECT uid FROM player_a), NOW() - INTERVAL '10 hours', 'accepted', NULL, false),
  (9103, (SELECT uid FROM player_a), NOW() - INTERVAL '8 days', 'accepted', NOW() - INTERVAL '7 days', true),
  (9103, (SELECT uid FROM player_b), NOW() - INTERVAL '8 days', 'accepted', NULL, false)
ON CONFLICT (party_id, user_id) DO UPDATE
SET
  request_time = EXCLUDED.request_time,
  status = EXCLUDED.status,
  checked_in_at = EXCLUDED.checked_in_at,
  confirmed_arrival = EXCLUDED.confirmed_arrival;

-- ---------------------------------------------------------------------------
-- 5) Keep identity sequences ahead of manual IDs.
-- ---------------------------------------------------------------------------
SELECT setval(
  pg_get_serial_sequence('public.users', 'uid'),
  GREATEST((SELECT COALESCE(MAX(uid), 1) FROM public.users), 1),
  true
);

SELECT setval(
  pg_get_serial_sequence('public.board_game_catalogue', 'catalogue_id'),
  GREATEST((SELECT COALESCE(MAX(catalogue_id), 1) FROM public.board_game_catalogue), 1),
  true
);

SELECT setval(
  pg_get_serial_sequence('public.physical_board_games', 'item_id'),
  GREATEST((SELECT COALESCE(MAX(item_id), 1) FROM public.physical_board_games), 1),
  true
);

SELECT setval(
  pg_get_serial_sequence('public.parties', 'pid'),
  GREATEST((SELECT COALESCE(MAX(pid), 1) FROM public.parties), 1),
  true
);
