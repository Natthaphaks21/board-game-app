"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MainNav } from "@/components/navigation/main-nav"
import { useAuth } from "@/contexts/auth-context"
import { DiceIcon } from "@/components/icons/dice-icon"
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  MessageCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Gamepad2,
} from "lucide-react"
import { toast } from "sonner"

type RequestStatus = "pending" | "approved" | "rejected"

interface JoinStatusPayload {
  status: "pending" | "accepted" | "rejected" | "none"
}

interface PartyDetail {
  name: string
  host: { name: string }
  location: string
  address: string
  date: string
  time: string
  games: string[]
  players: number
  maxPlayers: number
}

export default function WaitingRoomPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [status, setStatus] = useState<RequestStatus>("pending")
  const [isLoading, setIsLoading] = useState(true)
  const [partyDetails, setPartyDetails] = useState<PartyDetail | null>(null)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const partyId = params.id
    if (!partyId) return

    const loadDetails = async () => {
      try {
        const response = await fetch(`/api/parties/${partyId}`, { cache: "no-store" })
        if (!response.ok) return

        const payload = (await response.json()) as { party: PartyDetail }
        setPartyDetails(payload.party)
      } catch {
        // ignore details failures for waiting screen
      }
    }

    void loadDetails()
  }, [params.id, router, user])

  useEffect(() => {
    if (!user) return

    const partyId = params.id
    if (!partyId) return

    let isStopped = false

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/parties/${partyId}/join`, {
          cache: "no-store",
        })

        if (!response.ok) return

        const payload = (await response.json()) as JoinStatusPayload

        if (isStopped) return

        if (payload.status === "accepted") {
          setStatus("approved")
        } else if (payload.status === "rejected") {
          setStatus("rejected")
        } else {
          setStatus("pending")
        }
      } catch {
        // ignore transient polling errors
      } finally {
        if (!isStopped) {
          setIsLoading(false)
        }
      }
    }

    void pollStatus()
    const interval = setInterval(() => {
      void pollStatus()
    }, 5000)

    return () => {
      isStopped = true
      clearInterval(interval)
    }
  }, [params.id, user])

  const title = useMemo(() => partyDetails?.name ?? "Party", [partyDetails?.name])

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <Link href="/parties/join" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Parties
        </Link>

        <Card className="mb-6 border-2">
          <CardContent className="p-8 text-center">
            {isLoading ? (
              <>
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Checking request status...</h2>
              </>
            ) : null}

            {!isLoading && status === "pending" ? (
              <>
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Waiting for Host</h2>
                <p className="mt-2 text-muted-foreground">
                  Your join request is pending approval
                </p>
                <p className="mt-4 text-xs text-muted-foreground">Status auto-refreshes every 5 seconds</p>
              </>
            ) : null}

            {status === "approved" ? (
              <>
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-primary">You&apos;re In!</h2>
                <p className="mt-2 text-muted-foreground">
                  The host approved your request. You can now enter lobby.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={() => router.push(`/parties/${params.id}/lobby`)}>
                    Enter Party Lobby
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/my-parties")}>
                    View My Parties
                  </Button>
                </div>
              </>
            ) : null}

            {status === "rejected" ? (
              <>
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold">Request Declined</h2>
                <p className="mt-2 text-muted-foreground">
                  The host was unable to accept your request.
                </p>
                <Button className="mt-6" variant="outline" onClick={() => router.push("/parties/join")}>
                  Find Another Party
                </Button>
              </>
            ) : null}
          </CardContent>
        </Card>

        {partyDetails ? (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DiceIcon className="h-5 w-5 text-primary" />
                {title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>{partyDetails.host.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">Hosted by {partyDetails.host.name}</p>
                  <p className="text-sm text-muted-foreground">Party Host</p>
                </div>
              </div>

              <div className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{partyDetails.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{partyDetails.date} at {partyDetails.time}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Players</p>
                    <p className="font-medium">{partyDetails.players}/{partyDetails.maxPlayers}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Games</p>
                    <div className="flex flex-wrap gap-1">
                      {partyDetails.games.map((game) => (
                        <Badge key={game} variant="secondary" className="text-xs">
                          {game}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {status === "pending" ? (
                <Button variant="outline" className="w-full gap-2" onClick={() => toast.info("Chat coming soon") }>
                  <MessageCircle className="h-4 w-4" />
                  Message Host
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}
