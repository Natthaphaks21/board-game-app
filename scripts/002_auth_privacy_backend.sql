-- BoardBuddies auth + privacy migration
-- Run this AFTER your original schema script.

-- 1) Link app users to Supabase auth users.
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2) Remove raw Thai citizen ID storage.
-- Keep only irreversible hash + last4 for verification/audit display.
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS thai_citizen_id_hash TEXT;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS thai_citizen_id_last4 VARCHAR(4);

ALTER TABLE public.users
DROP COLUMN IF EXISTS thai_citizen_id;

-- 3) Password is managed by Supabase Auth, not in app table.
ALTER TABLE public.users
DROP COLUMN IF EXISTS password;

-- 4) Helpful indexes.
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- 5) RLS for profile ownership.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_select_own_profile" ON public.users;
CREATE POLICY "users_select_own_profile"
ON public.users
FOR SELECT
USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "users_insert_own_profile" ON public.users;
CREATE POLICY "users_insert_own_profile"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = auth_id);

DROP POLICY IF EXISTS "users_update_own_profile" ON public.users;
CREATE POLICY "users_update_own_profile"
ON public.users
FOR UPDATE
USING (auth.uid() = auth_id);

-- 6) Allow authenticated users to create/read parties.
ALTER TABLE public.parties ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "parties_public_read" ON public.parties;
CREATE POLICY "parties_public_read"
ON public.parties
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "parties_insert_owner" ON public.parties;
CREATE POLICY "parties_insert_owner"
ON public.parties
FOR INSERT
WITH CHECK (
  host_id IN (
    SELECT uid FROM public.users WHERE auth_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "parties_update_owner" ON public.parties;
CREATE POLICY "parties_update_owner"
ON public.parties
FOR UPDATE
USING (
  host_id IN (
    SELECT uid FROM public.users WHERE auth_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "parties_delete_owner" ON public.parties;
CREATE POLICY "parties_delete_owner"
ON public.parties
FOR DELETE
USING (
  host_id IN (
    SELECT uid FROM public.users WHERE auth_id = auth.uid()
  )
);
