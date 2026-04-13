"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MainNav } from '@/components/navigation/main-nav'
import { useAuth } from '@/contexts/auth-context'
import { DiceIcon } from '@/components/icons/dice-icon'
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
  Gamepad2
} from 'lucide-react'

type RequestStatus = 'pending' | 'approved' | 'rejected'

export default function WaitingRoomPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [status, setStatus] = useState<RequestStatus>('pending')
  const [countdown, setCountdown] = useState(30)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  // Simulate host response
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          // Randomly approve or reject for demo
          setStatus(Math.random() > 0.3 ? 'approved' : 'rejected')
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!user) return null

  const partyDetails = {
    name: 'Friday Night Catan',
    host: { name: 'Alex M.', avatar: '' },
    location: 'Board Game Cafe',
    address: '123 Main St, Downtown',
    date: 'Apr 4, 2026',
    time: '7:00 PM',
    games: ['Catan'],
    players: ['Alex M.', 'Jamie L.'],
    maxPlayers: 4,
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="mx-auto max-w-2xl px-4 py-8">
        {/* Back Button */}
        <Link href="/parties/join" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Parties
        </Link>

        {/* Status Card */}
        <Card className="mb-6 border-2">
          <CardContent className="p-8 text-center">
            {status === 'pending' && (
              <>
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
                <h2 className="text-2xl font-bold">Waiting for Host</h2>
                <p className="mt-2 text-muted-foreground">
                  Your request has been sent to the host
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Typically responds within {countdown} seconds...</span>
                </div>
              </>
            )}

            {status === 'approved' && (
              <>
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-primary">You&apos;re In!</h2>
                <p className="mt-2 text-muted-foreground">
                  The host has approved your request. You can now access the party lobby!
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={() => router.push(`/parties/${params.id}/lobby`)}>
                    Enter Party Lobby
                  </Button>
                  <Button variant="outline" onClick={() => router.push('/my-parties')}>
                    View My Parties
                  </Button>
                </div>
              </>
            )}

            {status === 'rejected' && (
              <>
                <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-destructive/20">
                  <XCircle className="h-10 w-10 text-destructive" />
                </div>
                <h2 className="text-2xl font-bold">Request Declined</h2>
                <p className="mt-2 text-muted-foreground">
                  The host was unable to accept your request this time
                </p>
                <Button className="mt-6" variant="outline" onClick={() => router.push('/parties/join')}>
                  Find Another Party
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Party Details */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DiceIcon className="h-5 w-5 text-primary" />
              {partyDetails.name}
            </CardTitle>
            <CardDescription>Party Details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Host */}
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={partyDetails.host.avatar} />
                <AvatarFallback>{partyDetails.host.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">Hosted by {partyDetails.host.name}</p>
                <p className="text-sm text-muted-foreground">Party Host</p>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid gap-4 rounded-xl border border-border p-4 md:grid-cols-2">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{partyDetails.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{partyDetails.date} at {partyDetails.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Players</p>
                  <p className="font-medium">{partyDetails.players.length}/{partyDetails.maxPlayers}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Games</p>
                  <div className="flex gap-1">
                    {partyDetails.games.map(game => (
                      <Badge key={game} variant="secondary" className="text-xs">
                        {game}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Players */}
            <div>
              <p className="mb-2 text-sm font-medium">Current Players</p>
              <div className="flex flex-wrap gap-2">
                {partyDetails.players.map((player) => (
                  <div
                    key={player}
                    className="flex items-center gap-2 rounded-full bg-muted px-3 py-1"
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">{player.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{player}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 rounded-full border-2 border-dashed border-border px-3 py-1 text-muted-foreground">
                  <span className="text-sm">You (pending)</span>
                </div>
              </div>
            </div>

            {/* Message Host Button */}
            {status === 'pending' && (
              <Button variant="outline" className="w-full gap-2">
                <MessageCircle className="h-4 w-4" />
                Message Host
              </Button>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
