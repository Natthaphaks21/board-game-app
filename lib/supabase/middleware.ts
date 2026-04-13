import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Fail open instead of crashing the entire app when env vars are missing.
  // This prevents "Internal Server Error" at the root page on deployments
  // where env config has not been set yet.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname.startsWith("/api")) {
    return supabaseResponse
  }

  // Protected routes - redirect to login if not authenticated.
  const protectedRoutes = [
    "/home",
    "/parties",
    "/my-parties",
    "/profile",
    "/membership",
    "/game-slots",
    "/history",
    "/onboarding",
  ]
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/"
    return NextResponse.redirect(url)
  }

  if (!user) {
    return supabaseResponse
  }

  // Fast path via user metadata to avoid DB query on every request.
  let isProfileComplete = Boolean(user.user_metadata?.profile_completed)

  // Only fallback to DB check on routes that require profile status decisions.
  const needsProfileDecision =
    pathname === "/" ||
    pathname.startsWith("/onboarding") ||
    isProtectedRoute

  if (!isProfileComplete && needsProfileDecision) {
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("uid")
      .eq("auth_id", user.id)
      .maybeSingle()

    if (!profileError || profileError.code === "PGRST116") {
      isProfileComplete = Boolean(profile?.uid)
    }
  }

  if (!isProfileComplete && !pathname.startsWith("/onboarding") && !pathname.startsWith("/auth")) {
    const url = request.nextUrl.clone()
    url.pathname = "/onboarding"
    return NextResponse.redirect(url)
  }

  if (isProfileComplete && pathname.startsWith("/onboarding")) {
    const url = request.nextUrl.clone()
    url.pathname = "/home"
    return NextResponse.redirect(url)
  }

  // If user is logged in and tries to access login page, redirect to the next expected screen.
  if (pathname === "/") {
    const url = request.nextUrl.clone()
    url.pathname = isProfileComplete ? "/home" : "/onboarding"
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
