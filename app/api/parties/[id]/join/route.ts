import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAppUserId } from "@/lib/backend/party-data"

interface JoinRow {
  status: "pending" | "accepted" | "rejected"
  confirmed_arrival: boolean | null
  checked_in_at: string | null
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const partyId = Number(params.id)

  if (!Number.isFinite(partyId)) {
    return NextResponse.json({ error: "Invalid party id." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentAppUserId = await getCurrentAppUserId(supabase, user.id)
  if (!currentAppUserId) {
    return NextResponse.json({ status: "none", hasArrived: false })
  }

  const { data: party } = await supabase
    .from("parties")
    .select("host_id")
    .eq("pid", partyId)
    .maybeSingle()

  if (!party) {
    return NextResponse.json({ error: "Party not found." }, { status: 404 })
  }

  if (party.host_id === currentAppUserId) {
    return NextResponse.json({ status: "accepted", hasArrived: true, role: "host" })
  }

  const { data: join } = await supabase
    .from("party_joins")
    .select("status,confirmed_arrival,checked_in_at")
    .eq("party_id", partyId)
    .eq("user_id", currentAppUserId)
    .maybeSingle()

  const typedJoin = (join ?? null) as JoinRow | null

  return NextResponse.json({
    status: typedJoin?.status ?? "none",
    hasArrived: Boolean(typedJoin?.confirmed_arrival || typedJoin?.checked_in_at),
    role: "player",
  })
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const partyId = Number(params.id)

  if (!Number.isFinite(partyId)) {
    return NextResponse.json({ error: "Invalid party id." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentAppUserId = await getCurrentAppUserId(supabase, user.id)
  if (!currentAppUserId) {
    return NextResponse.json(
      { error: "Please complete signup before joining parties." },
      { status: 400 }
    )
  }

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .select("pid,host_id,appointment_time")
    .eq("pid", partyId)
    .maybeSingle()

  if (partyError) {
    return NextResponse.json({ error: "Unable to load party." }, { status: 500 })
  }

  if (!party) {
    return NextResponse.json({ error: "Party not found." }, { status: 404 })
  }

  if (party.host_id === currentAppUserId) {
    return NextResponse.json(
      { error: "You are already the host of this party." },
      { status: 400 }
    )
  }

  if (new Date(party.appointment_time).getTime() < Date.now() - 60 * 60 * 1000) {
    return NextResponse.json(
      { error: "This party has already started." },
      { status: 400 }
    )
  }

  const nowIso = new Date().toISOString()

  const { error: upsertError } = await supabase.from("party_joins").upsert(
    {
      party_id: partyId,
      user_id: currentAppUserId,
      status: "pending",
      request_time: nowIso,
      confirmed_arrival: false,
      checked_in_at: null,
    },
    {
      onConflict: "party_id,user_id",
    }
  )

  if (upsertError) {
    return NextResponse.json(
      { error: "Unable to send join request." },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    status: "pending",
  })
}
