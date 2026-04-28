-- 007_hot_games_seed.sql
-- Adds popular/party board games with cover image URLs + physical inventory items.
-- Safe to run multiple times.

ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT 'Board Game';

ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

INSERT INTO public.board_game_catalogue (catalogue_id, game_name, category, cover_image_path)
VALUES
  (9211, 'Werewolf', 'Party', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80'),
  (9212, 'Insider', 'Party', 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?auto=format&fit=crop&w=400&q=80'),
  (9213, 'Dixit', 'Storytelling', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=400&q=80'),
  (9214, 'Exploding Kittens', 'Party', 'https://images.unsplash.com/photo-1606503153255-59d8b8b5b7f9?auto=format&fit=crop&w=400&q=80'),
  (9215, 'Coup', 'Bluffing', 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=400&q=80')
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
