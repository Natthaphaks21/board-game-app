import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAppUserId } from "@/lib/backend/party-data"

async function getMemberUid(
  supabase: Awaited<ReturnType<typeof createClient>>,
  authId: string
): Promise<number | null> {
  const appUserUid = await getCurrentAppUserId(supabase, authId)
  if (!appUserUid) return null

  const { data: member } = await supabase
    .from("members")
    .select("vid")
    .eq("vid", appUserUid)
    .maybeSingle()

  if (!member?.vid) return null
  return member.vid
}

export async function POST(
  _request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const params = await context.params
  const itemId = Number(params.itemId)

  if (!Number.isFinite(itemId)) {
    return NextResponse.json({ error: "Invalid game item id." }, { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const memberUid = await getMemberUid(supabase, user.id)

  if (!memberUid) {
    return NextResponse.json(
      { error: "Membership is required." },
      { status: 403 }
    )
  }

  const { data: updated, error: returnError } = await supabase
    .from("physical_board_games")
    .update({
      borrower_id: null,
      status: "available",
      last_updated: new Date().toISOString(),
    })
    .eq("item_id", itemId)
    .eq("borrower_id", memberUid)
    .eq("status", "lended")
    .select("item_id")
    .maybeSingle()

  if (returnError) {
    return NextResponse.json(
      { error: "Unable to return game." },
      { status: 400 }
    )
  }

  if (!updated) {
    return NextResponse.json(
      { error: "Game not found in your borrowed list." },
      { status: 404 }
    )
  }

  return NextResponse.json({ success: true })
}
