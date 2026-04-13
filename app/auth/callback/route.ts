import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("uid")
        .eq("auth_id", user.id)
        .maybeSingle()

      if (profileError && profileError.code !== "PGRST116") {
        return NextResponse.redirect(`${origin}/auth/error`)
      }

      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      return NextResponse.redirect(
        `${origin}${profile?.uid ? "/home" : "/onboarding"}`
      )
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/error`)
}
