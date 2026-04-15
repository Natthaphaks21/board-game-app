export type JoinStatus = "pending" | "accepted" | "rejected"

interface PartyRow {
  pid: number
  party_name: string
  location_data: unknown
  host_id: number | null
  appointment_time: string
  created_at: string | null
}

interface PartyJoinRow {
  party_id: number
  user_id: number
  status: JoinStatus
  request_time: string | null
  checked_in_at: string | null
  confirmed_arrival: boolean | null
}

interface UserRow {
  uid: number
  name: string
  surname: string
  username: string | null
}

interface ReliabilityRow {
  user_id: number
  reliability_score: number | null
}

export interface PartyListItem {
  id: string
  pid: number
  name: string
  appointmentTime: string
  date: string
  time: string
  host: {
    uid: number
    name: string
    username: string | null
    rating: number
  }
  location: string
  address: string
  locationData: Record<string, unknown>
  description: string
  tags: string[]
  games: string[]
  maxPlayers: number
  players: number
  joinStatus: JoinStatus | "none"
  hasArrived: boolean
  role: "host" | "player" | "guest"
}

export interface PartyDetailItem extends PartyListItem {
  members: Array<{
    uid: number
    name: string
    username: string | null
    role: "host" | "player"
    arrived: boolean
    joinedAt: string | null
  }>
  pendingRequests: Array<{
    userId: number
    name: string
    username: string | null
    requestedAt: string | null
  }>
}

function safeObject(input: unknown): Record<string, unknown> {
  if (!input) return {}

  if (typeof input === "object") {
    return input as Record<string, unknown>
  }

  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input)
      return typeof parsed === "object" && parsed !== null
        ? (parsed as Record<string, unknown>)
        : {}
    } catch {
      return {}
    }
  }

  return {}
}

function toStringArray(input: unknown): string[] {
  if (!Array.isArray(input)) return []
  return input
    .filter((value): value is string => typeof value === "string" && Boolean(value.trim()))
    .map((value) => value.trim())
}

