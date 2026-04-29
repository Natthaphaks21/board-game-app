-- 009_extended_demo_seed.sql
-- Adds more mock data for end-to-end UI testing.
-- Safe to run multiple times (idempotent upserts, isolated ID range).

-- ---------------------------------------------------------------------------
-- 0) Compatibility columns
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_id UUID;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS thai_citizen_id_hash TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS thai_citizen_id_last4 VARCHAR(4);

ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT 'Board Game';

ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS tier VARCHAR(20);

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- 1) Extra demo users (distinct usernames so host can see requester names)
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
  (9004, NULL, 'May', 'Tan', 'may_tan', 'demo_google_9004', 'demo_hash_9004', '9004', NOW() - INTERVAL '14 days'),
  (9005, NULL, 'Nate', 'Lee', 'nate_lee', 'demo_google_9005', 'demo_hash_9005', '9005', NOW() - INTERVAL '12 days'),
  (9006, NULL, 'Praew', 'K.', 'praew_k', 'demo_google_9006', 'demo_hash_9006', '9006', NOW() - INTERVAL '11 days'),
  (9007, NULL, 'Beam', 'P.', 'beam_p', 'demo_google_9007', 'demo_hash_9007', '9007', NOW() - INTERVAL '9 days'),
  (9008, NULL, 'Golf', 'N.', 'golf_n', 'demo_google_9008', 'demo_hash_9008', '9008', NOW() - INTERVAL '8 days')
ON CONFLICT (uid) DO UPDATE
SET
  name = EXCLUDED.name,
  surname = EXCLUDED.surname,
  username = EXCLUDED.username,
  google_auth_id = EXCLUDED.google_auth_id,
  thai_citizen_id_hash = EXCLUDED.thai_citizen_id_hash,
  thai_citizen_id_last4 = EXCLUDED.thai_citizen_id_last4;

-- ---------------------------------------------------------------------------
-- 2) Membership setup with plan tiers (basic/pro/premium)
-- ---------------------------------------------------------------------------
INSERT INTO public.members (vid, subscription_date, tier, subscription_expires_at)
VALUES
  (9001, NOW() - INTERVAL '45 days', 'basic', NOW() + INTERVAL '15 days'),
  (9002, NOW() - INTERVAL '40 days', 'pro', NOW() + INTERVAL '20 days'),
  (9003, NOW() - INTERVAL '35 days', 'premium', NOW() + INTERVAL '25 days'),
  (9004, NOW() - INTERVAL '20 days', 'basic', NOW() + INTERVAL '10 days'),
  (9005, NOW() - INTERVAL '18 days', 'pro', NOW() + INTERVAL '9 days'),
  (9006, NOW() - INTERVAL '16 days', 'premium', NOW() + INTERVAL '12 days'),
  (9007, NOW() - INTERVAL '15 days', 'basic', NOW() - INTERVAL '1 day'),
  (9008, NOW() - INTERVAL '14 days', 'pro', NOW() + INTERVAL '8 days')
ON CONFLICT (vid) DO UPDATE
SET
  tier = EXCLUDED.tier,
  subscription_date = EXCLUDED.subscription_date,
  subscription_expires_at = EXCLUDED.subscription_expires_at;

