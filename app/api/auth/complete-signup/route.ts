import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getThaiCitizenIdLast4,
  hashThaiCitizenId,
  isThaiCitizenIdValid,
} from "@/lib/backend/app-service"

interface SignupPayload {
  name?: string
  surname?: string
  username?: string
  password?: string
  thaiCitizenId?: string
}

function clean(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, maxLength)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const providers = Array.isArray(user.app_metadata?.providers)
    ? (user.app_metadata.providers as string[])
    : []
  const primaryProvider =
    typeof user.app_metadata?.provider === "string"
      ? user.app_metadata.provider
      : null

  if (primaryProvider !== "google" && !providers.includes("google")) {
    return NextResponse.json(
      { error: "First-time signup must come from Google OAuth login." },
      { status: 400 }
    )
  }

  const payload = (await request.json()) as SignupPayload
  const name = clean(payload.name, 30)
  const surname = clean(payload.surname, 30)
  const username = clean(payload.username, 30)
  const password = clean(payload.password, 72)
  const thaiCitizenId = clean(payload.thaiCitizenId, 13).replace(/\D/g, "")

  if (!name || !surname || username.length < 3) {
    return NextResponse.json(
      { error: "Name, surname, and username are required." },
      { status: 400 }
    )
  }

  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    )
  }

  if (!isThaiCitizenIdValid(thaiCitizenId)) {
    return NextResponse.json(
      { error: "Invalid Thai citizen ID." },
      { status: 400 }
    )
  }

  const { data: existingProfile, error: existingError } = await supabase
    .from("users")
    .select("uid")
    .eq("auth_id", user.id)
    .maybeSingle()

  if (existingError && existingError.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Unable to validate current profile." },
      { status: 500 }
    )
  }

  if (existingProfile?.uid) {
    return NextResponse.json(
      { error: "Profile has already been completed." },
      { status: 409 }
    )
  }

  const { error: passwordError } = await supabase.auth.updateUser({ password })
  if (passwordError) {
    return NextResponse.json(
      { error: "Unable to set password." },
      { status: 400 }
    )
  }

  const googleIdentity = user.identities?.find(
    (identity) => identity.provider === "google"
  )
  const thaiCitizenIdHash = hashThaiCitizenId(thaiCitizenId)
  const thaiCitizenIdLast4 = getThaiCitizenIdLast4(thaiCitizenId)

  const { data: profile, error: insertError } = await supabase
    .from("users")
    .insert({
      auth_id: user.id,
      name,
      surname,
      username,
      google_auth_id: googleIdentity?.id ?? user.id,
      thai_citizen_id_hash: thaiCitizenIdHash,
      thai_citizen_id_last4: thaiCitizenIdLast4,
    })
    .select("uid,name,surname,username,created_at")
    .single()

  if (insertError) {
    return NextResponse.json(
      { error: "Unable to create profile. Please check if username is already used." },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    profile,
  })
}
