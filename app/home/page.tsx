"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MainNav } from "@/components/navigation/main-nav"
import { useAuth } from "@/contexts/auth-context"
import { DiceIcon, MeepleIcon } from "@/components/icons/dice-icon"
import {
  Plus,
  Search,
  Users,
  MapPin,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Star,
  ArrowLeft,
  Calendar,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface Party {
  id: string
  name: string
  date: string
  time: string
  location: string
  players: number
  maxPlayers: number
  tags: string[]
  games: string[]
  host: {
    name: string
    rating: number
  }
}

interface MyPartiesPayload {
  parties: Array<{
    role: "host" | "player" | "guest"
  }>
}

interface HistoryPayload {
  parties: Array<unknown>
}

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [parties, setParties] = useState<Party[]>([])
  const [stats, setStats] = useState({
    hosted: 0,
    joined: 0,
    history: 0,
  })

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const loadData = async () => {
      setIsLoading(true)
      try {
        const [partiesRes, myPartiesRes, historyRes] = await Promise.all([
          fetch("/api/parties?limit=12", { cache: "no-store" }),
          fetch("/api/my-parties", { cache: "no-store" }),
          fetch("/api/history", { cache: "no-store" }),
        ])

        if (!partiesRes.ok) {
          const payload = (await partiesRes.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(payload?.error ?? "Unable to load parties")
        }

        const partiesPayload = (await partiesRes.json()) as { parties: Party[] }
        setParties(partiesPayload.parties ?? [])

        if (myPartiesRes.ok) {
          const myPayload = (await myPartiesRes.json()) as MyPartiesPayload
          const hosted = (myPayload.parties ?? []).filter((party) => party.role === "host").length
          const joined = (myPayload.parties ?? []).filter((party) => party.role === "player").length
          setStats((prev) => ({ ...prev, hosted, joined }))
        }

        if (historyRes.ok) {
          const historyPayload = (await historyRes.json()) as HistoryPayload
          setStats((prev) => ({ ...prev, history: (historyPayload.parties ?? []).length }))
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load home data")
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [router, user])

  const trendingGames = useMemo(() => {
    const counts = new Map<string, number>()

    for (const party of parties) {
      for (const game of party.games) {
        counts.set(game, (counts.get(game) ?? 0) + 1)
      }
    }

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count], index) => ({
        name,
        count,
        rank: index + 1,
      }))
  }, [parties])

  if (!user) return null

  const displayName = user.username || user.name || "Player"

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      <main className="mx-auto max-w-7xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>

        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">Welcome back, {displayName}!</h1>
            <p className="mt-2 text-muted-foreground">Your dashboard is now reading live data from Supabase.</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="w-full gap-2 sm:w-auto" onClick={() => router.push("/parties/create")}>
              <Plus className="h-5 w-5" />
              Create Party
            </Button>
            <Button size="lg" variant="outline" className="w-full gap-2 sm:w-auto" onClick={() => router.push("/parties/join")}>
              <Search className="h-5 w-5" />
              Find Parties
            </Button>
          </div>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Parties Joined" value={String(stats.joined)} />
          <StatCard icon={MeepleIcon} label="Parties Hosted" value={String(stats.hosted)} />
          <StatCard icon={TrendingUp} label="History" value={String(stats.history)} />
          <StatCard icon={Sparkles} label="Open Suggestions" value={String(parties.length)} />
        </div>

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              Nearby Parties
            </h2>
            <p className="text-sm text-muted-foreground">Live suggestions from Supabase</p>
          </div>
          <Link href="/parties/join">
            <Button variant="ghost" size="sm" className="gap-1">
              View All
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <Card className="mb-8 border-2">
            <CardContent className="flex items-center justify-center py-10 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading dashboard...
            </CardContent>
          </Card>
        ) : (
          <div className="mb-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {parties.slice(0, 6).map((party) => (
              <Card
                key={party.id}
                className="cursor-pointer border-2 transition-all hover:border-primary/50 hover:shadow-lg"
                onClick={() => router.push(`/parties/${party.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <DiceIcon className="h-7 w-7 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {party.players}/{party.maxPlayers}
                    </Badge>
                  </div>

                  <h3 className="mt-3 text-lg font-bold">{party.name}</h3>

                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">{party.host.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{party.host.name}</span>
                    <span className="flex items-center gap-0.5 text-xs">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {party.host.rating}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{party.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{party.date}, {party.time}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {party.games.slice(0, 1).map((game) => (
                      <Badge key={game} className="text-xs">{game}</Badge>
                    ))}
                    {party.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>

                  <Button className="mt-4 w-full" size="sm">
                    View Party
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MeepleIcon className="h-5 w-5 text-accent" />
              Trending Games (From Party Data)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trendingGames.length === 0 ? (
              <p className="text-sm text-muted-foreground">No game data yet. Create a party to get started.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {trendingGames.map((game) => (
                  <div key={game.name} className="rounded-xl border border-border p-3">
                    <p className="text-xs text-muted-foreground">#{game.rank}</p>
                    <p className="font-semibold">{game.name}</p>
                    <p className="text-xs text-muted-foreground">Used in {game.count} parties</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <Card className="border-2">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
