"use client"

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MainNav } from '@/components/navigation/main-nav'
import { useAuth } from '@/contexts/auth-context'
import { DiceIcon, MeepleIcon } from '@/components/icons/dice-icon'
import { 
  Plus, 
  Search, 
  Users, 
  MapPin, 
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  Star,
  Crown,
  Gamepad2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Calendar
} from 'lucide-react'

const featuredGames = [
  { name: 'Catan', players: '3-4', time: '60-90 min', rating: 4.8, image: '/games/catan.jpg' },
  { name: 'Ticket to Ride', players: '2-5', time: '45-90 min', rating: 4.7, image: '/games/ticket.jpg' },
  { name: 'Codenames', players: '4-8', time: '15-30 min', rating: 4.9, image: '/games/codenames.jpg' },
  { name: 'Azul', players: '2-4', time: '30-45 min', rating: 4.6, image: '/games/azul.jpg' },
  { name: 'Wingspan', players: '1-5', time: '40-70 min', rating: 4.8, image: '/games/wingspan.jpg' },
  { name: 'Pandemic', players: '2-4', time: '45 min', rating: 4.5, image: '/games/pandemic.jpg' },
]

const upcomingParties = [
  {
    id: '1',
    name: 'Friday Night Catan',
    host: 'Alex M.',
    hostRating: 4.8,
    location: 'Board Game Cafe',
    address: '123 Sukhumvit Rd',
    date: 'Tomorrow',
    time: '7:00 PM',
    players: 3,
    maxPlayers: 4,
    game: 'Catan',
    tags: ['Strategy', 'Beginner Friendly'],
  },
  {
    id: '2',
    name: 'Weekend Strategy',
    host: 'Sarah K.',
    hostRating: 4.9,
    location: 'The Game Hub',
    address: '456 Ratchada Rd',
    date: 'Sat',
    time: '2:00 PM',
    players: 2,
    maxPlayers: 6,
    game: 'Ticket to Ride',
    tags: ['Strategy', 'All Levels'],
  },
  {
    id: '3',
    name: 'Party Game Night',
    host: 'Mike R.',
    hostRating: 4.6,
    location: 'Meeples Bar',
    address: '789 Silom Rd',
    date: 'Sun',
    time: '8:00 PM',
    players: 4,
    maxPlayers: 8,
    game: 'Codenames',
    tags: ['Party', 'Casual'],
  },
  {
    id: '4',
    name: 'Euro Games Sunday',
    host: 'Lisa P.',
    hostRating: 4.7,
    location: 'Community Library',
    address: '321 Rama IV Rd',
    date: 'Sun',
    time: '1:00 PM',
    players: 1,
    maxPlayers: 4,
    game: 'Azul',
    tags: ['Strategy', 'Quiet'],
  },
]

const quickStats = [
  { icon: Users, label: 'Parties Joined', value: '12', color: 'text-primary', bg: 'bg-primary/10' },
  { icon: Gamepad2, label: 'Games Hosted', value: '5', color: 'text-accent', bg: 'bg-accent/10' },
  { icon: TrendingUp, label: 'Games Played', value: '47', color: 'text-chart-3', bg: 'bg-chart-3/10' },
  { icon: Star, label: 'Host Rating', value: '4.8', color: 'text-secondary-foreground', bg: 'bg-secondary' },
]

