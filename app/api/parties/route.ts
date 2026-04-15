import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  combineDateAndTime,
  getPlaceById,
  matchesVenueType,
  type PlaceCandidate,
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
  place?: PlaceCandidate
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
    const lowerBound = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
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

  if (!payload.place?.placeId) {
    return NextResponse.json(
      { error: "Please select a place from Google Maps results." },
      { status: 400 }
    )
  }

  if (!payload.date || !payload.time) {
    return NextResponse.json(
      { error: "Date and time are required." },
      { status: 400 }
    )
  }

  let place = null
  try {
    place = await getPlaceById(payload.place.placeId)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to validate selected place.",
      },
      { status: 400 }
    )
  }

  if (!place) {
    return NextResponse.json(
      { error: "Selected place is invalid." },
      { status: 400 }
    )
  }

  if (!place.isPublicVenue) {
    return NextResponse.json(
      { error: "Selected place is not a public venue." },
      { status: 400 }
    )
  }

  if (!matchesVenueType(payload.venueType ?? null, place.types)) {
    return NextResponse.json(
      { error: "Selected place does not match selected venue type." },
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

  const locationData = {
    placeId: place.placeId,
    displayName: place.displayName,
    formattedAddress: place.formattedAddress,
    latitude: place.latitude,
    longitude: place.longitude,
    primaryType: place.primaryType,
    types: place.types,
    googleMapsUri: place.googleMapsUri,
    isPublicVenue: place.isPublicVenue,
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
