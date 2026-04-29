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
  (9201, 'Catan', 'Strategy', 'https://upload.wikimedia.org/wikipedia/en/a/a3/Catan-2015-boxart.jpg'),
  (9202, 'Ticket to Ride', 'Family', 'https://upload.wikimedia.org/wikipedia/en/9/92/Ticket_to_Ride_Board_Game_Box_EN.jpg'),
  (9203, 'Codenames', 'Party', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Codenames_board_game.jpg/330px-Codenames_board_game.jpg'),
  (9204, 'Wingspan', 'Engine Building', 'https://upload.wikimedia.org/wikipedia/en/c/c3/3d-wingspan-768x752.png'),
  (9205, 'Azul', 'Abstract', 'https://upload.wikimedia.org/wikipedia/en/2/23/Picture_of_Azul_game_box.jpg'),
  (9206, 'Pandemic', 'Cooperative', 'https://upload.wikimedia.org/wikipedia/en/3/36/Pandemic_game.jpg'),
  (9207, 'Splendor', 'Engine Building', 'https://upload.wikimedia.org/wikipedia/en/2/2e/BoardGameSplendorLogoFairUse.jpg'),
  (9208, 'Carcassonne', 'Tile Placement', 'https://upload.wikimedia.org/wikipedia/en/5/5e/Carcassonne-game.jpg')
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
  (9309, 9206, NULL, 'available', NOW() - INTERVAL '1 day'),
  (9310, 9207, NULL, 'available', NOW() - INTERVAL '1 day'),
  (9311, 9207, NULL, 'available', NOW() - INTERVAL '1 day'),
  (9312, 9208, NULL, 'available', NOW() - INTERVAL '1 day'),
  (9313, 9208, (SELECT vid FROM first_member), 'lended', NOW() - INTERVAL '2 days')
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
  ),
  (
    9104,
    'After Work Quick Games',
    jsonb_build_object(
      'displayName', 'Sathorn Play Space',
      'formattedAddress', 'Sathorn Rd, Bangkok',
      'venueType', 'community',
      'description', 'Easy games for weekday evening.',
      'tags', jsonb_build_array('Casual', 'Quick Rounds'),
      'selectedGames', jsonb_build_array('Codenames', 'Splendor'),
      'maxPlayers', 6,
      'isManuallyEntered', true
    ),
    (SELECT host_uid FROM host_pick),
    NOW() + INTERVAL '3 days',
    NOW() - INTERVAL '5 hours'
  ),
  (
    9105,
    'Sunday Family Table',
    jsonb_build_object(
      'displayName', 'Central Board Hub',
      'formattedAddress', 'Phaya Thai Rd, Bangkok',
      'venueType', 'cafe',
      'description', 'Family-friendly table with medium weight games.',
      'tags', jsonb_build_array('Family', 'Relaxed'),
      'selectedGames', jsonb_build_array('Ticket to Ride', 'Carcassonne'),
      'maxPlayers', 5,
      'isManuallyEntered', true
    ),
    (SELECT host_uid FROM host_pick),
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '2 hours'
  ),
  (
    9106,
    'Past Strategy Marathon',
    jsonb_build_object(
      'displayName', 'Riverside Board Loft',
      'formattedAddress', 'Charoen Nakhon Rd, Bangkok',
      'venueType', 'cafe',
      'description', 'Long strategy session for experienced players.',
      'tags', jsonb_build_array('Strategy', 'Advanced'),
      'selectedGames', jsonb_build_array('Wingspan', 'Azul'),
      'maxPlayers', 4,
      'isManuallyEntered', true
    ),
    (SELECT host_uid FROM host_pick),
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '6 days'
  ),
  (
    9107,
    'Cancelled Meetup Demo',
    jsonb_build_object(
      'displayName', 'Old Town Board Bar',
      'formattedAddress', 'Ratchadaphisek Rd, Bangkok',
      'venueType', 'bar',
      'description', 'This demo party is intentionally cancelled.',
      'tags', jsonb_build_array('Demo', 'Cancelled'),
      'selectedGames', jsonb_build_array('Azul'),
      'maxPlayers', 4,
      'isManuallyEntered', true,
      'cancelledAt', NOW() - INTERVAL '2 hours',
      'cancelReason', 'Host emergency'
    ),
    (SELECT host_uid FROM host_pick),
    NOW() + INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
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
  (9104, (SELECT uid FROM player_a), NOW() - INTERVAL '2 hours', 'accepted', NULL, false),
  (9104, (SELECT uid FROM player_b), NOW() - INTERVAL '90 minutes', 'pending', NULL, false),
  (9105, (SELECT uid FROM player_b), NOW() - INTERVAL '1 hour', 'accepted', NULL, false),
  (9107, (SELECT uid FROM player_a), NOW() - INTERVAL '3 hours', 'accepted', NULL, false),
  (9103, (SELECT uid FROM player_a), NOW() - INTERVAL '8 days', 'accepted', NOW() - INTERVAL '7 days', true),
  (9103, (SELECT uid FROM player_b), NOW() - INTERVAL '8 days', 'accepted', NULL, false),
  (9106, (SELECT uid FROM player_a), NOW() - INTERVAL '4 days', 'accepted', NOW() - INTERVAL '3 days', true),
  (9106, (SELECT uid FROM player_b), NOW() - INTERVAL '4 days', 'accepted', NOW() - INTERVAL '3 days', true)
ON CONFLICT (party_id, user_id) DO UPDATE
SET
  request_time = EXCLUDED.request_time,
  status = EXCLUDED.status,
  checked_in_at = EXCLUDED.checked_in_at,
  confirmed_arrival = EXCLUDED.confirmed_arrival;

-- ---------------------------------------------------------------------------
-- 5) Optional chat demo data (if chat table exists).
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'party_messages'
  ) THEN
    DELETE FROM public.party_messages
    WHERE party_id IN (9101, 9102, 9104, 9105, 9106, 9107);

    INSERT INTO public.party_messages (party_id, sender_id, sender_name, message, created_at)
    VALUES
      (9101, 9001, 'demo_host', 'Welcome everyone. We will start around 19:00.', NOW() - INTERVAL '10 hours'),
      (9101, 9002, 'demo_player_a', 'I can bring extra sleeves for cards.', NOW() - INTERVAL '9 hours 45 minutes'),
      (9102, 9001, 'demo_host', 'Feel free to invite one more friend if you want.', NOW() - INTERVAL '6 hours'),
      (9104, 9001, 'demo_host', 'Theme for this table is short games under 45 minutes.', NOW() - INTERVAL '2 hours'),
      (9104, 9002, 'demo_player_a', 'Perfect, I will arrive a bit early.', NOW() - INTERVAL '95 minutes'),
      (9105, 9001, 'demo_host', 'This one is beginner friendly for family players.', NOW() - INTERVAL '50 minutes'),
      (9106, 9002, 'demo_player_a', 'Great session yesterday, thanks host!', NOW() - INTERVAL '2 days'),
      (9106, 9003, 'demo_player_b', 'Let us do another strategy night next month.', NOW() - INTERVAL '2 days'),
      (9107, 9001, 'demo_host', 'Sorry team, this room is cancelled due to emergency.', NOW() - INTERVAL '2 hours');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 6) Keep identity sequences ahead of manual IDs.
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'party_messages'
  ) THEN
    PERFORM setval(
      pg_get_serial_sequence('public.party_messages', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.party_messages), 1),
      true
    );
  END IF;
END $$;
