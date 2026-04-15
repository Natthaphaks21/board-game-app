"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MainNav } from "@/components/navigation/main-nav"
import { useAuth } from "@/contexts/auth-context"
import { DiceIcon } from "@/components/icons/dice-icon"
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Crown,
  Plus,
  Gamepad2,
  ExternalLink,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

type PartyStatus = "upcoming" | "ongoing" | "completed"
type JoinStatus = "pending" | "accepted" | "rejected" | "none"

interface Party {
  id: string
  name: string
  role: "host" | "player" | "guest"
  location: string
  date: string
  time: string
  players: number
  maxPlayers: number
  games: string[]
  status: PartyStatus
  joinStatus: JoinStatus
}

interface JoinRequest {
  id: string
  partyId: string
  partyName: string
  userId: number
  user: {
    name: string
    username: string | null
  }
  requestedAt: string | null
}

interface Payload {
  parties: Party[]
  requests: JoinRequest[]
}

function relativeTime(input: string | null): string {
  if (!input) return "just now"

  const ts = new Date(input).getTime()
  if (!Number.isFinite(ts)) return "just now"

  const diffSec = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

export default function MyPartiesPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [parties, setParties] = useState<Party[]>([])
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const load = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/my-parties", { cache: "no-store" })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(payload?.error ?? "Unable to load parties")
        }

        const payload = (await response.json()) as Payload
        setParties(payload.parties ?? [])
        setRequests(payload.requests ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load parties")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [router, user])

  const hostedParties = useMemo(
    () => parties.filter((party) => party.role === "host"),
    [parties]
  )
  const joinedParties = useMemo(
    () => parties.filter((party) => party.role === "player"),
    [parties]
  )

  const handleRequestAction = async (
    requestItem: JoinRequest,
    status: "accepted" | "rejected"
  ) => {
    try {
      const response = await fetch(
        `/api/parties/${requestItem.partyId}/requests/${requestItem.userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      )

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update request")
      }

      setRequests((prev) => prev.filter((request) => request.id !== requestItem.id))
      toast.success(status === "accepted" ? "Player accepted" : "Request declined")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update request")
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Parties</h1>
            <p className="mt-2 text-muted-foreground">Live parties loaded from Supabase</p>
          </div>
          <Button onClick={() => router.push("/parties/create")} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Party
          </Button>
        </div>

        {requests.length > 0 && (
          <Card className="mb-6 border-2 border-accent/50 bg-accent/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <AlertCircle className="h-5 w-5 text-accent" />
                Pending Join Requests ({requests.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {(request.user.username || request.user.name).charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.user.username || request.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          wants to join "{request.partyName}" • {relativeTime(request.requestedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRequestAction(request, "rejected")}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleRequestAction(request, "accepted")}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <Card className="border-2">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading parties...
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">All ({parties.length})</TabsTrigger>
              <TabsTrigger value="hosting">Hosting ({hostedParties.length})</TabsTrigger>
              <TabsTrigger value="joined">Joined ({joinedParties.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {parties.map((party) => (
                <PartyCard key={party.id} party={party} />
              ))}
            </TabsContent>

            <TabsContent value="hosting" className="space-y-4">
              {hostedParties.length === 0 ? (
                <EmptyState
                  title="No parties hosted yet"
                  description="Create your first party and invite players"
                  action={<Button onClick={() => router.push("/parties/create")}>Create Party</Button>}
                />
              ) : (
                hostedParties.map((party) => <PartyCard key={party.id} party={party} />)
              )}
            </TabsContent>

            <TabsContent value="joined" className="space-y-4">
              {joinedParties.length === 0 ? (
                <EmptyState
                  title="No parties joined yet"
                  description="Browse available parties and request to join"
                  action={<Button onClick={() => router.push("/parties/join")}>Find Parties</Button>}
                />
              ) : (
                joinedParties.map((party) => <PartyCard key={party.id} party={party} />)
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  )
}

function PartyCard({ party }: { party: Party }) {
  return (
    <Card className="border-2 transition-colors hover:border-primary/50">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <DiceIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">{party.name}</h3>
                {party.role === "host" ? (
                  <Badge className="gap-1">
                    <Crown className="h-3 w-3" />
                    Host
                  </Badge>
                ) : null}
                {party.status === "ongoing" ? (
                  <Badge variant="secondary">Ongoing</Badge>
                ) : null}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {party.location}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {party.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {party.time}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  {party.players}/{party.maxPlayers} players
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {party.games.map((game) => (
                  <Badge key={game} variant="secondary" className="gap-1 text-xs">
                    <Gamepad2 className="h-3 w-3" />
                    {game}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {party.joinStatus === "accepted" ? (
              <Button asChild className="gap-2">
                <Link href={`/parties/${party.id}/lobby`}>Enter Lobby</Link>
              </Button>
            ) : null}
            {party.joinStatus === "pending" ? (
              <Badge variant="secondary" className="justify-center py-2">
                <Clock className="mr-2 h-4 w-4" />
                Waiting for approval
              </Badge>
            ) : null}
            <Button variant="outline" asChild className="gap-2">
              <Link href={`/parties/${party.id}`}>
                <ExternalLink className="h-4 w-4" />
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action: ReactNode
}) {
  return (
    <Card className="border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <DiceIcon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="mt-1 text-muted-foreground">{description}</p>
        <div className="mt-4">{action}</div>
      </CardContent>
    </Card>
  )
}
