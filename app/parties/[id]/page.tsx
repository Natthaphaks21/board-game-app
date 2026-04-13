"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MainNav } from '@/components/navigation/main-nav'
import { useAuth } from '@/contexts/auth-context'
import { DiceIcon } from '@/components/icons/dice-icon'
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
  Gamepad2
} from 'lucide-react'
import { toast } from 'sonner'

export default function PartyDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [hasArrived, setHasArrived] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const party = {
    id: params.id,
    name: 'Friday Night Catan',
    host: { name: 'Alex M.', avatar: '', rating: 4.8 },
    location: 'Board Game Cafe',
    address: '123 Main St, Downtown',
    date: 'Apr 4, 2026',
    time: '7:00 PM',
    description: 'Join us for a relaxed evening of Catan! All experience levels welcome. We will have snacks and drinks available.',
    games: ['Catan'],
    players: [
      { name: 'Alex M.', role: 'host', arrived: true },
      { name: 'You', role: 'player', arrived: hasArrived },
      { name: 'Jamie L.', role: 'player', arrived: false },
    ],
    maxPlayers: 4,
    tags: ['Strategy', 'Beginner Friendly'],
  }

  const handleArrivalConfirm = () => {
    setHasArrived(true)
    toast.success('Arrival confirmed!', {
      description: 'Have fun at the party!',
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <Link href="/my-parties" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to My Parties
        </Link>

        {/* Party Header */}
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
                      <AvatarImage src={party.host.avatar} />
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
                    {party.tags.map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arrival Confirmation */}
              <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 p-4">
                {hasArrived ? (
                  <>
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                    <span className="text-sm font-medium text-primary">Arrival Confirmed</span>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">At the venue?</p>
                    <Button onClick={handleArrivalConfirm} className="gap-2">
                      <Navigation className="h-4 w-4" />
                      Confirm Arrival
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Details */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date & Time</p>
                  <p className="font-medium">{party.date} at {party.time}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Location</p>
                  <p className="font-medium">{party.location}</p>
                  <p className="text-sm text-muted-foreground">{party.address}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Games</p>
                  <div className="flex gap-2">
                    {party.games.map(game => (
                      <Badge key={game}>{game}</Badge>
                    ))}
                  </div>
                </div>
              </div>

              {party.description && (
                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm">{party.description}</p>
                </div>
              )}

              {/* Map Placeholder */}
              <div className="overflow-hidden rounded-xl border border-border">
                <div className="flex h-40 items-center justify-center bg-muted">
                  <div className="text-center">
                    <MapPin className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      View on Google Maps
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Players */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Players</span>
                <Badge variant="outline">
                  {party.players.length}/{party.maxPlayers}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {party.players.map((player, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{player.role}</p>
                    </div>
                  </div>
                  {player.arrived ? (
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

              {party.players.length < party.maxPlayers && (
                <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border p-4 text-muted-foreground">
                  <Users className="h-5 w-5" />
                  <span className="text-sm">
                    {party.maxPlayers - party.players.length} spots available
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card className="mt-6 border-2">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row">
            <Button variant="outline" className="flex-1 gap-2">
              <MessageCircle className="h-4 w-4" />
              Message Group
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Navigation className="h-4 w-4" />
              Get Directions
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
