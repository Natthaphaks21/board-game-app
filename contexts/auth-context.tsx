"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { createClient } from "@/lib/supabase/client"

export type SubscriptionPlan = "free" | "basic" | "pro" | "premium"

export interface User {
  authId: string
  uid: number
  email: string
  name: string
  surname: string
  thaiCitizenId?: string
  username?: string
  googleAuthId?: string
  avatar?: string
  isProfileComplete: boolean
  isMember: boolean
  subscriptionDate?: string
  subscriptionExpiresAt?: string
  subscriptionPlan: SubscriptionPlan
  subscription: SubscriptionPlan
  gameSlots: number
  usedSlots: number
  phone?: string
  address?: string
  dateOfBirth?: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  loginWithEmail: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<User | null>
  updateProfile: (data: Partial<User>) => Promise<void>
  subscribe: (plan: SubscriptionPlan) => Promise<void>
  cancelSubscription: () => void
  useSlot: () => boolean
  returnSlot: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SLOT_BY_PLAN: Record<SubscriptionPlan, number> = {
  free: 0,
  basic: 3,
  pro: 5,
  premium: 8,
}

const ENTITLEMENT_PREFIX = "boardbuddies_entitlements_"

interface EntitlementState {
  subscriptionPlan: SubscriptionPlan
  usedSlots: number
  subscriptionDate?: string
  subscriptionExpiresAt?: string
}

interface MeApiResponse {
  user: {
    id: string
    email: string
    metadata?: Record<string, unknown>
  } | null
  profile?: {
    uid: number
    name: string
    surname: string
    username: string | null
    googleAuthId: string | null
    createdAt: string | null
  } | null
  member?: {
    tier: string | null
    subscription_date: string | null
    subscription_expires_at: string | null
  } | null
}

function getEntitlementKey(authId: string) {
  return `${ENTITLEMENT_PREFIX}${authId}`
}

function normalizePlan(value: unknown): SubscriptionPlan {
  if (value === "basic" || value === "pro" || value === "premium" || value === "free") {
    return value
  }
  if (value === "small") return "basic"
  if (value === "medium") return "pro"
  if (value === "large") return "premium"
  return "free"
}

function readEntitlements(authId: string): EntitlementState {
  const fallback: EntitlementState = {
    subscriptionPlan: "free",
    usedSlots: 0,
  }

  try {
    const raw = localStorage.getItem(getEntitlementKey(authId))
    if (!raw) return fallback

    const parsed = JSON.parse(raw) as Partial<EntitlementState>
    const plan = parsed.subscriptionPlan ?? "free"
    const usedSlots = Number(parsed.usedSlots ?? 0)

    return {
      subscriptionPlan: plan,
      usedSlots: Number.isFinite(usedSlots) ? Math.max(0, usedSlots) : 0,
      subscriptionDate: parsed.subscriptionDate,
      subscriptionExpiresAt: parsed.subscriptionExpiresAt,
    }
  } catch {
    return fallback
  }
}

function writeEntitlements(authId: string, entitlements: EntitlementState) {
  localStorage.setItem(getEntitlementKey(authId), JSON.stringify(entitlements))
}

function isFutureIso(value: string | undefined): boolean {
  if (!value) return false
  const ts = new Date(value).getTime()
  return Number.isFinite(ts) && ts > Date.now()
}

function clearLocalAuthCache(authId?: string) {
  if (typeof window === "undefined") return

  if (authId) {
    localStorage.removeItem(getEntitlementKey(authId))
  }

  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(ENTITLEMENT_PREFIX) || key.startsWith("sb-")) {
      localStorage.removeItem(key)
    }
  }

  sessionStorage.clear()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [supabase, setSupabase] = useState<ReturnType<
    typeof createClient
  > | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUser = useCallback(async (): Promise<User | null> => {
    if (!supabase) {
      setIsLoading(false)
      return null
    }

    setIsLoading(true)

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      setUser(null)
      setIsLoading(false)
      return null
    }

    const response = await fetch("/api/auth/me", {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    })

    if (!response.ok) {
      setUser(null)
      setIsLoading(false)
      return null
    }

    const payload = (await response.json()) as MeApiResponse
    const authUser = payload.user

    if (!authUser) {
      setUser(null)
      setIsLoading(false)
      return null
    }

    const entitlements = readEntitlements(authUser.id)
    const memberPlan = normalizePlan(payload.member?.tier)
    const memberSubscriptionDate =
      typeof payload.member?.subscription_date === "string"
        ? payload.member.subscription_date
        : undefined
    const memberSubscriptionExpiresAt =
      typeof payload.member?.subscription_expires_at === "string"
        ? payload.member.subscription_expires_at
        : undefined
    const metadataPlan = normalizePlan(authUser.metadata?.subscription_plan)
    const metadataSubscriptionDate =
      typeof authUser.metadata?.subscription_date === "string"
        ? authUser.metadata.subscription_date
        : undefined
    const metadataSubscriptionExpiresAt =
      typeof authUser.metadata?.subscription_expires_at === "string"
        ? authUser.metadata.subscription_expires_at
        : undefined

    const localPlan = normalizePlan(entitlements.subscriptionPlan)
    const localIsActive =
      localPlan !== "free" &&
      (isFutureIso(entitlements.subscriptionExpiresAt) ||
        !entitlements.subscriptionExpiresAt)
    const metadataIsActive =
      metadataPlan !== "free" &&
      (isFutureIso(metadataSubscriptionExpiresAt) ||
        !metadataSubscriptionExpiresAt)
    const memberIsActive =
      memberPlan !== "free" &&
      (isFutureIso(memberSubscriptionExpiresAt) || !memberSubscriptionExpiresAt)

    const subscriptionPlan = memberIsActive
      ? memberPlan
      : metadataIsActive
        ? metadataPlan
        : localIsActive
          ? localPlan
          : "free"

    const subscriptionDate = memberIsActive
      ? memberSubscriptionDate
      : metadataIsActive
        ? metadataSubscriptionDate
        : localIsActive
          ? entitlements.subscriptionDate
          : undefined
    const subscriptionExpiresAt = memberIsActive
      ? memberSubscriptionExpiresAt
      : metadataIsActive
        ? metadataSubscriptionExpiresAt
        : localIsActive
          ? entitlements.subscriptionExpiresAt
          : undefined
    const normalizedUsedSlots = Number(entitlements.usedSlots ?? 0)

    const fullName = String(authUser.metadata?.name ?? "")
    const [first, ...rest] = fullName.split(" ").filter(Boolean)

    const profile = payload.profile ?? null
    const hydratedUser: User = {
      authId: authUser.id,
      uid: profile?.uid ?? 0,
      email: authUser.email,
      name: profile?.name ?? first ?? "",
      surname: profile?.surname ?? rest.join(" "),
      username:
        profile?.username ??
        authUser.email.split("@")[0] ??
        undefined,
      googleAuthId: profile?.googleAuthId ?? undefined,
      avatar: String(authUser.metadata?.avatar_url ?? ""),
      isProfileComplete: Boolean(profile?.uid),
      isMember: subscriptionPlan !== "free",
      subscriptionPlan,
      subscription: subscriptionPlan,
      subscriptionDate,
      subscriptionExpiresAt,
      gameSlots: SLOT_BY_PLAN[subscriptionPlan],
      usedSlots: Math.min(
        Number.isFinite(normalizedUsedSlots) ? normalizedUsedSlots : 0,
        SLOT_BY_PLAN[subscriptionPlan]
      ),
      phone: String(authUser.metadata?.phone ?? ""),
      address: String(authUser.metadata?.address ?? ""),
      dateOfBirth: String(authUser.metadata?.dateOfBirth ?? ""),
    }

    setUser(hydratedUser)
    setIsLoading(false)
    return hydratedUser
  }, [supabase])

  const loginWithEmail = useCallback(
    async (email: string, password: string) => {
      if (!supabase) {
        throw new Error("Supabase client is not ready.")
      }

      setIsLoading(true)
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setIsLoading(false)
        throw new Error(error.message)
      }

      const loadedUser = await refreshUser()
      if (!loadedUser?.isProfileComplete) {
        await supabase.auth.signOut()
        setUser(null)
        setIsLoading(false)
        throw new Error("Please sign up with Google first before using email login.")
      }
    },
    [refreshUser, supabase]
  )

  const signInWithGoogle = useCallback(async () => {
    if (typeof window === "undefined") {
      throw new Error("Google sign-in must run in a browser.")
    }

    if (!supabase) {
      throw new Error(
        "Supabase auth is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
      )
    }

    const configuredRedirect = process.env.NEXT_PUBLIC_AUTH_REDIRECT_URL?.trim()
    const redirectTo =
      configuredRedirect && configuredRedirect.startsWith("http")
        ? configuredRedirect
        : `${window.location.origin}/auth/callback`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: { prompt: "select_account" },
      },
    })

    if (error) {
      throw new Error(error.message)
    }

    if (!data.url) {
      throw new Error("Unable to start Google OAuth flow.")
    }

    window.location.assign(data.url)
  }, [supabase])

  const logout = useCallback(async () => {
    const authId = user?.authId

    if (!supabase) {
      clearLocalAuthCache(authId)
      setUser(null)
      return
    }

    await supabase.auth.signOut()
    clearLocalAuthCache(authId)
    setUser(null)
  }, [supabase, user?.authId])

  const updateProfile = useCallback(async (data: Partial<User>) => {
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: data.name,
        surname: data.surname,
        username: data.username,
        phone: data.phone,
        address: data.address,
        dateOfBirth: data.dateOfBirth,
      }),
    })

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null
      throw new Error(payload?.error ?? "Unable to update profile")
    }

    setUser((prev) => {
      if (!prev) return null
      const updated = { ...prev, ...data } as User
      return updated
    })
  }, [])

  const subscribe = useCallback(
    async (plan: SubscriptionPlan) => {
      const response = await fetch("/api/membership/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(payload?.error ?? "Unable to activate membership")
      }

      await refreshUser()

      setUser((prev) => {
        if (!prev) return prev
        const now = new Date()
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

        writeEntitlements(prev.authId, {
          subscriptionPlan: plan,
          usedSlots: prev.usedSlots,
          subscriptionDate: now.toISOString(),
          subscriptionExpiresAt: expiresAt,
        })
        return prev
      })
    },
    [refreshUser]
  )

  const cancelSubscription = useCallback(() => {
    setUser((prev) => {
      if (!prev) return null
      const updated = {
        ...prev,
        subscriptionPlan: "free" as SubscriptionPlan,
        subscription: "free" as SubscriptionPlan,
        gameSlots: 0,
        usedSlots: 0,
        isMember: false,
        subscriptionDate: undefined,
      }

      writeEntitlements(prev.authId, {
        subscriptionPlan: "free",
        usedSlots: 0,
        subscriptionDate: undefined,
        subscriptionExpiresAt: undefined,
      })

      return updated
    })
  }, [])

  const useSlot = useCallback(() => {
    let didUseSlot = false

    if (!user || user.usedSlots >= user.gameSlots) return false

    setUser((prev) => {
      if (!prev) return null

      didUseSlot = true
      const updated = { ...prev, usedSlots: prev.usedSlots + 1 }

      writeEntitlements(prev.authId, {
        subscriptionPlan: prev.subscriptionPlan,
        usedSlots: updated.usedSlots,
        subscriptionDate: prev.subscriptionDate,
        subscriptionExpiresAt: prev.subscriptionExpiresAt,
      })

      return updated
    })

    return didUseSlot
  }, [user])

  const returnSlot = useCallback(() => {
    setUser((prev) => {
      if (!prev || prev.usedSlots <= 0) return prev
      const updated = { ...prev, usedSlots: prev.usedSlots - 1 }

      writeEntitlements(prev.authId, {
        subscriptionPlan: prev.subscriptionPlan,
        usedSlots: updated.usedSlots,
        subscriptionDate: prev.subscriptionDate,
        subscriptionExpiresAt: prev.subscriptionExpiresAt,
      })

      return updated
    })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      setSupabase(createClient())
    } catch {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!supabase) return

    refreshUser().catch(() => {
      setUser(null)
      setIsLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      refreshUser().catch(() => {
        setUser(null)
        setIsLoading(false)
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshUser, supabase])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        loginWithEmail,
        signInWithGoogle,
        logout,
        refreshUser,
        updateProfile,
      subscribe,
        cancelSubscription,
        useSlot,
        returnSlot,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