-- ---------------------------------------------------------------------------
-- 3) Extra board games + inventory
-- ---------------------------------------------------------------------------
INSERT INTO public.board_game_catalogue (catalogue_id, game_name, category, cover_image_path)
VALUES
  (9221, 'King of Tokyo', 'Dice', 'https://upload.wikimedia.org/wikipedia/en/3/32/King_of_Tokyo_box_art.jpg'),
  (9222, '7 Wonders', 'Card Drafting', 'https://upload.wikimedia.org/wikipedia/en/5/5d/7_Wonders_board_game.jpg'),
  (9223, 'Sushi Go!', 'Party', 'https://upload.wikimedia.org/wikipedia/en/8/86/Sushi_Go%21_box.jpg'),
  (9224, 'Love Letter', 'Card', 'https://upload.wikimedia.org/wikipedia/en/f/f2/Love_Letter_game_box.jpg'),
  (9225, 'The Crew', 'Cooperative', 'https://upload.wikimedia.org/wikipedia/en/7/7a/The_Crew_board_game_cover.jpg'),
  (9226, 'Patchwork', 'Abstract', 'https://upload.wikimedia.org/wikipedia/en/8/8f/Patchwork_board_game_cover.jpg'),
  (9227, 'Terraforming Mars', 'Strategy', 'https://upload.wikimedia.org/wikipedia/en/6/6a/Terraforming_Mars_box_cover.jpg'),
  (9228, 'Root', 'Asymmetric', 'https://upload.wikimedia.org/wikipedia/en/2/25/Root_board_game_cover.jpg')
ON CONFLICT (catalogue_id) DO UPDATE
SET
  game_name = EXCLUDED.game_name,
  category = EXCLUDED.category,
  cover_image_path = EXCLUDED.cover_image_path;

INSERT INTO public.physical_board_games (
  item_id,
  catalogue_id,
  borrower_id,
  status,
  last_updated
)
VALUES
  (9401, 9221, NULL, 'available', NOW() - INTERVAL '2 days'),
  (9402, 9221, NULL, 'available', NOW() - INTERVAL '2 days'),
  (9403, 9222, 9002, 'lended', NOW() - INTERVAL '3 days'),
  (9404, 9222, NULL, 'available', NOW() - INTERVAL '1 day'),
  (9405, 9223, 9003, 'lended', NOW() - INTERVAL '4 days'),
  (9406, 9223, NULL, 'available', NOW() - INTERVAL '10 hours'),
  (9407, 9224, 9001, 'lended', NOW() - INTERVAL '5 days'),
  (9408, 9224, NULL, 'available', NOW() - INTERVAL '6 hours'),
  (9409, 9225, 9005, 'lended', NOW() - INTERVAL '2 days'),
  (9410, 9225, NULL, 'available', NOW() - INTERVAL '20 hours'),
  (9411, 9226, NULL, 'maintenance', NOW() - INTERVAL '1 day'),
  (9412, 9226, NULL, 'available', NOW() - INTERVAL '8 hours'),
  (9413, 9227, 9006, 'lended', NOW() - INTERVAL '6 days'),
  (9414, 9227, NULL, 'available', NOW() - INTERVAL '12 hours'),
  (9415, 9228, NULL, 'available', NOW() - INTERVAL '16 hours'),
  (9416, 9228, 9002, 'lended', NOW() - INTERVAL '7 days')
ON CONFLICT (item_id) DO UPDATE
SET
  catalogue_id = EXCLUDED.catalogue_id,
  borrower_id = EXCLUDED.borrower_id,
  status = EXCLUDED.status,
  last_updated = EXCLUDED.last_updated;

