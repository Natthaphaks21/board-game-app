import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  getCurrentAppUserId,
  getPartyStatus,
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
}

interface PendingJoinRow {
  party_id: number
  user_id: number
  request_time: string | null
}

interface UserRow {
  uid: number
  name: string
  surname: string
  username: string | null
}

function displayName(user?: UserRow): string {
  if (!user) return "Player"
  if (user.username?.trim()) return user.username
  return `${user.name} ${user.surname}`.trim() || "Player"
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
    return NextResponse.json(
      { error: "Please complete signup before using parties." },
      { status: 400 }
    )
  }

  const { data: hostedRows, error: hostedError } = await supabase
    .from("parties")
    .select("pid,party_name,location_data,host_id,appointment_time,created_at")
    .eq("host_id", currentAppUserId)

  if (hostedError) {
    return NextResponse.json(
      { error: "Unable to load hosted parties." },
      { status: 500 }
    )
  }

  const { data: selfJoins, error: selfJoinsError } = await supabase
    .from("party_joins")
    .select("party_id,status")
    .eq("user_id", currentAppUserId)
    .in("status", ["pending", "accepted"])

  if (selfJoinsError) {
    return NextResponse.json(
      { error: "Unable to load joined parties." },
      { status: 500 }
    )
  }

  const hostedPartyIds = new Set<number>((hostedRows ?? []).map((party) => party.pid))
  const joinedPartyIds = Array.from(
    new Set(
      ((selfJoins ?? []) as SelfJoinRow[])
        .map((join) => join.party_id)
        .filter((partyId) => !hostedPartyIds.has(partyId))
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
        { error: "Unable to load joined party details." },
        { status: 500 }
      )
    }

    joinedRows = (data ?? []) as PartyRow[]
  }

  const allRowsMap = new Map<number, PartyRow>()
  for (const row of (hostedRows ?? []) as PartyRow[]) {
    allRowsMap.set(row.pid, row)
  }
  for (const row of joinedRows) {
    allRowsMap.set(row.pid, row)
  }

  const allRows = Array.from(allRowsMap.values())
  const mappedParties = await mapPartiesToList(supabase, allRows, currentAppUserId)

  const parties = mappedParties
    .map((party) => ({
      ...party,
      status: getPartyStatus(party.appointmentTime),
      role: party.role,
    }))
    .filter((party) => party.status !== "completed")
    .sort(
      (a, b) =>
        new Date(a.appointmentTime).getTime() -
        new Date(b.appointmentTime).getTime()
    )

  const hostedIds = (hostedRows ?? []).map((party) => party.pid)

  let requests: Array<{
    id: string
    partyId: string
    partyName: string
    requestedAt: string | null
    userId: number
    user: {
      name: string
      username: string | null
    }
  }> = []

  if (hostedIds.length > 0) {
    const { data: pendingRows, error: pendingError } = await supabase
      .from("party_joins")
      .select("party_id,user_id,request_time")
      .in("party_id", hostedIds)
      .eq("status", "pending")

    if (!pendingError && pendingRows && pendingRows.length > 0) {
      const userIds = Array.from(
        new Set((pendingRows as PendingJoinRow[]).map((row) => row.user_id))
      )

      const { data: users } = await supabase
        .from("users")
        .select("uid,name,surname,username")
        .in("uid", userIds)

      const usersById = new Map<number, UserRow>()
      for (const row of (users ?? []) as UserRow[]) {
        usersById.set(row.uid, row)
      }

      const partyNames = new Map<number, string>()
      for (const row of (hostedRows ?? []) as PartyRow[]) {
        partyNames.set(row.pid, row.party_name)
      }

      requests = (pendingRows as PendingJoinRow[]).map((row) => {
        const userInfo = usersById.get(row.user_id)
        return {
          id: `${row.party_id}:${row.user_id}`,
          partyId: String(row.party_id),
          partyName: partyNames.get(row.party_id) ?? "Party",
          requestedAt: row.request_time,
          userId: row.user_id,
          user: {
            name: displayName(userInfo),
            username: userInfo?.username ?? null,
          },
        }
      })
    }
  }

  return NextResponse.json({
    parties,
    requests,
  })
}
