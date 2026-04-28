import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  combineDateAndTime,
} from "@/lib/backend/app-service"
import {
  getCurrentAppUserId,
  mapPartiesToList,
} from "@/lib/backend/party-data"

interface CreatePartyPayload {
  partyName?: string
  description?: string
  tags?: string[]
  venueType?: string
  date?: string
  time?: string
  maxPlayers?: number
  selectedGames?: string[]
  locationName?: string
  locationAddress?: string
}

interface PartyRow {
  pid: number
  party_name: string
  location_data: unknown
  host_id: number | null
  appointment_time: string
  created_at: string | null
}

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const currentAppUserId = await getCurrentAppUserId(supabase, user.id)

  const { searchParams } = new URL(request.url)
  const includePast = searchParams.get("includePast") === "true"
  const requestedLimit = Number(searchParams.get("limit") ?? 20)
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(Math.floor(requestedLimit), 1), 100)
    : 20

  let query = supabase
    .from("parties")
    .select("pid,party_name,location_data,host_id,appointment_time,created_at")
    .order("appointment_time", { ascending: true })
    .limit(limit)

  if (!includePast) {
    const lowerBound = new Date().toISOString()
    query = query.gte("appointment_time", lowerBound)
  }

  const { data: partyRows, error: partiesError } = await query

  if (partiesError) {
    return NextResponse.json(
      { error: "Unable to load parties." },
      { status: 500 }
    )
  }

  const mappedParties = await mapPartiesToList(
    supabase,
    (partyRows ?? []) as PartyRow[],
    currentAppUserId
  )

  return NextResponse.json({
    parties: mappedParties,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = (await request.json()) as CreatePartyPayload

  if (!payload.partyName || payload.partyName.trim().length < 3) {
    return NextResponse.json(
      { error: "Party name must be at least 3 characters." },
      { status: 400 }
    )
  }

  if (!payload.locationAddress || payload.locationAddress.trim().length < 3) {
    return NextResponse.json(
      { error: "Please enter the party location address." },
      { status: 400 }
    )
  }

  if (!payload.date || !payload.time) {
    return NextResponse.json(
      { error: "Date and time are required." },
      { status: 400 }
    )
  }

  let appointmentTime = ""
  try {
    appointmentTime = combineDateAndTime(payload.date, payload.time)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid appointment date/time",
      },
      { status: 400 }
    )
  }

  const currentAppUserId = await getCurrentAppUserId(supabase, user.id)

  if (!currentAppUserId) {
    return NextResponse.json(
      { error: "Please complete signup before creating a party." },
      { status: 400 }
    )
  }

  const normalizedAddress = payload.locationAddress.trim()
  const normalizedLocationName =
    payload.locationName?.trim() || normalizedAddress

  const locationData = {
    placeId: null,
    displayName: normalizedLocationName,
    formattedAddress: normalizedAddress,
    latitude: null,
    longitude: null,
    primaryType: payload.venueType ?? null,
    types: payload.venueType ? [payload.venueType] : [],
    googleMapsUri: null,
    isPublicVenue: true,
    isManuallyEntered: true,
    venueType: payload.venueType ?? null,
    description: payload.description ?? "",
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    selectedGames: Array.isArray(payload.selectedGames)
      ? payload.selectedGames
      : [],
    maxPlayers: payload.maxPlayers ?? 4,
  }

  const { data: insertedParty, error: partyError } = await supabase
    .from("parties")
    .insert({
      party_name: payload.partyName.trim(),
      location_data: locationData,
      host_id: currentAppUserId,
      appointment_time: appointmentTime,
    })
    .select("pid,party_name,appointment_time")
    .single()

  if (partyError) {
    return NextResponse.json(
      { error: "Unable to create party." },
      { status: 400 }
    )
  }

  return NextResponse.json({
    success: true,
    party: insertedParty,
  })
}
