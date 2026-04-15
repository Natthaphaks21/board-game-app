"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { MainNav } from "@/components/navigation/main-nav"
import { useAuth } from "@/contexts/auth-context"
import { DiceIcon } from "@/components/icons/dice-icon"
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Crown,
  Gamepad2,
  MessageCircle,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Navigation,
  Loader2,
  XCircle,
} from "lucide-react"
import { toast } from "sonner"

interface Member {
  uid: number
  name: string
  username: string | null
  role: "host" | "player"
  arrived: boolean
}

interface PendingRequest {
  userId: number
  name: string
  username: string | null
  requestedAt: string | null
}

interface PartyDetail {
  id: string
  name: string
  location: string
  address: string
  date: string
  time: string
  appointmentTime: string
  description: string
  tags: string[]
  games: string[]
  players: number
  maxPlayers: number
  hasArrived: boolean
  isHost: boolean
  locationData: {
    googleMapsUri?: string
  }
  host: {
    name: string
  }
  members: Member[]
  pendingRequests: PendingRequest[]
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

export default function PartyLobbyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [party, setParty] = useState<PartyDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadParty = async () => {
    const partyId = params.id
    if (!partyId) return

    try {
      const response = await fetch(`/api/parties/${partyId}`, { cache: "no-store" })
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(payload?.error ?? "Unable to load lobby")
      }

      const payload = (await response.json()) as { party: PartyDetail }
      setParty(payload.party)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load lobby")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    void loadParty()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, router, user])

  const canCheckIn = useMemo(() => {
    if (!party) return false
    if (party.isHost) return false
    return !party.hasArrived
  }, [party])

  const handleArrivalConfirm = async () => {
    const partyId = params.id
    if (!partyId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/parties/${partyId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to confirm arrival")
      }

      toast.success("Arrival confirmed")
      await loadParty()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to confirm arrival")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmMemberArrival = async (memberId: number) => {
    const partyId = params.id
    if (!partyId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/parties/${partyId}/check-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: memberId }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to confirm member arrival")
      }

      toast.success("Member arrival confirmed")
      await loadParty()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to confirm member arrival")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRequest = async (userId: number, status: "accepted" | "rejected") => {
    const partyId = params.id
    if (!partyId) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/parties/${partyId}/requests/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update request")
      }

      toast.success(status === "accepted" ? "Player accepted" : "Request rejected")
      await loadParty()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update request")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/my-parties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Parties
          </Link>
        </Button>

        {isLoading || !party ? (
          <Card className="border-2">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading lobby...
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                      <DiceIcon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold text-foreground">{party.name}</h1>
                      <p className="text-muted-foreground">Party Lobby</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {party.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>

                <Badge variant="outline" className="px-4 py-2 text-lg">
                  {party.players}/{party.maxPlayers} Players
                </Badge>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Party Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{party.date}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{party.time}</p>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{party.location}</p>
                        <p className="text-sm text-muted-foreground">{party.address}</p>
                        {party.locationData?.googleMapsUri ? (
                          <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-primary" asChild>
                            <a href={party.locationData.googleMapsUri} target="_blank" rel="noreferrer">
                              <Navigation className="mr-1 h-4 w-4" />
                              Open in Google Maps
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-start gap-3">
                      <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Games</p>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {party.games.map((game) => (
                            <Badge key={game} variant="outline">{game}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    {party.description ? (
                      <>
                        <Separator />
                        <div>
                          <p className="text-sm text-muted-foreground">Description</p>
                          <p className="mt-1">{party.description}</p>
                        </div>
                      </>
                    ) : null}
                  </CardContent>
                </Card>

                <Card className={party.hasArrived ? "border-primary bg-primary/5" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className={`h-5 w-5 ${party.hasArrived ? "text-primary" : "text-muted-foreground"}`} />
                      Arrival Confirmation
                    </CardTitle>
                    <CardDescription>
                      {party.isHost
                        ? "You can confirm member arrivals below."
                        : party.hasArrived
                          ? "You have confirmed your arrival."
                          : "Confirm when you arrive at the location."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {party.isHost ? (
                      <p className="text-sm text-muted-foreground">
                        Host mode is active. Use member actions to confirm arrivals.
                      </p>
                    ) : party.hasArrived ? (
                      <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                        <div>
                          <p className="font-semibold text-primary">Arrival Confirmed</p>
                          <p className="text-sm text-muted-foreground">Enjoy your game night.</p>
                        </div>
                      </div>
                    ) : (
                      <Button size="lg" className="w-full gap-2" onClick={handleArrivalConfirm} disabled={!canCheckIn || isSubmitting}>
                        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                        Confirm My Arrival
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {party.isHost && party.pendingRequests.length > 0 ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pending Requests ({party.pendingRequests.length})</CardTitle>
                      <CardDescription>Approve or reject players waiting to join</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {party.pendingRequests.map((request) => (
                        <div key={request.userId} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{(request.username || request.name).charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{request.username || request.name}</p>
                              <p className="text-xs text-muted-foreground">Requested {relativeTime(request.requestedAt)}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleRequest(request.userId, "rejected")} disabled={isSubmitting}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button size="sm" onClick={() => handleRequest(request.userId, "accepted")} disabled={isSubmitting}>
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ) : null}
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-accent" />
                      Host
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12 border-2 border-accent">
                        <AvatarFallback className="bg-accent text-accent-foreground">
                          {party.host.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-semibold">{party.host.name}</p>
                        <Badge variant="secondary" className="mt-1">
                          <Crown className="mr-1 h-3 w-3" />
                          Host
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Members ({party.members.length})
                    </CardTitle>
                    <CardDescription>
                      {party.members.filter((member) => member.arrived).length} arrived
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {party.members.map((member) => (
                      <div key={`${member.role}-${member.uid}`} className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback>
                            {(member.username || member.name).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium">{member.username || member.name}</p>
                          {member.arrived ? (
                            <Badge variant="default" className="mt-1 bg-primary/20 text-primary">
                              <CheckCircle2 className="mr-1 h-3 w-3" />
                              Arrived
                            </Badge>
                          ) : (
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="secondary">Not arrived</Badge>
                              {party.isHost && member.role !== "host" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleConfirmMemberArrival(member.uid)}
                                  disabled={isSubmitting}
                                >
                                  Confirm
                                </Button>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Button variant="outline" className="w-full" size="lg" onClick={() => toast.info("Chat coming soon") }>
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Party Chat
                </Button>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
