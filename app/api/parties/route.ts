import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  combineDateAndTime,
  getPlaceById,
  matchesVenueType,
  type PlaceCandidate
} from "@/lib/backend/app-service"

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

  const { data: appUser, error: appUserError } = await supabase
    .from("users")
    .select("uid")
    .eq("auth_id", user.id)
    .maybeSingle()

  if (appUserError || !appUser?.uid) {
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
      host_id: appUser.uid,
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
