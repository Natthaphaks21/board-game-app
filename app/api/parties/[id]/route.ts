import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentAppUserId,
  getPartyStatus,
  mapPartyToDetail,
} from "@/lib/backend/party-data"

interface PartyRow {
  pid: number
  party_name: string
  location_data: unknown
  host_id: number | null
  appointment_time: string
  created_at: string | null
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

  const { data: partyRow, error: partyError } = await supabase
    .from("parties")
    .select("pid,party_name,location_data,host_id,appointment_time,created_at")
    .eq("pid", partyId)
    .maybeSingle()

  if (partyError) {
    return NextResponse.json(
      { error: "Unable to load party." },
      { status: 500 }
    )
  }

  if (!partyRow) {
    return NextResponse.json({ error: "Party not found." }, { status: 404 })
  }

  const detail = await mapPartyToDetail(
    supabase,
    partyRow as PartyRow,
    currentAppUserId
  )

  const status = getPartyStatus(detail.appointmentTime)
  const isHost =
    typeof currentAppUserId === "number" &&
    currentAppUserId === (partyRow.host_id ?? -1)

  return NextResponse.json({
    party: {
      ...detail,
      status,
      isHost,
      pendingRequests: isHost ? detail.pendingRequests : [],
    },
  })
}