-- ---------------------------------------------------------------------------
-- 4) More parties (future + past + cancelled)
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
    9151,
    'Bangkok Bluff Night',
    jsonb_build_object(
      'displayName', 'Ari Board Game Cafe',
      'formattedAddress', 'Ari, Bangkok',
      'venueType', 'cafe',
      'description', 'Werewolf, Coup, and social deduction table.',
      'tags', jsonb_build_array('Party', 'Bluffing'),
      'selectedGames', jsonb_build_array('Werewolf', 'Coup', 'Insider'),
      'maxPlayers', 10,
      'isManuallyEntered', true
    ),
    9004,
    NOW() + INTERVAL '18 hours',
    NOW() - INTERVAL '2 days'
  ),
  (
    9152,
    'Family Gateway Evening',
    jsonb_build_object(
      'displayName', 'Phrom Phong Co-Play Space',
      'formattedAddress', 'Phrom Phong, Bangkok',
      'venueType', 'community',
      'description', 'Relaxed games for new players and families.',
      'tags', jsonb_build_array('Family', 'Beginner Friendly'),
      'selectedGames', jsonb_build_array('Ticket to Ride', 'Sushi Go!', 'Carcassonne'),
      'maxPlayers', 6,
      'isManuallyEntered', true
    ),
    9001,
    NOW() + INTERVAL '2 days',
    NOW() - INTERVAL '36 hours'
  ),
  (
    9153,
    'Heavy Strategy Table',
    jsonb_build_object(
      'displayName', 'Rama 9 Strategy Hub',
      'formattedAddress', 'Rama 9, Bangkok',
      'venueType', 'cafe',
      'description', 'Long session for experienced strategy players.',
      'tags', jsonb_build_array('Strategy', 'Advanced'),
      'selectedGames', jsonb_build_array('Terraforming Mars', 'Wingspan'),
      'maxPlayers', 5,
      'isManuallyEntered', true
    ),
    9006,
    NOW() + INTERVAL '3 days',
    NOW() - INTERVAL '30 hours'
  ),
  (
    9154,
    'Lunch Break Quick Games',
    jsonb_build_object(
      'displayName', 'Silom Community Room',
      'formattedAddress', 'Silom, Bangkok',
      'venueType', 'community',
      'description', 'Fast rounds, 30-45 minutes per game.',
      'tags', jsonb_build_array('Casual', 'Quick Rounds'),
      'selectedGames', jsonb_build_array('Love Letter', 'Codenames'),
      'maxPlayers', 7,
      'isManuallyEntered', true
    ),
    9005,
    NOW() + INTERVAL '4 days',
    NOW() - INTERVAL '24 hours'
  ),
  (
    9155,
    'Co-op Friday Mission',
    jsonb_build_object(
      'displayName', 'Ladprao Play Cafe',
      'formattedAddress', 'Ladprao, Bangkok',
      'venueType', 'cafe',
      'description', 'Co-op games only, teamwork focused.',
      'tags', jsonb_build_array('Co-op', 'Team Play'),
      'selectedGames', jsonb_build_array('Pandemic', 'The Crew'),
      'maxPlayers', 5,
      'isManuallyEntered', true
    ),
    9002,
    NOW() + INTERVAL '5 days',
    NOW() - INTERVAL '22 hours'
  ),
  (
    9156,
    'Last Week Social Night',
    jsonb_build_object(
      'displayName', 'Victory Point Cafe',
      'formattedAddress', 'On Nut, Bangkok',
      'venueType', 'cafe',
      'description', 'Completed social game night for history testing.',
      'tags', jsonb_build_array('Party', 'History'),
      'selectedGames', jsonb_build_array('Insider', 'Dixit'),
      'maxPlayers', 8,
      'isManuallyEntered', true
    ),
    9004,
    NOW() - INTERVAL '8 days',
    NOW() - INTERVAL '10 days'
  ),
  (
    9157,
    'Cancelled Rainy Day Meetup',
    jsonb_build_object(
      'displayName', 'Riverfront Board Loft',
      'formattedAddress', 'Charoen Krung, Bangkok',
      'venueType', 'cafe',
      'description', 'Cancelled sample for history/cancel UI.',
      'tags', jsonb_build_array('Demo', 'Cancelled'),
      'selectedGames', jsonb_build_array('Patchwork'),
      'maxPlayers', 4,
      'isManuallyEntered', true,
      'cancelledAt', NOW() - INTERVAL '3 hours',
      'cancelReason', 'Venue closed early'
    ),
    9001,
    NOW() + INTERVAL '36 hours',
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT (pid) DO UPDATE
SET
  party_name = EXCLUDED.party_name,
  location_data = EXCLUDED.location_data,
  host_id = EXCLUDED.host_id,
  appointment_time = EXCLUDED.appointment_time,
  created_at = EXCLUDED.created_at;

-- ---------------------------------------------------------------------------
-- 5) Join states for host control / waiting room / history
-- Important: no future party has confirmed arrival yet.
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
  (9151, 9002, NOW() - INTERVAL '20 hours', 'pending', NULL, false),
  (9151, 9003, NOW() - INTERVAL '19 hours', 'accepted', NULL, false),
  (9151, 9005, NOW() - INTERVAL '18 hours', 'accepted', NULL, false),
  (9151, 9008, NOW() - INTERVAL '17 hours', 'pending', NULL, false),

  (9152, 9004, NOW() - INTERVAL '10 hours', 'accepted', NULL, false),
  (9152, 9006, NOW() - INTERVAL '9 hours', 'pending', NULL, false),

  (9153, 9001, NOW() - INTERVAL '8 hours', 'accepted', NULL, false),
  (9153, 9002, NOW() - INTERVAL '7 hours', 'pending', NULL, false),
  (9153, 9005, NOW() - INTERVAL '7 hours', 'rejected', NULL, false),

  (9154, 9003, NOW() - INTERVAL '6 hours', 'accepted', NULL, false),
  (9154, 9007, NOW() - INTERVAL '5 hours', 'pending', NULL, false),

  (9155, 9004, NOW() - INTERVAL '4 hours', 'accepted', NULL, false),
  (9155, 9006, NOW() - INTERVAL '4 hours', 'accepted', NULL, false),
  (9155, 9008, NOW() - INTERVAL '3 hours', 'pending', NULL, false),

  (9156, 9002, NOW() - INTERVAL '9 days', 'accepted', NOW() - INTERVAL '8 days', true),
  (9156, 9003, NOW() - INTERVAL '9 days', 'accepted', NOW() - INTERVAL '8 days', true),
  (9156, 9005, NOW() - INTERVAL '9 days', 'accepted', NULL, false),

  (9157, 9004, NOW() - INTERVAL '12 hours', 'accepted', NULL, false),
  (9157, 9006, NOW() - INTERVAL '12 hours', 'pending', NULL, false)
