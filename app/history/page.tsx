"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import { useAuth } from "@/contexts/auth-context"
import { DiceIcon } from "@/components/icons/dice-icon"
import { Button } from "@/components/ui/button"
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  Star,
  Gamepad2,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface HistoryParty {
  id: string
  name: string
  role: "host" | "player"
  location: string
  date: string
  time: string
  players: number
  maxPlayers: number
  games: string[]
  arrived: boolean
  host: {
    rating: number
  }
}

interface Payload {
  parties: HistoryParty[]
}

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [history, setHistory] = useState<HistoryParty[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const load = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/history", { cache: "no-store" })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(payload?.error ?? "Unable to load history")
        }

        const payload = (await response.json()) as Payload
        setHistory(payload.parties ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load history")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [router, user])

  const totalParties = history.length
  const arrivedParties = useMemo(
    () => history.filter((party) => party.arrived).length,
    [history]
  )
  const attendanceRate = totalParties
    ? Math.round((arrivedParties / totalParties) * 100)
    : 0

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/home")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Party History</h1>
          <p className="mt-2 text-muted-foreground">
            Your past game nights from Supabase
          </p>
        </div>

        <div className="mb-8 grid gap-4 md:grid-cols-3">
          <Card className="border-2">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalParties}</p>
                <p className="text-sm text-muted-foreground">Total Parties</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                <CheckCircle2 className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{arrivedParties}</p>
                <p className="text-sm text-muted-foreground">Attended</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                <Star className="h-6 w-6 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{attendanceRate}%</p>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Past Parties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading history...
              </div>
            ) : history.length === 0 ? (
              <div className="rounded-xl border border-border p-6 text-center text-muted-foreground">
                No history yet. Join a party and it will appear here.
              </div>
            ) : (
              history.map((party) => (
                <div
                  key={party.id}
                  className="flex flex-col gap-4 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                      <DiceIcon className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{party.name}</h3>
                        <Badge variant={party.role === "host" ? "default" : "secondary"} className="text-xs">
                          {party.role === "host" ? "Hosted" : "Joined"}
                        </Badge>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {party.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {party.date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {party.time}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {party.players}/{party.maxPlayers}
                        </span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {party.games.map((game) => (
                          <Badge key={game} variant="outline" className="gap-1 text-xs">
                            <Gamepad2 className="h-3 w-3" />
                            {game}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {party.arrived ? (
                      <Badge className="gap-1 bg-primary/20 text-primary">
                        <CheckCircle2 className="h-3 w-3" />
                        Attended
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        Did not attend
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
