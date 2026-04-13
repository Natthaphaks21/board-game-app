"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainNav } from '@/components/navigation/main-nav'
import { useAuth } from '@/contexts/auth-context'
import { DiceIcon } from '@/components/icons/dice-icon'
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
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'

interface Party {
  id: string
  name: string
  role: 'host' | 'player'
  location: string
  date: string
  time: string
  players: { name: string; avatar?: string; status: 'confirmed' | 'pending' }[]
  maxPlayers: number
  games: string[]
  status: 'upcoming' | 'ongoing' | 'completed'
  joinStatus: 'pending' | 'accepted' | 'rejected'
}

interface JoinRequest {
  id: string
  partyId: string
  partyName: string
  user: { name: string; avatar?: string }
  requestedAt: string
}

const mockParties: Party[] = [
  {
    id: '1',
    name: 'My Catan Night',
    role: 'host',
    location: 'Board Game Cafe',
    date: 'Apr 5, 2026',
    time: '7:00 PM',
    players: [
      { name: 'You', status: 'confirmed' },
      { name: 'Jamie L.', status: 'confirmed' },
      { name: 'Chris P.', status: 'pending' },
    ],
    maxPlayers: 4,
    games: ['Catan'],
    status: 'upcoming',
    joinStatus: 'accepted',
  },
  {
    id: '2',
    name: 'Friday Night Catan',
    role: 'player',
    location: 'The Game Hub',
    date: 'Apr 4, 2026',
    time: '7:00 PM',
    players: [
      { name: 'Alex M.', status: 'confirmed' },
      { name: 'You', status: 'confirmed' },
    ],
    maxPlayers: 4,
    games: ['Catan'],
    status: 'upcoming',
    joinStatus: 'accepted',
  },
]

const mockRequests: JoinRequest[] = [
  {
    id: '1',
    partyId: '1',
    partyName: 'My Catan Night',
    user: { name: 'Taylor S.' },
    requestedAt: '5 minutes ago',
  },
  {
    id: '2',
    partyId: '1',
    partyName: 'My Catan Night',
    user: { name: 'Jordan K.' },
    requestedAt: '12 minutes ago',
  },
]

export default function MyPartiesPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [parties, setParties] = useState<Party[]>(mockParties)
  const [requests, setRequests] = useState<JoinRequest[]>(mockRequests)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const hostedParties = parties.filter(p => p.role === 'host')
  const joinedParties = parties.filter(p => p.role === 'player')

  const handleAcceptRequest = (requestId: string) => {
    setRequests(requests.filter(r => r.id !== requestId))
    toast.success('Player accepted!')
  }

  const handleRejectRequest = (requestId: string) => {
    setRequests(requests.filter(r => r.id !== requestId))
    toast.success('Request declined')
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Parties</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your upcoming game nights
            </p>
          </div>
          <Button onClick={() => router.push('/parties/create')} className="gap-2">
            <Plus className="h-4 w-4" />
            Create Party
          </Button>
        </div>

        {/* Pending Requests Alert */}
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
                    className="flex items-center justify-between rounded-lg border border-border bg-card p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={request.user.avatar} />
                        <AvatarFallback>{request.user.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          wants to join &quot;{request.partyName}&quot; • {request.requestedAt}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(request.id)}
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

        {/* Tabs */}
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
                action={
                  <Button onClick={() => router.push('/parties/create')}>
                    Create Party
                  </Button>
                }
              />
            ) : (
              hostedParties.map((party) => (
                <PartyCard key={party.id} party={party} />
              ))
            )}
          </TabsContent>

          <TabsContent value="joined" className="space-y-4">
            {joinedParties.length === 0 ? (
              <EmptyState
                title="No parties joined yet"
                description="Browse available parties and request to join"
                action={
                  <Button onClick={() => router.push('/parties/join')}>
                    Find Parties
                  </Button>
                }
              />
            ) : (
              joinedParties.map((party) => (
                <PartyCard key={party.id} party={party} />
              ))
            )}
          </TabsContent>
        </Tabs>
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
                {party.role === 'host' && (
                  <Badge className="gap-1">
                    <Crown className="h-3 w-3" />
                    Host
                  </Badge>
                )}
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
                <div className="flex -space-x-2">
                  {party.players.slice(0, 4).map((player, i) => (
                    <Avatar key={i} className="h-8 w-8 border-2 border-background">
                      <AvatarImage src={player.avatar} />
                      <AvatarFallback className="text-xs">
                        {player.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {party.players.length > 4 && (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                      +{party.players.length - 4}
                    </div>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {party.players.length}/{party.maxPlayers} players
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {party.games.map(game => (
                  <Badge key={game} variant="secondary" className="gap-1 text-xs">
                    <Gamepad2 className="h-3 w-3" />
                    {game}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {party.joinStatus === 'accepted' && (
              <Button asChild className="gap-2">
                <Link href={`/parties/${party.id}/lobby`}>
                  Enter Lobby
                </Link>
              </Button>
            )}
            {party.joinStatus === 'pending' && (
              <Badge variant="secondary" className="justify-center py-2">
                <Clock className="mr-2 h-4 w-4" />
                Waiting for approval
              </Badge>
            )}
            <Button variant="outline" asChild className="gap-2">
              <Link href={`/parties/${party.id}`}>
                <ExternalLink className="h-4 w-4" />
                View Details
              </Link>
            </Button>
            {party.role === 'host' && (
              <Button variant="ghost" size="sm">
                Manage Party
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyState({ 
  title, 
  description, 
  action 
}: { 
  title: string
  description: string
  action: React.ReactNode 
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
