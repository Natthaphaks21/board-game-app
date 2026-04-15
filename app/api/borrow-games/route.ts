import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getCurrentAppUserId } from "@/lib/backend/party-data"

interface CatalogueRow {
  catalogue_id: number
  game_name: string
  category: string | null
  cover_image_path: string | null
}

interface PhysicalGameRow {
  item_id: number
  catalogue_id: number | null
  borrower_id: number | null
  status: string | null
  last_updated: string | null
  board_game_catalogue: CatalogueRow | CatalogueRow[] | null
}

function asCatalogue(row: PhysicalGameRow): CatalogueRow | null {
  if (!row.board_game_catalogue) return null
  if (Array.isArray(row.board_game_catalogue)) {
    return row.board_game_catalogue[0] ?? null
  }
  return row.board_game_catalogue
}

function resolveCoverUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  path: string | null
): string | null {
  if (!path) return null

  if (/^https?:\/\//i.test(path)) {
    return path
  }

  const { data } = supabase.storage.from("boardgame-covers").getPublicUrl(path)
  return data.publicUrl || null
}

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

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const memberUid = await getMemberUid(supabase, user.id)

  const { data: physicalRows, error } = await supabase
    .from("physical_board_games")
    .select(
      "item_id,catalogue_id,borrower_id,status,last_updated,board_game_catalogue(catalogue_id,game_name,category,cover_image_path)"
    )
    .order("item_id", { ascending: true })

  if (error) {
    return NextResponse.json(
      { error: "Unable to load game inventory." },
      { status: 500 }
    )
  }

  const rows = (physicalRows ?? []) as PhysicalGameRow[]

  const availableGames = rows
    .filter((row) => row.status === "available")
    .map((row) => {
      const catalogue = asCatalogue(row)
      return {
        itemId: String(row.item_id),
        catalogueId: catalogue?.catalogue_id ? String(catalogue.catalogue_id) : null,
        name: catalogue?.game_name ?? "Unknown Game",
        category: catalogue?.category ?? "Board Game",
        imagePath: catalogue?.cover_image_path ?? null,
        imageUrl: resolveCoverUrl(supabase, catalogue?.cover_image_path ?? null),
        available: true,
      }
    })

  const borrowedGames = memberUid
    ? rows
        .filter(
          (row) => row.status === "lended" && row.borrower_id === memberUid
        )
        .map((row) => {
          const catalogue = asCatalogue(row)
          const borrowedAtIso = row.last_updated ?? new Date().toISOString()
          const borrowedAt = new Date(borrowedAtIso)
          const due = new Date(borrowedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

          return {
            itemId: String(row.item_id),
            catalogueId: catalogue?.catalogue_id
              ? String(catalogue.catalogue_id)
              : null,
            name: catalogue?.game_name ?? "Unknown Game",
            category: catalogue?.category ?? "Board Game",
            imagePath: catalogue?.cover_image_path ?? null,
            imageUrl: resolveCoverUrl(supabase, catalogue?.cover_image_path ?? null),
            borrowedAt: borrowedAtIso,
            borrowedDate: borrowedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
            dueDate: due.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            }),
          }
        })
    : []

  return NextResponse.json({
    isMember: Boolean(memberUid),
    borrowedGames,
    availableGames,
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

  const memberUid = await getMemberUid(supabase, user.id)

  if (!memberUid) {
    return NextResponse.json(
      { error: "Membership is required before borrowing games." },
      { status: 403 }
    )
  }

  const payload = (await request.json().catch(() => null)) as
    | { itemId?: string }
    | null

  const itemId = Number(payload?.itemId)
  if (!Number.isFinite(itemId)) {
    return NextResponse.json({ error: "Invalid game item id." }, { status: 400 })
  }

  const { data: currentlyBorrowed } = await supabase
    .from("physical_board_games")
    .select("item_id", { count: "exact", head: false })
    .eq("borrower_id", memberUid)
    .eq("status", "lended")

  if ((currentlyBorrowed ?? []).length >= 12) {
    return NextResponse.json(
      { error: "Borrowing limit reached. Please return a game first." },
      { status: 400 }
    )
  }

  const nowIso = new Date().toISOString()

  const { data: updated, error: borrowError } = await supabase
    .from("physical_board_games")
    .update({
      borrower_id: memberUid,
      status: "lended",
      last_updated: nowIso,
    })
    .eq("item_id", itemId)
    .eq("status", "available")
    .is("borrower_id", null)
    .select("item_id")
    .maybeSingle()

  if (borrowError) {
    return NextResponse.json(
      { error: "Unable to borrow game." },
      { status: 400 }
    )
  }

  if (!updated) {
    return NextResponse.json(
      { error: "This game is no longer available." },
      { status: 409 }
    )
  }

  return NextResponse.json({ success: true })
}