export default function HomePage() {
  const { user } = useAuth()
  const router = useRouter()
  const partiesScrollRef = useRef<HTMLDivElement>(null)
  const gamesScrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const displayName = user.username || user.name || 'Player'

  const scrollParties = (direction: 'left' | 'right') => {
    if (partiesScrollRef.current) {
      const scrollAmount = 340
      partiesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  const scrollGames = (direction: 'left' | 'right') => {
    if (gamesScrollRef.current) {
      const scrollAmount = 200
      gamesScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Back to Login Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </Button>

        {/* Welcome Section */}
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground md:text-4xl">
              Welcome back, {displayName}!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Ready for your next game night adventure?
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button 
              size="lg" 
              className="w-full gap-2 sm:w-auto"
              onClick={() => router.push('/parties/create')}
            >
              <Plus className="h-5 w-5" />
              Create Party
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="w-full gap-2 sm:w-auto"
              onClick={() => router.push('/parties/join')}
            >
              <Search className="h-5 w-5" />
              Find Parties
            </Button>
          </div>
        </div>

        {/* Quick Stats - 4 in 1 Card */}
        <Card className="mb-8 border-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {quickStats.map((stat) => (
                <div key={stat.label} className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-muted/50">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Nearby Parties - Horizontal Scroll */}
        <div className="mb-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-xl font-bold">
                <Sparkles className="h-5 w-5 text-primary" />
                Nearby Parties
              </h2>
              <p className="text-sm text-muted-foreground">Join a game near you</p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="icon" onClick={() => scrollParties('left')}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => scrollParties('right')}>
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Link href="/parties/join">
                <Button variant="ghost" size="sm" className="gap-1">
                  View All
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
          
          <div 
            ref={partiesScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {upcomingParties.map((party) => (
              <Card 
                key={party.id} 
                className="min-w-[280px] flex-shrink-0 cursor-pointer border-2 transition-all hover:border-primary/50 hover:shadow-lg sm:min-w-[320px]"
                onClick={() => router.push(`/parties/${party.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <DiceIcon className="h-7 w-7 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {party.players}/{party.maxPlayers}
                    </Badge>
                  </div>
                  
                  <h3 className="mt-3 font-bold text-lg">{party.name}</h3>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-xs">{party.host.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">{party.host}</span>
                    <span className="flex items-center gap-0.5 text-xs">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      {party.hostRating}
                    </span>
                  </div>

                  <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{party.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{party.date}, {party.time}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <Badge className="text-xs">{party.game}</Badge>
                    {party.tags.slice(0, 2).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>

                  <Button className="mt-4 w-full" size="sm">
                    Join Party
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Popular Games - Horizontal Scroll */}
          <div className="lg:col-span-2">
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <MeepleIcon className="h-5 w-5 text-accent" />
                    Popular Games
                  </CardTitle>
                  <CardDescription>Top rated this week</CardDescription>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <Button variant="ghost" size="icon" onClick={() => scrollGames('left')}>
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => scrollGames('right')}>
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div 
                  ref={gamesScrollRef}
                  className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {featuredGames.map((game, index) => (
                    <div
                      key={game.name}
                      className="min-w-[160px] flex-shrink-0 cursor-pointer rounded-xl border border-border p-3 transition-all hover:border-primary/50 hover:bg-muted/50"
                    >
                      <div className="flex h-20 w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                        <span className="text-3xl font-bold text-primary/50">#{index + 1}</span>
                      </div>
                      <h4 className="mt-2 font-semibold">{game.name}</h4>
                      <p className="text-xs text-muted-foreground">{game.players} players</p>
                      <div className="mt-1.5 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{game.time}</span>
                        <span className="flex items-center gap-0.5 text-xs font-medium">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          {game.rating}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Membership Card */}
            {user.isMember ? (
              <Card className="border-2 border-primary/50 bg-primary/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold capitalize">{user.subscriptionPlan} Member</p>
                      <p className="text-sm text-muted-foreground">
                        {user.gameSlots - user.usedSlots} game slots available
                      </p>
                    </div>
                  </div>
                  <Link href="/game-slots">
                    <Button className="mt-4 w-full" variant="outline">
                      <Gamepad2 className="mr-2 h-4 w-4" />
                      Manage Game Slots
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-2 border-accent/50 bg-accent/5">
                <CardContent className="p-4">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent">
                    <Crown className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold">Become a Member</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Borrow board games and enjoy exclusive perks!
                  </p>
                  <Link href="/membership">
                    <Button className="mt-4 w-full">
                      <Crown className="mr-2 h-4 w-4" />
                      View Plans
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="border-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href="/parties/create" className="block">
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                      <Plus className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Create a Party</p>
                      <p className="text-xs text-muted-foreground">Host your own game night</p>
                    </div>
                  </div>
                </Link>
                <Link href="/parties/join" className="block">
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
                      <Search className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Find Parties</p>
                      <p className="text-xs text-muted-foreground">Discover nearby games</p>
                    </div>
                  </div>
                </Link>
                <Link href="/my-parties" className="block">
                  <div className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary">
                      <Users className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">My Parties</p>
                      <p className="text-xs text-muted-foreground">View your upcoming events</p>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
