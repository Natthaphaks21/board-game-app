-- 008_membership_tier.sql
-- Add explicit package tier to members table.
-- This lets the app enforce borrow slots from DB package data.

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS tier VARCHAR(20);

ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

ALTER TABLE public.members
DROP CONSTRAINT IF EXISTS members_tier_check;

ALTER TABLE public.members
ADD CONSTRAINT members_tier_check
CHECK (tier IS NULL OR tier IN ('basic', 'pro', 'premium'));

CREATE INDEX IF NOT EXISTS idx_members_tier ON public.members(tier);
CREATE INDEX IF NOT EXISTS idx_members_subscription_expires_at ON public.members(subscription_expires_at);