function toNumber(input: unknown, fallback: number): number {
  if (typeof input === "number" && Number.isFinite(input)) return input
  if (typeof input === "string") {
    const parsed = Number(input)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function getDisplayName(user?: UserRow | null): string {
  if (!user) return "Unknown Host"
  if (user.username?.trim()) return user.username
  const fullName = `${user.name} ${user.surname}`.trim()
  return fullName || "Unknown Host"
}

function toDateParts(appointmentTime: string): { date: string; time: string } {
  const date = new Date(appointmentTime)
  if (Number.isNaN(date.getTime())) {
    return {
      date: appointmentTime,
      time: "",
    }
  }

  return {
    date: date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    time: date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
  }
}

async function loadUsersByIds(
  supabase: any,
  ids: number[]
): Promise<Map<number, UserRow>> {
  if (ids.length === 0) return new Map()

  const { data } = await supabase
    .from("users")
    .select("uid,name,surname,username")
    .in("uid", ids)

  const map = new Map<number, UserRow>()
  for (const row of (data ?? []) as UserRow[]) {
    map.set(row.uid, row)
  }

  return map
}

async function loadHostReliability(
  supabase: any,
  hostIds: number[]
): Promise<Map<number, number>> {
  if (hostIds.length === 0) return new Map()

  const { data } = await supabase
    .from("user_reliability_stats")
    .select("user_id,reliability_score")
    .in("user_id", hostIds)

  const map = new Map<number, number>()
  for (const row of (data ?? []) as ReliabilityRow[]) {
    if (typeof row.reliability_score === "number" && Number.isFinite(row.reliability_score)) {
      map.set(row.user_id, Math.max(0, Math.min(5, row.reliability_score / 20)))
    }
  }

  return map
}

async function loadJoinsByParty(
  supabase: any,
  partyIds: number[]
): Promise<Map<number, PartyJoinRow[]>> {
  if (partyIds.length === 0) return new Map()

  const { data } = await supabase
    .from("party_joins")
    .select("party_id,user_id,status,request_time,checked_in_at,confirmed_arrival")
    .in("party_id", partyIds)

  const joinsMap = new Map<number, PartyJoinRow[]>()

  for (const row of (data ?? []) as PartyJoinRow[]) {
    const rows = joinsMap.get(row.party_id) ?? []
    rows.push(row)
    joinsMap.set(row.party_id, rows)
  }

  return joinsMap
}

export async function getCurrentAppUserId(
  supabase: any,
  authId: string
): Promise<number | null> {
  const { data: appUser, error } = await supabase
    .from("users")
    .select("uid")
    .eq("auth_id", authId)
    .maybeSingle()

  if (error || !appUser?.uid) {
    return null
  }

  return appUser.uid
}

export async function mapPartiesToList(
  supabase: any,
  partyRows: PartyRow[],
  currentAppUserId: number | null
): Promise<PartyListItem[]> {
  if (partyRows.length === 0) return []

  const partyIds = partyRows.map((party) => party.pid)
  const hostIds = Array.from(
    new Set(
      partyRows
        .map((party) => party.host_id)
        .filter((hostId): hostId is number => typeof hostId === "number")
    )
  )

  const [joinsByParty, hostProfiles, reliabilityByHost] = await Promise.all([
    loadJoinsByParty(supabase, partyIds),
    loadUsersByIds(supabase, hostIds),
    loadHostReliability(supabase, hostIds),
  ])

  const mapped = partyRows.map((party) => {
    const joins = joinsByParty.get(party.pid) ?? []
    const acceptedJoins = joins.filter((join) => join.status === "accepted")

    const locationData = safeObject(party.location_data)
    const hostProfile = party.host_id ? hostProfiles.get(party.host_id) ?? null : null
    const displayName = getDisplayName(hostProfile)
    const hostRating = party.host_id ? reliabilityByHost.get(party.host_id) ?? 5 : 5

    const viewerJoin =
      typeof currentAppUserId === "number"
        ? joins.find((join) => join.user_id === currentAppUserId)
        : null

    const isHost = typeof currentAppUserId === "number" && currentAppUserId === party.host_id
    const joinStatus: JoinStatus | "none" = isHost
      ? "accepted"
      : viewerJoin?.status ?? "none"

    const role: "host" | "player" | "guest" = isHost
      ? "host"
      : joinStatus === "accepted"
        ? "player"
        : "guest"

    const { date, time } = toDateParts(party.appointment_time)
    const maxPlayers = toNumber(locationData.maxPlayers, 4)

    return {
      id: String(party.pid),
      pid: party.pid,
      name: party.party_name,
      appointmentTime: party.appointment_time,
      date,
      time,
      host: {
        uid: party.host_id ?? 0,
        name: displayName,
        username: hostProfile?.username ?? null,
        rating: Number(hostRating.toFixed(1)),
      },
      location:
        typeof locationData.displayName === "string"
          ? locationData.displayName
          : "Public Venue",
      address:
        typeof locationData.formattedAddress === "string"
          ? locationData.formattedAddress
          : "",
      locationData,
      description:
        typeof locationData.description === "string"
          ? locationData.description
          : "",
      tags: toStringArray(locationData.tags),
      games: toStringArray(locationData.selectedGames),
      maxPlayers,
      players: 1 + acceptedJoins.length,
      joinStatus,
      hasArrived: Boolean(viewerJoin?.confirmed_arrival || viewerJoin?.checked_in_at),
      role,
    } satisfies PartyListItem
  })

  return mapped
}

export async function mapPartyToDetail(
  supabase: any,
  party: PartyRow,
  currentAppUserId: number | null
): Promise<PartyDetailItem> {
  const list = await mapPartiesToList(supabase, [party], currentAppUserId)
  const base = list[0]

  const joins = await loadJoinsByParty(supabase, [party.pid])
  const joinRows = joins.get(party.pid) ?? []

  const memberIds = Array.from(
    new Set(
      [party.host_id, ...joinRows.map((join) => join.user_id)].filter(
        (id): id is number => typeof id === "number"
      )
    )
  )

  const userById = await loadUsersByIds(supabase, memberIds)

  const hostUser = typeof party.host_id === "number" ? userById.get(party.host_id) : null

  const members = [
    {
      uid: party.host_id ?? 0,
      name: getDisplayName(hostUser),
      username: hostUser?.username ?? null,
      role: "host" as const,
      arrived: true,
      joinedAt: party.created_at,
    },
    ...joinRows
      .filter((join) => join.status === "accepted")
      .map((join) => {
        const user = userById.get(join.user_id)
        return {
          uid: join.user_id,
          name: getDisplayName(user),
          username: user?.username ?? null,
          role: "player" as const,
          arrived: Boolean(join.confirmed_arrival || join.checked_in_at),
          joinedAt: join.request_time,
        }
      }),
  ]

  const pendingRequests = joinRows
    .filter((join) => join.status === "pending")
    .map((join) => {
      const user = userById.get(join.user_id)
      return {
        userId: join.user_id,
        name: getDisplayName(user),
        username: user?.username ?? null,
        requestedAt: join.request_time,
      }
    })

  return {
    ...base,
    members,
    pendingRequests,
  }
}

export function getPartyStatus(appointmentTime: string): "upcoming" | "ongoing" | "completed" {
  const now = Date.now()
  const start = new Date(appointmentTime).getTime()

  if (!Number.isFinite(start)) return "upcoming"

  if (start < now - 3 * 60 * 60 * 1000) {
    return "completed"
  }

  if (start <= now + 60 * 60 * 1000) {
    return "ongoing"
  }

  return "upcoming"
}
