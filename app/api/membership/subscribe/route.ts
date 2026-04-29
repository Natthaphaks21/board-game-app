import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAppUserId } from "@/lib/backend/party-data"

type Plan = "basic" | "pro" | "premium"

function asPlan(input: unknown): Plan | null {
  if (input === "basic" || input === "pro" || input === "premium") return input
  if (input === "small") return "basic"
  if (input === "medium") return "pro"
  if (input === "large") return "premium"
  return null
}

function sanitize(value: string, max: number): string {
  return value.trim().slice(0, max)
}

async function ensureAppUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> }
): Promise<number | null> {
  const existing = await getCurrentAppUserId(supabase, user.id)
  if (existing) return existing

  const email = user.email ?? ""
  const emailName = email.split("@")[0] ?? "member"
  const rawGivenName =
    typeof user.user_metadata?.given_name === "string"
      ? user.user_metadata.given_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name.split(" ")[0]
        : "Member"
  const rawFamilyName =
    typeof user.user_metadata?.family_name === "string"
      ? user.user_metadata.family_name
      : "User"

  const username = sanitize(`${emailName}_${user.id.slice(0, 6)}`, 30)
  const name = sanitize(rawGivenName || "Member", 30)
  const surname = sanitize(rawFamilyName || "User", 30)

  const { data: inserted, error } = await supabase
    .from("users")
    .insert({
      auth_id: user.id,
      name,
      surname,
      username,
      google_auth_id: user.id,
      thai_citizen_id_hash: `demo_hash_${user.id}`,
      thai_citizen_id_last4: "0000",
    })
    .select("uid")
    .single()

  if (error || !inserted?.uid) {
    return null
  }

  return inserted.uid
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json().catch(() => null)) as { plan?: unknown } | null
  const plan = asPlan(payload?.plan)

  if (!plan) {
    return NextResponse.json({ error: "Invalid membership plan." }, { status: 400 })
  }

  const appUserId = await ensureAppUserProfile(supabase, user)
  if (!appUserId) {
    return NextResponse.json(
      { error: "Unable to activate membership. Please complete your profile first." },
      { status: 400 }
    )
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const expiresAtIso = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000
  ).toISOString()

  // Demo-safe membership write:
  // avoid `upsert` because it can require UPDATE policy when row already exists.
  // We only need to ensure a row exists.
  const { data: existingMember, error: memberLookupError } = await supabase
    .from("members")
    .select("vid")
    .eq("vid", appUserId)
    .maybeSingle()

  if (memberLookupError && memberLookupError.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Unable to activate membership." },
      { status: 400 }
    )
  }

  if (!existingMember?.vid) {
    const { error: memberInsertError } = await supabase.from("members").insert({
      vid: appUserId,
      subscription_date: nowIso,
    })

    if (memberInsertError) {
      return NextResponse.json(
        { error: "Unable to activate membership." },
        { status: 400 }
      )
    }
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      subscription_plan: plan,
      subscription_date: nowIso,
      subscription_expires_at: expiresAtIso,
    },
  })

  if (authError) {
    return NextResponse.json(
      { error: "Membership activated but metadata update failed." },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    plan,
    subscribedAt: nowIso,
    expiresAt: expiresAtIso,
  })
}
