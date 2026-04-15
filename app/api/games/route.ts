import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: games, error } = await supabase
    .from("board_game_catalogue")
    .select("catalogue_id,game_name,category,cover_image_path")
    .order("game_name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Unable to load game catalogue." }, { status: 500 })
  }

  return NextResponse.json({
    games: (games ?? []).map((game) => ({
      id: String(game.catalogue_id),
      name: game.game_name,
      category: game.category ?? "Board Game",
      imagePath: game.cover_image_path ?? null,
      imageUrl: game.cover_image_path
        ? /^https?:\/\//i.test(game.cover_image_path)
          ? game.cover_image_path
          : supabase.storage
              .from("boardgame-covers")
              .getPublicUrl(game.cover_image_path).data.publicUrl
        : null,
    })),
  })
}
