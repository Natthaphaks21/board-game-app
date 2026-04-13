"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MainNav } from '@/components/navigation/main-nav'
import { useAuth } from '@/contexts/auth-context'
import { DiceIcon } from '@/components/icons/dice-icon'
import { 
  Search, 
  MapPin, 
  Calendar, 
  Users, 
  Clock,
  Filter,
  SlidersHorizontal,
  ArrowUpDown,
  Star,
  Gamepad2,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'

interface Party {
  id: string
  name: string
  host: {
    name: string
    avatar?: string
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
  distance: string
}

const mockParties: Party[] = [
  {
    id: '1',
    name: 'Friday Night Catan',
    host: { name: 'Alex M.', rating: 4.8 },
    location: 'Board Game Cafe',
    address: '123 Main St',
    date: 'Apr 4, 2026',
    time: '7:00 PM',
    players: 2,
    maxPlayers: 4,
    games: ['Catan'],
    tags: ['Strategy', 'Beginner Friendly'],
    distance: '0.5 mi',
  },
  {
    id: '2',
    name: 'Weekend Strategy Session',
    host: { name: 'Sarah K.', rating: 4.9 },
    location: 'The Game Hub',
    address: '456 Oak Ave',
    date: 'Apr 5, 2026',
    time: '2:00 PM',
    players: 3,
    maxPlayers: 6,
    games: ['Ticket to Ride', 'Wingspan'],
    tags: ['Strategy', 'All Levels'],
    distance: '1.2 mi',
  },
  {
    id: '3',
    name: 'Party Game Night',
    host: { name: 'Mike R.', rating: 4.6 },
    location: 'Meeples Bar',
    address: '789 Elm St',
    date: 'Apr 5, 2026',
    time: '8:00 PM',
    players: 4,
    maxPlayers: 8,
    games: ['Codenames', 'Wavelength'],
    tags: ['Party', 'Casual'],
    distance: '2.0 mi',
  },
  {
    id: '4',
    name: 'Euro Games Sunday',
    host: { name: 'Lisa P.', rating: 4.7 },
    location: 'Community Library',
    address: '321 Park Blvd',
    date: 'Apr 6, 2026',
    time: '1:00 PM',
    players: 1,
    maxPlayers: 4,
    games: ['Azul', 'Splendor'],
    tags: ['Strategy', 'Quiet'],
    distance: '0.8 mi',
  },
  {
    id: '5',
    name: 'Heavy Strategy Night',
    host: { name: 'Tom W.', rating: 5.0 },
    location: 'Dice & Cardboard',
    address: '555 Game Way',
    date: 'Apr 7, 2026',
    time: '6:00 PM',
    players: 2,
    maxPlayers: 5,
    games: ['Terraforming Mars'],
    tags: ['Heavy', 'Experienced'],
    distance: '3.5 mi',
  },
]

type SortOption = 'date' | 'distance' | 'players' | 'rating'

export default function JoinPartyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('date')
  const [filterTag, setFilterTag] = useState<string>('all')
  const [parties, setParties] = useState<Party[]>(mockParties)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const allTags = Array.from(new Set(mockParties.flatMap(p => p.tags)))

  const filteredParties = parties
    .filter(party => {
      const matchesSearch = 
        party.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        party.games.some(g => g.toLowerCase().includes(searchQuery.toLowerCase())) ||
        party.location.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesTag = filterTag === 'all' || party.tags.includes(filterTag)
      
      return matchesSearch && matchesTag
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return parseFloat(a.distance) - parseFloat(b.distance)
        case 'players':
          return (b.maxPlayers - b.players) - (a.maxPlayers - a.players)
        case 'rating':
          return b.host.rating - a.host.rating
        case 'date':
        default:
          return new Date(a.date).getTime() - new Date(b.date).getTime()
      }
    })

  const handleJoinRequest = (partyId: string, partyName: string) => {
    toast.success(`Join request sent for "${partyName}"!`, {
      description: 'The host will review your request.',
    })
    router.push(`/parties/${partyId}/waiting`)
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Find a Party</h1>
          <p className="mt-2 text-muted-foreground">
            Discover game nights near you
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6 border-2">
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, game, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="w-40 gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tags</SelectItem>
                    {allTags.map(tag => (
                      <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                  <SelectTrigger className="w-40 gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue placeholder="Sort" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="distance">Distance</SelectItem>
                    <SelectItem value="players">Spots Available</SelectItem>
                    <SelectItem value="rating">Host Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filteredParties.length} parties found
          </p>
          <Button variant="ghost" size="sm" className="gap-2">
            <SlidersHorizontal className="h-4 w-4" />
            More Filters
          </Button>
        </div>

        {/* Party List */}
        <div className="space-y-4">
          {filteredParties.map((party) => (
            <Card 
              key={party.id} 
              className="border-2 transition-colors hover:border-primary/50"
            >
              <CardContent className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  {/* Party Info */}
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                      <DiceIcon className="h-10 w-10 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold">{party.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {party.distance}
                        </Badge>
                      </div>
                      
                      {/* Host Info */}
                      <div className="mt-1 flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={party.host.avatar} />
                          <AvatarFallback className="text-xs">
                            {party.host.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-muted-foreground">
                          {party.host.name}
                        </span>
                        <span className="flex items-center gap-1 text-sm">
                          <Star className="h-3 w-3 fill-secondary-foreground text-secondary-foreground" />
                          {party.host.rating}
                        </span>
                      </div>

                      {/* Details */}
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

                      {/* Games and Tags */}
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        {party.games.map(game => (
                          <Badge key={game} className="gap-1">
                            <Gamepad2 className="h-3 w-3" />
                            {game}
                          </Badge>
                        ))}
                        {party.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        {party.players}/{party.maxPlayers}
                      </span>
                    </div>
                    <Button 
                      onClick={() => handleJoinRequest(party.id, party.name)}
                      disabled={party.players >= party.maxPlayers}
                    >
                      {party.players >= party.maxPlayers ? 'Full' : 'Request to Join'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredParties.length === 0 && (
          <Card className="border-2">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No parties found</h3>
              <p className="mt-1 text-muted-foreground">
                Try adjusting your search or filters
              </p>
              <Button className="mt-4" onClick={() => router.push('/parties/create')}>
                Create Your Own Party
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
