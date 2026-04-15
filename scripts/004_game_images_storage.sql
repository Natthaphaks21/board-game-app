-- Game images & borrow flow improvements
-- Best practice: store image files in Supabase Storage,
-- and store only the object path in Postgres.

-- 1) Extend board game catalogue metadata.
ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS category VARCHAR(40) DEFAULT 'Board Game';

ALTER TABLE public.board_game_catalogue
ADD COLUMN IF NOT EXISTS cover_image_path TEXT;

-- cover_image_path stores either:
-- - storage object path in bucket 'boardgame-covers' (recommended), e.g. 'covers/catan.jpg'
-- - or full URL (legacy/fallback)

-- 2) Create public bucket for cover images if missing.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'boardgame-covers',
  'boardgame-covers',
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3) Storage policies for cover images.
-- Public can read game cover images.
DROP POLICY IF EXISTS "public_read_boardgame_covers" ON storage.objects;
CREATE POLICY "public_read_boardgame_covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'boardgame-covers');

-- Authenticated users can upload/update/delete in this bucket.
-- If you want stricter admin-only management later, tighten these policies.
DROP POLICY IF EXISTS "auth_insert_boardgame_covers" ON storage.objects;
CREATE POLICY "auth_insert_boardgame_covers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'boardgame-covers');

DROP POLICY IF EXISTS "auth_update_boardgame_covers" ON storage.objects;
CREATE POLICY "auth_update_boardgame_covers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'boardgame-covers')
WITH CHECK (bucket_id = 'boardgame-covers');

DROP POLICY IF EXISTS "auth_delete_boardgame_covers" ON storage.objects;
CREATE POLICY "auth_delete_boardgame_covers"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'boardgame-covers');

-- 4) Allow members to borrow/return physical board games.
-- Existing SELECT policy is already present in 003.
DROP POLICY IF EXISTS "physical_games_member_update" ON public.physical_board_games;
CREATE POLICY "physical_games_member_update"
ON public.physical_board_games
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.members m ON m.vid = u.uid
    WHERE u.auth_id = auth.uid()
      AND (
        public.physical_board_games.status = 'available'
        OR public.physical_board_games.borrower_id = u.uid
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.users u
    JOIN public.members m ON m.vid = u.uid
    WHERE u.auth_id = auth.uid()
      AND (
        public.physical_board_games.borrower_id IS NULL
        OR public.physical_board_games.borrower_id = u.uid
      )
  )
);
