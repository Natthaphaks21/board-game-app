# Backend Draft (Supabase, Places Fallback + Party Chat)

This UI is now wired to these Next.js backend endpoints:

- `POST /api/auth/complete-signup`
  - Input: `name`, `surname`, `username`, `password`, `thaiCitizenId`
  - Behavior: validates Thai ID, sets Supabase password, stores profile, stores only `thai_citizen_id_hash` + `thai_citizen_id_last4`

- `GET /api/auth/me`
  - Returns authenticated user + app profile row from `public.users`

- `PATCH /api/auth/profile`
  - Updates profile fields (`name`, `surname`, `username`) and optional auth metadata (`phone`, `address`, `dateOfBirth`)

- `GET /api/places/search?q=...&venueType=...`
  - Happy path: uses Google Places API and returns public venue suggestions
  - Fallback path: on API/key/quota errors, returns empty list with `fallbackManual: true`

- `POST /api/parties`
  - Input: party data + selected place (if available) or manual location text
  - Behavior: always stores normalized location metadata in `public.parties.location_data`

- `GET /api/parties/:id/chat`
  - Returns party chat messages for host + pending/accepted participants

- `POST /api/parties/:id/chat`
  - Sends a message into party chat

- `POST /api/parties/:id/cancel`
  - Host cancels the party (session is marked cancelled, pending requests are rejected)

- `POST /api/parties/:id/leave`
  - Participant leaves a party
  - Leave window: up to 30 minutes before appointment time (cancelled rooms can be left anytime)

- `POST /api/membership/subscribe`
  - Activates membership after PromptPay flow
  - Supported tiers: `Small(3)`, `Medium(5)`, `Large(8)` borrow slots

Main backend service helpers are in:
- `lib/backend/app-service.ts`

## SQL to run in Supabase
- Primary schema (full): `scripts/003_boardbuddies_supabase_schema.sql`
- Incremental migration (if you already have older tables): `scripts/002_auth_privacy_backend.sql`

## Required env vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `THAI_ID_HASH_SALT`

Optional for Google Places happy path (manual fallback still works):
- `GOOGLE_MAPS_API_KEY` (or `Maps_API_KEY`)

## Login flow implemented
1. First login must be Google OAuth.
2. User is redirected to `/onboarding`.
3. Onboarding submits name/surname/username/password/thai id.
4. Backend validates Thai ID and stores only hash + last4.
5. After completion, user can login by email + password.
