import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { searchPublicPlaces } from "@/lib/backend/app-service"

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

  try {
    const places = await searchPublicPlaces(query, venueType)
    return NextResponse.json({ places })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to search places",
      },
      { status: 500 }
    )
  }
}
