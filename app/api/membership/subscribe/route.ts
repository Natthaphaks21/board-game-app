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

  const appUserId = await getCurrentAppUserId(supabase, user.id)
  if (!appUserId) {
    return NextResponse.json(
      { error: "Please complete signup first." },
      { status: 400 }
    )
  }

  const now = new Date()
  const nowIso = now.toISOString()
  const expiresAtIso = new Date(
    now.getTime() + 30 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { error: memberError } = await supabase
    .from("members")
    .upsert(
      {
        vid: appUserId,
        subscription_date: nowIso,
      },
      { onConflict: "vid" }
    )

  if (memberError) {
    return NextResponse.json(
      { error: "Unable to activate membership." },
      { status: 400 }
    )
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
