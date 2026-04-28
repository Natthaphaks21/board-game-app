import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getPartyStatus,
  getCurrentAppUserId,
  mapPartiesToList,
} from "@/lib/backend/party-data"

interface PartyRow {
  pid: number
  party_name: string
  location_data: unknown
  host_id: number | null
  appointment_time: string
  created_at: string | null
}

interface SelfJoinRow {
  party_id: number
  status: "pending" | "accepted" | "rejected"
  confirmed_arrival: boolean | null
  checked_in_at: string | null
}

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentAppUserId = await getCurrentAppUserId(supabase, user.id)

  if (!currentAppUserId) {
    return NextResponse.json({ parties: [] })
  }

  const { data: hostedPast, error: hostedPastError } = await supabase
    .from("parties")
    .select("pid,party_name,location_data,host_id,appointment_time,created_at")
    .eq("host_id", currentAppUserId)

  if (hostedPastError) {
    return NextResponse.json(
      { error: "Unable to load hosted party history." },
      { status: 500 }
    )
  }

  const { data: selfPastJoins, error: selfPastJoinsError } = await supabase
    .from("party_joins")
    .select("party_id,status,confirmed_arrival,checked_in_at")
    .eq("user_id", currentAppUserId)
    .in("status", ["accepted", "rejected"])

  if (selfPastJoinsError) {
    return NextResponse.json(
      { error: "Unable to load joined party history." },
      { status: 500 }
    )
  }

  const hostedIds = new Set<number>((hostedPast ?? []).map((party) => party.pid))
  const joinedPartyIds = Array.from(
    new Set(
      ((selfPastJoins ?? []) as SelfJoinRow[])
        .map((join) => join.party_id)
        .filter((id) => !hostedIds.has(id))
    )
  )

  let joinedRows: PartyRow[] = []
  if (joinedPartyIds.length > 0) {
    const { data, error } = await supabase
      .from("parties")
      .select("pid,party_name,location_data,host_id,appointment_time,created_at")
      .in("pid", joinedPartyIds)

    if (error) {
      return NextResponse.json(
        { error: "Unable to load party history details." },
        { status: 500 }
      )
    }

    joinedRows = (data ?? []) as PartyRow[]
  }

  const allRows = [
    ...((hostedPast ?? []) as PartyRow[]),
    ...joinedRows,
  ]

  const partyList = await mapPartiesToList(supabase, allRows, currentAppUserId)

  const joinMap = new Map<number, SelfJoinRow>()
  for (const join of (selfPastJoins ?? []) as SelfJoinRow[]) {
    joinMap.set(join.party_id, join)
  }

  const history = partyList
    .map((party) => {
      const selfJoin = joinMap.get(party.pid)
      const isHost = party.role === "host"
      const status = getPartyStatus(party.appointmentTime, party.locationData)

      return {
        ...party,
        status,
        role: isHost ? "host" : "player",
        arrived: status === "cancelled"
          ? false
          : isHost
          ? true
          : Boolean(selfJoin?.confirmed_arrival || selfJoin?.checked_in_at),
        joinStatus: selfJoin?.status ?? party.joinStatus,
      }
    })
    .filter((party) => party.status === "completed" || party.status === "cancelled")
    .sort(
      (a, b) =>
        new Date(b.appointmentTime).getTime() -
        new Date(a.appointmentTime).getTime()
    )

  return NextResponse.json({
    parties: history,
  })
}
