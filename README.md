# Boardgame App

Next.js + Supabase app with:
- Google OAuth first-time signup flow
- Email/password login after onboarding
- Thai ID checksum validation with privacy-safe storage (hash + last4 only)
- Party creation with Google Places public-location validation

## 1) Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

## 2) Required environment variables

Set these in `.env.local` and in Vercel Project Settings > Environment Variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_MAPS_API_KEY` (or `Maps_API_KEY`)
- `THAI_ID_HASH_SALT`
- `NEXT_PUBLIC_AUTH_REDIRECT_URL` (optional, set to your exact Vercel callback URL)

## 3) Supabase setup

Run SQL in Supabase SQL Editor:

1. `scripts/003_boardbuddies_supabase_schema.sql` (recommended full setup)
2. Or if you already have old tables, run `scripts/002_auth_privacy_backend.sql`
3. Then run `scripts/004_game_images_storage.sql` to add:
   - game image metadata columns
   - storage bucket + policies for cover images
   - update policy for borrow/return flow

Image storage best practice:
- Upload image files to Supabase Storage bucket: `boardgame-covers`
- Save only the file path in `board_game_catalogue.cover_image_path`
  (example: `covers/catan.jpg`)

## 4) Supabase Auth settings

In Supabase dashboard:
- Enable Google provider in Auth > Providers
- Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://<your-vercel-domain>/auth/callback`

## 5) Push to GitHub

```bash
git init
git checkout -b main
git add .
git commit -m "Prepare project for Vercel deployment"
# create empty repo in GitHub first, then:
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

## 6) Deploy on Vercel (GitHub)

1. Go to Vercel > Add New Project
2. Import your GitHub repository
3. Framework preset: Next.js
4. Add the environment variables above
5. Deploy
