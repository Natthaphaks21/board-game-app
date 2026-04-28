import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentAppUserId,
  isPartyCancelled,
} from "@/lib/backend/party-data"

function asObject(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== "object") return {}
  return input as Record<string, unknown>
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
    return NextResponse.json({ error: "Profile not found." }, { status: 400 })
  }

  const { data: party, error: partyError } = await supabase
    .from("parties")
    .select("pid,host_id,location_data")
    .eq("pid", partyId)
    .maybeSingle()

  if (partyError) {
    return NextResponse.json({ error: "Unable to load party." }, { status: 500 })
  }

  if (!party) {
    return NextResponse.json({ error: "Party not found." }, { status: 404 })
  }

  if (party.host_id !== currentAppUserId) {
    return NextResponse.json(
      { error: "Only the host can cancel this party." },
      { status: 403 }
    )
  }

  if (isPartyCancelled(party.location_data)) {
    return NextResponse.json({ success: true, alreadyCancelled: true })
  }

  const nowIso = new Date().toISOString()
  const locationData = asObject(party.location_data)
  const cancelledLocationData = {
    ...locationData,
    cancelledAt: nowIso,
    cancelledBy: currentAppUserId,
    cancelReason: "Cancelled by host",
  }

  const { error: updateError } = await supabase
    .from("parties")
    .update({
      location_data: cancelledLocationData,
    })
    .eq("pid", partyId)

  if (updateError) {
    return NextResponse.json(
      { error: "Unable to cancel party." },
      { status: 400 }
    )
  }

  await supabase
    .from("party_joins")
    .update({ status: "rejected" })
    .eq("party_id", partyId)
    .eq("status", "pending")

  return NextResponse.json({
    success: true,
    cancelledAt: nowIso,
  })
}
