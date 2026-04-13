"use client"

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MainNav } from '@/components/navigation/main-nav'
import { useAuth } from '@/contexts/auth-context'
import { DiceIcon } from '@/components/icons/dice-icon'
import { Button } from '@/components/ui/button'
import { 
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  CheckCircle2,
  Star,
  Gamepad2,
  ArrowLeft
} from 'lucide-react'

interface HistoryParty {
  id: string
  name: string
  role: 'host' | 'player'
  location: string
  date: string
  time: string
  players: string[]
  games: string[]
  arrived: boolean
  rating?: number
}

const mockHistory: HistoryParty[] = [
  {
    id: '1',
    name: 'Friday Night Catan',
    role: 'player',
    location: 'Board Game Cafe',
    date: 'Mar 28, 2026',
    time: '7:00 PM',
    players: ['Alex M.', 'You', 'Jamie L.', 'Chris P.'],
    games: ['Catan'],
    arrived: true,
    rating: 5,
  },
  {
    id: '2',
    name: 'Strategy Saturday',
    role: 'host',
    location: 'The Game Hub',
    date: 'Mar 22, 2026',
    time: '2:00 PM',
    players: ['You', 'Sarah K.', 'Mike R.'],
    games: ['Ticket to Ride', 'Azul'],
    arrived: true,
    rating: 4,
  },
  {
    id: '3',
    name: 'Party Game Night',
    role: 'player',
    location: 'Meeples Bar',
    date: 'Mar 15, 2026',
    time: '8:00 PM',
    players: ['Lisa P.', 'Tom W.', 'You', 'Emma D.'],
    games: ['Codenames', 'Wavelength'],
    arrived: true,
    rating: 5,
  },
  {
    id: '4',
    name: 'Euro Games Day',
    role: 'player',
    location: 'Community Library',
    date: 'Mar 8, 2026',
    time: '1:00 PM',
    players: ['Jordan K.', 'You'],
    games: ['Wingspan'],
    arrived: false,
  },
]

export default function HistoryPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const totalParties = mockHistory.length
  const arrivedParties = mockHistory.filter(p => p.arrived).length
  const attendanceRate = Math.round((arrivedParties / totalParties) * 100)

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/lobby')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Lobby
        </Button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Party History</h1>
          <p className="mt-2 text-muted-foreground">
            Your past game nights and attendance record
          </p>
        </div>

        {/* Stats */}
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

        {/* History List */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Past Parties</CardTitle>
            <CardDescription>Your game night history</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockHistory.map((party) => (
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
                      <Badge variant={party.role === 'host' ? 'default' : 'secondary'} className="text-xs">
                        {party.role === 'host' ? 'Hosted' : 'Joined'}
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
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {party.games.map(game => (
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

                  {party.rating && (
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < party.rating!
                              ? 'fill-secondary-foreground text-secondary-foreground'
                              : 'text-muted'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex -space-x-2">
                    {party.players.slice(0, 4).map((player, i) => (
                      <Avatar key={i} className="h-6 w-6 border-2 border-background">
                        <AvatarFallback className="text-xs">{player.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
