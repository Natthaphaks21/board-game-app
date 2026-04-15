"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MainNav } from "@/components/navigation/main-nav"
import { useAuth } from "@/contexts/auth-context"
import { DiceIcon } from "@/components/icons/dice-icon"
import {
  Search,
  MapPin,
  Calendar,
  Users,
  Clock,
  Filter,
  ArrowUpDown,
  Star,
  Gamepad2,
  ArrowLeft,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

type JoinStatus = "pending" | "accepted" | "rejected" | "none"
type SortOption = "date" | "distance" | "players" | "rating"

interface Party {
  id: string
  name: string
  appointmentTime: string
  host: {
    name: string
    rating: number
  }
  location: string
  address: string
  date: string
  time: string
  players: number
  maxPlayers: number
  games: string[]
  tags: string[]
  joinStatus: JoinStatus
}

export default function JoinPartyPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("date")
  const [filterTag, setFilterTag] = useState<string>("all")
  const [parties, setParties] = useState<Party[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push("/")
      return
    }

    const loadParties = async () => {
      setIsLoading(true)
      try {
        const response = await fetch("/api/parties?limit=80", {
          cache: "no-store",
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null
          throw new Error(payload?.error ?? "Unable to load parties")
        }

        const payload = (await response.json()) as { parties: Party[] }
        setParties(payload.parties ?? [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Unable to load parties")
      } finally {
        setIsLoading(false)
      }
    }

    void loadParties()
  }, [router, user])

  const allTags = useMemo(
    () => Array.from(new Set(parties.flatMap((party) => party.tags))),
    [parties]
  )

  const filteredParties = useMemo(() => {
    return parties
      .filter((party) => {
        const needle = searchQuery.toLowerCase()
        const matchesSearch =
          party.name.toLowerCase().includes(needle) ||
          party.games.some((game) => game.toLowerCase().includes(needle)) ||
          party.location.toLowerCase().includes(needle)

        const matchesTag = filterTag === "all" || party.tags.includes(filterTag)
        return matchesSearch && matchesTag
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "players":
            return (b.maxPlayers - b.players) - (a.maxPlayers - a.players)
          case "rating":
            return b.host.rating - a.host.rating
          case "distance":
            return 0
          case "date":
          default:
            return (
              new Date(a.appointmentTime).getTime() -
              new Date(b.appointmentTime).getTime()
            )
        }
      })
  }, [filterTag, parties, searchQuery, sortBy])

  const handleJoinRequest = async (partyId: string, partyName: string) => {
    try {
      const response = await fetch(`/api/parties/${partyId}/join`, {
        method: "POST",
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string; status?: JoinStatus }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to send join request")
      }

      setParties((prev) =>
        prev.map((party) =>
          party.id === partyId
            ? {
                ...party,
                joinStatus: payload?.status ?? "pending",
              }
            : party
        )
      )

      toast.success(`Join request sent for \"${partyName}\"`, {
        description: "The host will review your request.",
      })
      router.push(`/parties/${partyId}/waiting`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send request")
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

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Find a Party</h1>
          <p className="mt-2 text-muted-foreground">Discover game nights from Supabase</p>
        </div>

        <Card className="mb-6 border-2">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, game, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-full gap-2 sm:w-44">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map((tag) => (
                      <SelectItem key={tag} value={tag}>
                        {tag}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-full gap-2 sm:w-44">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="players">Spots Available</SelectItem>
                    <SelectItem value="rating">Host Rating</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{filteredParties.length} parties found</p>
        </div>

        {isLoading ? (
          <Card className="border-2">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading parties...
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredParties.map((party) => {
              const isFull = party.players >= party.maxPlayers
              const isPending = party.joinStatus === "pending"
              const isAccepted = party.joinStatus === "accepted"

              return (
                <Card key={party.id} className="border-2 transition-colors hover:border-primary/50">
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                          <DiceIcon className="h-10 w-10 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-bold">{party.name}</h3>
                            {isPending ? <Badge variant="secondary">Requested</Badge> : null}
                          </div>

                          <div className="mt-1 flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">{party.host.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{party.host.name}</span>
                            <span className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 fill-secondary-foreground text-secondary-foreground" />
                              {party.host.rating}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
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

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {party.games.map((game) => (
                              <Badge key={game} className="gap-1">
                                <Gamepad2 className="h-3 w-3" />
                                {game}
                              </Badge>
                            ))}
                            {party.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 sm:items-end">
                        <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{party.players}/{party.maxPlayers}</span>
                        </div>

                        {isAccepted ? (
                          <Button onClick={() => router.push(`/parties/${party.id}/lobby`)}>
                            Enter Lobby
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleJoinRequest(party.id, party.name)}
                            disabled={isFull || isPending}
                          >
                            {isFull ? "Full" : isPending ? "Requested" : "Request to Join"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {!isLoading && filteredParties.length === 0 && (
          <Card className="border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No parties found</h3>
              <p className="mt-1 text-muted-foreground">Try adjusting your search or filters</p>
              <Button className="mt-4" onClick={() => router.push("/parties/create")}>
                Create Your Own Party
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