ON CONFLICT (party_id, user_id) DO UPDATE
SET
  request_time = EXCLUDED.request_time,
  status = EXCLUDED.status,
  checked_in_at = EXCLUDED.checked_in_at,
  confirmed_arrival = EXCLUDED.confirmed_arrival;

-- ---------------------------------------------------------------------------
-- 6) Optional chat timeline seeds (if chat migration is applied)
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'party_messages'
  ) THEN
    DELETE FROM public.party_messages
    WHERE party_id IN (9151, 9152, 9153, 9154, 9155, 9156, 9157);

    INSERT INTO public.party_messages (party_id, sender_id, sender_name, message, created_at)
    VALUES
      (9151, 9004, 'may_tan', 'Welcome! We start with Insider first.', NOW() - INTERVAL '2 hours'),
      (9151, 9003, 'demo_player_b', 'I can arrive around 18:30.', NOW() - INTERVAL '110 minutes'),
      (9151, 9005, 'nate_lee', 'I will bring score sheets.', NOW() - INTERVAL '95 minutes'),
      (9152, 9001, 'demo_host', 'This table is beginner friendly.', NOW() - INTERVAL '70 minutes'),
      (9153, 9006, 'praew_k', 'Please read Terraforming Mars rules before joining.', NOW() - INTERVAL '55 minutes'),
      (9154, 9005, 'nate_lee', 'Quick games only, no long setup.', NOW() - INTERVAL '40 minutes'),
      (9155, 9002, 'demo_player_a', 'Let us coordinate who brings Pandemic.', NOW() - INTERVAL '30 minutes'),
      (9156, 9004, 'may_tan', 'Thanks all for joining last week!', NOW() - INTERVAL '7 days'),
      (9157, 9001, 'demo_host', 'Sorry, this meetup is cancelled due to venue issue.', NOW() - INTERVAL '3 hours');
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 7) Keep identity sequences ahead of manual IDs.
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
