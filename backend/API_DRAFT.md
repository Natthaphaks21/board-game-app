# Backend Draft (Supabase + Google Places)

This UI is now wired to these Next.js backend endpoints:

- `POST /api/auth/complete-signup`
  - Input: `name`, `surname`, `username`, `password`, `thaiCitizenId`
  - Behavior: validates Thai ID, sets Supabase password, stores profile, stores only `thai_citizen_id_hash` + `thai_citizen_id_last4`

- `GET /api/auth/me`
  - Returns authenticated user + app profile row from `public.users`

- `PATCH /api/auth/profile`
  - Updates profile fields (`name`, `surname`, `username`) and optional auth metadata (`phone`, `address`, `dateOfBirth`)

- `GET /api/places/search?q=...&venueType=...`
  - Uses Google Places API and returns only public venues

- `POST /api/parties`
  - Input: party data + selected Google place
  - Behavior: re-validates place from Google by `placeId`, enforces public venue, inserts into `public.parties`

Main backend service helpers are in:
- `lib/backend/app-service.ts`

## SQL to run in Supabase
- Primary schema (full): `scripts/003_boardbuddies_supabase_schema.sql`
- Incremental migration (if you already have older tables): `scripts/002_auth_privacy_backend.sql`

## Required env vars
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_MAPS_API_KEY`
- `THAI_ID_HASH_SALT`

## Login flow implemented
1. First login must be Google OAuth.
2. User is redirected to `/onboarding`.
3. Onboarding submits name/surname/username/password/thai id.
4. Backend validates Thai ID and stores only hash + last4.
5. After completion, user can login by email + password.
