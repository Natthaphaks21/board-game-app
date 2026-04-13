-- Drop thai_citizen_id column from users table
ALTER TABLE users DROP COLUMN IF EXISTS thai_citizen_id;

-- Add auth_id column to link with Supabase auth
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parties ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_game_cafes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE arrival_confirmations ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = auth_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON users;
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Parties policies (public read, owner write)
DROP POLICY IF EXISTS "Anyone can view parties" ON parties;
CREATE POLICY "Anyone can view parties" ON parties FOR SELECT USING (true);

DROP POLICY IF EXISTS "Host can update party" ON parties;
CREATE POLICY "Host can update party" ON parties FOR UPDATE USING (
  host_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Host can delete party" ON parties;
CREATE POLICY "Host can delete party" ON parties FOR DELETE USING (
  host_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create parties" ON parties;
CREATE POLICY "Users can create parties" ON parties FOR INSERT WITH CHECK (
  host_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Party members policies
DROP POLICY IF EXISTS "Anyone can view party members" ON party_members;
CREATE POLICY "Anyone can view party members" ON party_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can join parties" ON party_members;
CREATE POLICY "Users can join parties" ON party_members FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can leave parties" ON party_members;
CREATE POLICY "Users can leave parties" ON party_members FOR DELETE USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Party tags policies (public read)
DROP POLICY IF EXISTS "Anyone can view party tags" ON party_tags;
CREATE POLICY "Anyone can view party tags" ON party_tags FOR SELECT USING (true);

-- Board game cafes policies (public read)
DROP POLICY IF EXISTS "Anyone can view cafes" ON board_game_cafes;
CREATE POLICY "Anyone can view cafes" ON board_game_cafes FOR SELECT USING (true);

-- Subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON subscriptions;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can create subscriptions" ON subscriptions;
CREATE POLICY "Users can create subscriptions" ON subscriptions FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Party history policies
DROP POLICY IF EXISTS "Users can view own history" ON party_history;
CREATE POLICY "Users can view own history" ON party_history FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

-- Arrival confirmations policies
DROP POLICY IF EXISTS "Party members can view confirmations" ON arrival_confirmations;
CREATE POLICY "Party members can view confirmations" ON arrival_confirmations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can confirm arrival" ON arrival_confirmations;
CREATE POLICY "Users can confirm arrival" ON arrival_confirmations FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "Host can update confirmations" ON arrival_confirmations;
CREATE POLICY "Host can update confirmations" ON arrival_confirmations FOR UPDATE USING (
  party_id IN (
    SELECT id FROM parties WHERE host_id IN (SELECT id FROM users WHERE auth_id = auth.uid())
  )
);
