"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MainNav } from "@/components/navigation/main-nav"
import { useAuth } from "@/contexts/auth-context"
import { DiceIcon } from "@/components/icons/dice-icon"
import {
  MapPin,
  Calendar,
  Users,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Navigation,
  MessageCircle,
  Star,
  Gamepad2,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

interface PartyMember {
  uid: number
  name: string
  username: string | null
  role: "host" | "player"
  arrived: boolean
}

interface PartyDetail {
  id: string
  name: string
  host: {
    name: string
    rating: number
  }
  location: string
  address: string
  date: string
  time: string
  description: string
  games: string[]
  tags: string[]
  maxPlayers: number
  players: number
  joinStatus: "pending" | "accepted" | "rejected" | "none"
  hasArrived: boolean
  isHost: boolean
  locationData: {
    googleMapsUri?: string
  }
  members: PartyMember[]
}

export default function PartyDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [party, setParty] = useState<PartyDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const partyId = params.id
    if (!partyId) return

    const load = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/parties/${partyId}`, { cache: "no-store" })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(payload?.error ?? "Unable to load party")
        }

        const payload = (await response.json()) as { party: PartyDetail }
        setParty(payload.party)
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load party")
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [params.id, router, user])

  const canCheckIn = useMemo(() => {
    if (!party) return false
    if (party.isHost) return false
    if (party.joinStatus !== "accepted") return false
    return !party.hasArrived
  }, [party])

  const handleArrivalConfirm = async () => {
    const partyId = params.id
    if (!partyId || !party) return

    setIsCheckingIn(true)
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

      setParty((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          hasArrived: true,
          members: prev.members.map((member) =>
            member.role === "player" && (member.username || member.name) === (user?.username || user?.name)
              ? { ...member, arrived: true }
              : member
          ),
        }
      })

      toast.success("Arrival confirmed")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to confirm arrival")
    } finally {
      setIsCheckingIn(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      <main className="mx-auto max-w-4xl px-4 py-8">
        <Link href="/my-parties" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to My Parties
        </Link>

        {isLoading || !party ? (
          <Card className="border-2">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading party...
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="mb-6 border-2">
              <CardContent className="p-6">
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <DiceIcon className="h-10 w-10 text-primary" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{party.name}</h1>
                      <div className="mt-2 flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback>{party.host.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">
                          Hosted by <span className="font-medium">{party.host.name}</span>
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-secondary-foreground text-secondary-foreground" />
                          {party.host.rating}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {party.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 p-4">
                    {party.hasArrived || party.isHost ? (
                      <>
                        <CheckCircle2 className="h-8 w-8 text-primary" />
                        <span className="text-sm font-medium text-primary">
                          {party.isHost ? "Host" : "Arrival Confirmed"}
                        </span>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">At the venue?</p>
                        <Button onClick={handleArrivalConfirm} className="gap-2" disabled={!canCheckIn || isCheckingIn}>
                          {isCheckingIn ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Navigation className="h-4 w-4" />
                          )}
                          Confirm Arrival
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="border-2">
                <CardHeader>
                  <CardTitle>Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">{party.date} at {party.time}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{party.location}</p>
                      <p className="text-sm text-muted-foreground">{party.address}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Games</p>
                      <div className="flex flex-wrap gap-2">
                        {party.games.map((game) => (
                          <Badge key={game}>{game}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {party.description ? (
                    <div className="rounded-lg bg-muted/50 p-4">
                      <p className="text-sm">{party.description}</p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Players</span>
                    <Badge variant="outline">
                      {party.players}/{party.maxPlayers}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {party.members.map((member) => (
                    <div
                      key={`${member.role}-${member.uid}`}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{(member.username || member.name).charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{member.username || member.name}</p>
                          <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                        </div>
                      </div>
                      {member.arrived ? (
                        <Badge className="gap-1 bg-primary/20 text-primary">
                          <CheckCircle2 className="h-3 w-3" />
                          Arrived
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          Not arrived
                        </Badge>
                      )}
                    </div>
                  ))}

                  {party.players < party.maxPlayers ? (
                    <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-muted-foreground">
                      <Users className="h-5 w-5" />
                      <span className="text-sm">{party.maxPlayers - party.players} spots available</span>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6 border-2">
              <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
                <Button variant="outline" className="flex-1 gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Message Group
                </Button>
                {party.locationData?.googleMapsUri ? (
                  <Button variant="outline" className="flex-1 gap-2" asChild>
                    <a href={party.locationData.googleMapsUri} target="_blank" rel="noreferrer">
                      <Navigation className="h-4 w-4" />
                      Get Directions
                    </a>
                  </Button>
                ) : (
                  <Button variant="outline" className="flex-1 gap-2" disabled>
                    <Navigation className="h-4 w-4" />
                    Get Directions
                  </Button>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
