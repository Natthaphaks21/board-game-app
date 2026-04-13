import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next")
  const oauthError = searchParams.get("error")
  const oauthErrorDescription = searchParams.get("error_description")

  if (oauthError) {
    const errorUrl = new URL("/auth/error", origin)
    errorUrl.searchParams.set("error", oauthError)
    if (oauthErrorDescription) {
      errorUrl.searchParams.set("error_description", oauthErrorDescription)
    }
    return NextResponse.redirect(errorUrl.toString())
  }

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
        const errorUrl = new URL("/auth/error", origin)
        errorUrl.searchParams.set("error", "profile_lookup_failed")
        errorUrl.searchParams.set("error_description", profileError.message)
        return NextResponse.redirect(errorUrl.toString())
      }

      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      return NextResponse.redirect(
        `${origin}${profile?.uid ? "/home" : "/onboarding"}`
      )
    }

    const errorUrl = new URL("/auth/error", origin)
    errorUrl.searchParams.set("error", "exchange_code_failed")
    errorUrl.searchParams.set("error_description", error.message)
    return NextResponse.redirect(errorUrl.toString())
  }

  // return the user to an error page with instructions
  const errorUrl = new URL("/auth/error", origin)
  errorUrl.searchParams.set("error", "missing_oauth_code")
  return NextResponse.redirect(errorUrl.toString())
}
