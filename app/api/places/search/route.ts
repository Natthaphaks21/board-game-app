import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""
  const venueType = searchParams.get("venueType")?.trim() ?? undefined

  if (query.length < 3) {
    return NextResponse.json({ places: [] })
  }

  // Google Places is temporarily disabled.
  // Keep endpoint for compatibility with older clients.
  return NextResponse.json({
    places: [],
    message:
      "Google Maps search is temporarily disabled. Please type location manually.",
    query,
    venueType: venueType ?? null,
  })
}
