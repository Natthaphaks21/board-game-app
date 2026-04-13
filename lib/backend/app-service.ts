import crypto from "node:crypto"

export const PUBLIC_VENUE_TYPES = [
  "cafe",
  "restaurant",
  "food",
  "bar",
  "pub",
  "library",
  "community_center",
  "event_venue",
  "establishment",
  "point_of_interest",
] as const

const VENUE_TYPE_MAP: Record<string, string[]> = {
  cafe: ["cafe"],
  restaurant: ["restaurant", "food"],
  bar: ["bar", "pub"],
  library: ["library"],
  community: ["community_center", "event_venue"],
}

export interface PlaceSearchResult {
  placeId: string
  displayName: string
  formattedAddress: string
  latitude: number | null
  longitude: number | null
  types: string[]
  primaryType: string | null
  googleMapsUri: string | null
  isPublicVenue: boolean
}

export interface PlaceCandidate {
  placeId: string
  displayName: string
  formattedAddress: string
  types: string[]
  primaryType?: string | null
  latitude?: number | null
  longitude?: number | null
  googleMapsUri?: string | null
}

export function isThaiCitizenIdValid(id: string): boolean {
  if (!/^\d{13}$/.test(id)) return false

  let sum = 0
  for (let index = 0; index < 12; index += 1) {
    sum += Number(id[index]) * (13 - index)
  }

  const checkDigit = (11 - (sum % 11)) % 10
  return checkDigit === Number(id[12])
}

export function hashThaiCitizenId(rawThaiId: string): string {
  const salt = process.env.THAI_ID_HASH_SALT || "boardbuddies-default-salt"
  return crypto.createHash("sha256").update(`${salt}:${rawThaiId}`).digest("hex")
}

export function getThaiCitizenIdLast4(rawThaiId: string): string {
  return rawThaiId.slice(-4)
}

export function isPublicVenue(types: string[]): boolean {
  const normalizedTypes = types.map((type) => type.toLowerCase())
  return PUBLIC_VENUE_TYPES.some((type) => normalizedTypes.includes(type))
}

export function matchesVenueType(venueType: string | null, types: string[]): boolean {
  if (!venueType) return true

  const normalized = venueType.toLowerCase()
  const expectedTypes = VENUE_TYPE_MAP[normalized]
  if (!expectedTypes) return true

  const normalizedTypes = types.map((type) => type.toLowerCase())
  return expectedTypes.some((type) => normalizedTypes.includes(type))
}

export async function searchPublicPlaces(query: string, venueType?: string): Promise<PlaceSearchResult[]> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is missing")
  }

  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.types",
        "places.primaryType",
        "places.googleMapsUri",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: 10,
      languageCode: "en",
    }),
    cache: "no-store",
  })

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(`Google Places search failed: ${payload}`)
  }

  const payload = (await response.json()) as {
    places?: Array<{
      id?: string
      displayName?: { text?: string }
      formattedAddress?: string
      location?: { latitude?: number; longitude?: number }
      types?: string[]
      primaryType?: string
      googleMapsUri?: string
    }>
  }

  const results = (payload.places ?? []).map((place) => {
    const types = place.types ?? []

    return {
      placeId: place.id ?? "",
      displayName: place.displayName?.text ?? "Unknown place",
      formattedAddress: place.formattedAddress ?? "",
      latitude: typeof place.location?.latitude === "number" ? place.location.latitude : null,
      longitude: typeof place.location?.longitude === "number" ? place.location.longitude : null,
      types,
      primaryType: place.primaryType ?? null,
      googleMapsUri: place.googleMapsUri ?? null,
      isPublicVenue: isPublicVenue(types),
    } satisfies PlaceSearchResult
  })

  return results.filter(
    (result) =>
      result.placeId &&
      result.isPublicVenue &&
      matchesVenueType(venueType ?? null, result.types)
  )
}

export function normalizePlaceCandidate(place: PlaceCandidate): PlaceSearchResult {
  const types = place.types ?? []

  return {
    placeId: place.placeId,
    displayName: place.displayName,
    formattedAddress: place.formattedAddress,
    latitude: typeof place.latitude === "number" ? place.latitude : null,
    longitude: typeof place.longitude === "number" ? place.longitude : null,
    types,
    primaryType: place.primaryType ?? null,
    googleMapsUri: place.googleMapsUri ?? null,
    isPublicVenue: isPublicVenue(types),
  }
}

export async function getPlaceById(placeId: string): Promise<PlaceSearchResult | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) {
    throw new Error("GOOGLE_MAPS_API_KEY is missing")
  }

  const normalizedPlaceId = placeId.trim()
  if (!normalizedPlaceId) return null

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(normalizedPlaceId)}`,
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": [
          "id",
          "displayName",
          "formattedAddress",
          "location",
          "types",
          "primaryType",
          "googleMapsUri",
        ].join(","),
      },
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const payload = await response.text()
    throw new Error(`Google place lookup failed: ${payload}`)
  }

  const payload = (await response.json()) as {
    id?: string
    displayName?: { text?: string }
    formattedAddress?: string
    location?: { latitude?: number; longitude?: number }
    types?: string[]
    primaryType?: string
    googleMapsUri?: string
  }

  if (!payload.id) return null

  return normalizePlaceCandidate({
    placeId: payload.id,
    displayName: payload.displayName?.text ?? "Unknown place",
    formattedAddress: payload.formattedAddress ?? "",
    types: payload.types ?? [],
    primaryType: payload.primaryType ?? null,
    latitude:
      typeof payload.location?.latitude === "number"
        ? payload.location.latitude
        : null,
    longitude:
      typeof payload.location?.longitude === "number"
        ? payload.location.longitude
        : null,
    googleMapsUri: payload.googleMapsUri ?? null,
  })
}

export function combineDateAndTime(date: string, time: string): string {
  const iso = new Date(`${date}T${time}:00`)

  if (Number.isNaN(iso.getTime())) {
    throw new Error("Invalid appointment date/time")
  }

  return iso.toISOString()
}
