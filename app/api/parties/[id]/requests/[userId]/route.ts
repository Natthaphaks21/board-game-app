import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAppUserId, type JoinStatus } from "@/lib/backend/party-data"

interface StatusPayload {
  status?: JoinStatus
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; userId: string }> }
) {
  const params = await context.params
  const partyId = Number(params.id)
  const targetUserId = Number(params.userId)

  if (!Number.isFinite(partyId) || !Number.isFinite(targetUserId)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 })
  }

  const payload = (await request.json().catch(() => null)) as StatusPayload | null
  const status = payload?.status

  if (status !== "accepted" && status !== "rejected") {
    return NextResponse.json(
      { error: "Status must be accepted or rejected." },
      { status: 400 }
    )
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
    .select("host_id")
    .eq("pid", partyId)
    .maybeSingle()

  if (partyError) {
    return NextResponse.json({ error: "Unable to load party." }, { status: 500 })
  }

  if (!party) {
    return NextResponse.json({ error: "Party not found." }, { status: 404 })
  }

  if (party.host_id !== currentAppUserId) {
    return NextResponse.json({ error: "Only host can manage requests." }, { status: 403 })
  }

  const { data: updated, error: updateError } = await supabase
    .from("party_joins")
    .update({
      status,
      ...(status === "rejected"
        ? {
            confirmed_arrival: false,
            checked_in_at: null,
          }
        : {}),
    })
    .eq("party_id", partyId)
    .eq("user_id", targetUserId)
    .select("party_id,user_id,status")
    .maybeSingle()

  if (updateError) {
    return NextResponse.json(
      { error: "Unable to update join request." },
      { status: 400 }
    )
  }

  if (!updated) {
    return NextResponse.json({ error: "Join request not found." }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    request: updated,
  })
}
