"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { MainNav } from "@/components/navigation/main-nav"
import { useAuth } from "@/contexts/auth-context"
import { DiceIcon } from "@/components/icons/dice-icon"
import {
  Clock,
  MapPin,
  Calendar,
  Users,
  Navigation,
  MessageCircle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Gamepad2,
  Send,
} from "lucide-react"
import { toast } from "sonner"

type RequestStatus = "pending" | "approved" | "rejected"

interface JoinStatusPayload {
  status: "pending" | "accepted" | "rejected" | "none"
}

interface PartyDetail {
  id: string
  name: string
  host: { name: string }
  location: string
  address: string
  locationData?: {
    googleMapsUri?: string
  }
  date: string
  time: string
  games: string[]
  players: number
  maxPlayers: number
  status?: "upcoming" | "ongoing" | "completed" | "cancelled"
}

interface ChatMessage {
  id: number
  senderId: number
  senderName: string
  senderUsername: string | null
  message: string
  createdAt: string
  isMine: boolean
}

function relativeTime(input: string): string {
  const ts = new Date(input).getTime()
  if (!Number.isFinite(ts)) return "now"

  const diffSec = Math.max(1, Math.floor((Date.now() - ts) / 1000))
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`
  return `${Math.floor(diffSec / 86400)}d ago`
}

export default function WaitingRoomPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams<{ id: string }>()

  const [status, setStatus] = useState<RequestStatus>("pending")
  const [isLoading, setIsLoading] = useState(true)
  const [partyDetails, setPartyDetails] = useState<PartyDetail | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [isLoadingChat, setIsLoadingChat] = useState(false)
  const [isSendingChat, setIsSendingChat] = useState(false)
  const [isLeaving, setIsLeaving] = useState(false)

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

    let mounted = true

    const loadChat = async () => {
      setIsLoadingChat(true)
      try {
        const response = await fetch(`/api/parties/${partyId}/chat?limit=30`, {
          cache: "no-store",
        })

        if (!response.ok) {
          return
        }

        const payload = (await response.json()) as { messages: ChatMessage[] }
        if (!mounted) return
        setMessages(payload.messages ?? [])
      } catch {
        // optional UI; ignore transient chat errors
      } finally {
        if (mounted) setIsLoadingChat(false)
      }
    }

    void loadChat()
    const interval = setInterval(() => {
      void loadChat()
    }, 6000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [params.id, user])

  const sendChat = async () => {
    const partyId = params.id
    const message = chatInput.trim()
    if (!partyId || !message) return

    setIsSendingChat(true)
    try {
      const response = await fetch(`/api/parties/${partyId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; message?: ChatMessage }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to send message")
      }

      setChatInput("")
      if (payload?.message) {
        setMessages((prev) => [...prev, payload.message as ChatMessage])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send message")
    } finally {
      setIsSendingChat(false)
    }
  }

  const leaveParty = async () => {
    const partyId = params.id
    if (!partyId) return

    setIsLeaving(true)
    try {
      const response = await fetch(`/api/parties/${partyId}/leave`, {
        method: "POST",
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to leave party")
      }

      toast.success("You left the party")
      router.push("/parties/join")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to leave party")
    } finally {
      setIsLeaving(false)
    }
  }

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

              {status !== "rejected" ? (
                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  {partyDetails.locationData?.googleMapsUri ? (
                    <Button variant="outline" className="flex-1 gap-2" asChild>
                      <a href={partyDetails.locationData.googleMapsUri} target="_blank" rel="noreferrer">
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
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => void leaveParty()}
                    disabled={isLeaving || partyDetails.status === "cancelled"}
                  >
                    {isLeaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Leave Party
                  </Button>
                </div>
              ) : null}

              {status === "pending" ? (
                <div className="space-y-3 rounded-xl border border-border p-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <MessageCircle className="h-4 w-4 text-primary" />
                    Message Host
                  </div>
                  <div className="max-h-72 space-y-2 overflow-y-auto rounded-md border border-border p-2">
                    {isLoadingChat ? (
                      <p className="text-xs text-muted-foreground">Loading chat...</p>
                    ) : messages.length === 0 ? (
                      <p className="text-xs text-muted-foreground">No chat yet.</p>
                    ) : (
                      messages.map((message) => (
                        <div key={message.id} className="rounded-md bg-muted p-2 text-xs">
                          <p className="mb-1 text-[11px] text-muted-foreground">
                            {message.senderName} • {relativeTime(message.createdAt)}
                          </p>
                          <p>{message.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault()
                          void sendChat()
                        }
                      }}
                      maxLength={500}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void sendChat()}
                      disabled={isSendingChat || chatInput.trim().length === 0}
                    >
                      {isSendingChat ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </main>
    </div>
  )
}
