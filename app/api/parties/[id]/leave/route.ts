import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentAppUserId,
  isPartyCancelled,
} from "@/lib/backend/party-data"

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
    return NextResponse.json({ error: "Profile not found." }, { status: 400 })
  }

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .select("pid,host_id,appointment_time,location_data")
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
      { error: "Host cannot leave the party. Please cancel it instead." },
      { status: 400 }
    )
  }

  const isCancelled = isPartyCancelled(party.location_data)
  const appointmentTs = new Date(party.appointment_time).getTime()
  const cutoffTs = appointmentTs - 30 * 60 * 1000

  if (!isCancelled && Date.now() >= cutoffTs) {
    return NextResponse.json(
      { error: "You can leave only up to 30 minutes before appointment time." },
      { status: 400 }
    )
  }

  const { data: join, error: joinError } = await supabase
    .from("party_joins")
    .select("party_id,user_id,status")
    .eq("party_id", partyId)
    .eq("user_id", currentAppUserId)
    .in("status", ["pending", "accepted"])
    .maybeSingle()

  if (joinError) {
    return NextResponse.json(
      { error: "Unable to verify join status." },
      { status: 500 }
    )
  }

  if (!join) {
    return NextResponse.json(
      { error: "You are not currently in this party." },
      { status: 400 }
    )
  }

  const { error: deleteError } = await supabase
    .from("party_joins")
    .delete()
    .eq("party_id", partyId)
    .eq("user_id", currentAppUserId)

  if (deleteError) {
    return NextResponse.json(
      { error: "Unable to leave party." },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    leftPartyId: partyId,
  })
}
