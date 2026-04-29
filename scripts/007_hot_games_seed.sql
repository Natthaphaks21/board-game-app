-- 007_hot_games_seed.sql
-- Adds popular/party board games with cover image URLs + physical inventory items.
-- Safe to run multiple times.

ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT 'Board Game';

ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

INSERT INTO public.board_game_catalogue (catalogue_id, game_name, category, cover_image_path)
VALUES
  (9211, 'Werewolf', 'Party', 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Ultimate_Werewold_board_game_cover_art_2017.png/330px-Ultimate_Werewold_board_game_cover_art_2017.png'),
  (9212, 'Insider', 'Party', 'https://oinkgames.com/images/flatview/insider_en_front.png'),
  (9213, 'Dixit', 'Storytelling', 'https://upload.wikimedia.org/wikipedia/en/7/7b/Dixitgame.jpg'),
  (9214, 'Exploding Kittens', 'Party', 'https://upload.wikimedia.org/wikipedia/en/a/a6/Exploding_Kittens.png'),
  (9215, 'Coup', 'Bluffing', 'https://indieboardsandcards.com/wp-content/uploads/2019/10/Untitled-design-4.png')
ON CONFLICT (catalogue_id) DO UPDATE
SET
  game_name = EXCLUDED.game_name,
  category = EXCLUDED.category,
  cover_image_path = EXCLUDED.cover_image_path;

INSERT INTO public.physical_board_games (item_id, catalogue_id, borrower_id, status, last_updated)
VALUES
  (9311, 9211, NULL, 'available', NOW()),
  (9312, 9212, NULL, 'available', NOW()),
  (9313, 9213, NULL, 'available', NOW()),
  (9314, 9214, NULL, 'available', NOW()),
  (9315, 9215, NULL, 'available', NOW())
ON CONFLICT (item_id) DO UPDATE
SET
  catalogue_id = EXCLUDED.catalogue_id,
  borrower_id = EXCLUDED.borrower_id,
  status = EXCLUDED.status,
  last_updated = EXCLUDED.last_updated;

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
