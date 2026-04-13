import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ user: null })
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("uid,name,surname,username,google_auth_id,created_at")
    .eq("auth_id", user.id)
    .maybeSingle()

  if (profileError && profileError.code !== "PGRST116") {
    return NextResponse.json(
      { error: "Unable to load profile" },
      { status: 500 }
    )
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email ?? "",
      metadata: user.user_metadata ?? {},
    },
    profile: profile
      ? {
          uid: profile.uid,
          name: profile.name,
          surname: profile.surname,
          username: profile.username,
          googleAuthId: profile.google_auth_id,
          createdAt: profile.created_at,
        }
      : null,
  })
}
