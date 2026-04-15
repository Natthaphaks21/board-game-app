import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAppUserId } from "@/lib/backend/party-data"

interface CheckInPayload {
  userId?: number
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  const partyId = Number(params.id)

  if (!Number.isFinite(partyId)) {
    return NextResponse.json({ error: "Invalid party id." }, { status: 400 })
  }

  const payload = (await request.json().catch(() => null)) as CheckInPayload | null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentAppUserId = await getCurrentAppUserId(supabase, user.id)

  if (!currentAppUserId) {
    return NextResponse.json({ error: "Profile not found." }, { status: 400 })
  }

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .select("host_id")
    .eq("pid", partyId)
    .maybeSingle()

  if (partyError) {
    return NextResponse.json({ error: "Unable to load party." }, { status: 500 })
  }

  if (!party) {
    return NextResponse.json({ error: "Party not found." }, { status: 404 })
  }

  const requestedUserId =
    typeof payload?.userId === "number" && Number.isFinite(payload.userId)
      ? payload.userId
      : currentAppUserId

  const isHost = party.host_id === currentAppUserId

  if (requestedUserId !== currentAppUserId && !isHost) {
    return NextResponse.json(
      { error: "Only host can confirm other members." },
      { status: 403 }
    )
  }

  if (requestedUserId === party.host_id) {
    return NextResponse.json({ success: true, role: "host" })
  }

  const nowIso = new Date().toISOString()

  const { data: updated, error: updateError } = await supabase
    .from("party_joins")
    .update({
      confirmed_arrival: true,
      checked_in_at: nowIso,
    })
    .eq("party_id", partyId)
    .eq("user_id", requestedUserId)
    .select("party_id,user_id,confirmed_arrival,checked_in_at")
    .maybeSingle()

  if (updateError) {
    return NextResponse.json(
      { error: "Unable to confirm arrival." },
      { status: 400 }
    )
  }

  if (!updated) {
    return NextResponse.json({ error: "Party member not found." }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    checkIn: updated,
  })
}
