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
  subscribe: (plan: SubscriptionPlan) => void
  cancelSubscription: () => void
  useSlot: () => boolean
  returnSlot: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const SLOT_BY_PLAN: Record<SubscriptionPlan, number> = {
  free: 0,
  basic: 3,
  pro: 5,
  premium: 7,
}

const ENTITLEMENT_PREFIX = "boardbuddies_entitlements_"

interface EntitlementState {
  subscriptionPlan: SubscriptionPlan
  usedSlots: number
  subscriptionDate?: string
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
}

function getEntitlementKey(authId: string) {
  return `${ENTITLEMENT_PREFIX}${authId}`
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
    }
  } catch {
    return fallback
  }
}

function writeEntitlements(authId: string, entitlements: EntitlementState) {
  localStorage.setItem(getEntitlementKey(authId), JSON.stringify(entitlements))
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
    const slots = SLOT_BY_PLAN[entitlements.subscriptionPlan]

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
      isMember: entitlements.subscriptionPlan !== "free",
      subscriptionPlan: entitlements.subscriptionPlan,
      subscription: entitlements.subscriptionPlan,
      subscriptionDate: entitlements.subscriptionDate,
      gameSlots: slots,
      usedSlots: Math.min(entitlements.usedSlots, slots),
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
    if (typeof window === "undefined" || !supabase) return
    const redirectTo = `${window.location.origin}/auth/callback`
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    })

    if (error) {
      throw new Error(error.message)
    }
  }, [supabase])

  const logout = useCallback(async () => {
    if (!supabase) {
      setUser(null)
      return
    }

    await supabase.auth.signOut()
    setUser(null)
  }, [supabase])

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

  const subscribe = useCallback((plan: SubscriptionPlan) => {
    const slots = SLOT_BY_PLAN[plan]
    setUser((prev) => {
      if (!prev) return null
      const usedSlots = Math.min(prev.usedSlots, slots)
      const updated = {
        ...prev,
        subscriptionPlan: plan,
        subscription: plan,
        gameSlots: slots,
        usedSlots,
        isMember: plan !== "free",
        subscriptionDate: new Date().toISOString(),
      }

      writeEntitlements(prev.authId, {
        subscriptionPlan: plan,
        usedSlots,
        subscriptionDate: updated.subscriptionDate,
      })

      return updated
    })
  }, [])

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
