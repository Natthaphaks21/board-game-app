"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { MainNav } from '@/components/navigation/main-nav'
import { useAuth } from '@/contexts/auth-context'
import { 
  Gamepad2, 
  Package, 
  Calendar, 
  Clock, 
  ArrowRight,
  Plus,
  Minus,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

const availableGames = [
  { id: '1', name: 'Catan', category: 'Strategy', available: true },
  { id: '2', name: 'Ticket to Ride', category: 'Family', available: true },
  { id: '3', name: 'Codenames', category: 'Party', available: true },
  { id: '4', name: 'Wingspan', category: 'Strategy', available: false },
  { id: '5', name: 'Azul', category: 'Abstract', available: true },
  { id: '6', name: 'Pandemic', category: 'Cooperative', available: true },
]

interface BorrowedGame {
  id: string
  name: string
  borrowedDate: string
  dueDate: string
}

export default function GameSlotsPage() {
  const { user, useSlot, returnSlot } = useAuth()
  const router = useRouter()
  const [borrowedGames, setBorrowedGames] = useState<BorrowedGame[]>([
    { id: '1', name: 'Catan', borrowedDate: 'Mar 28, 2026', dueDate: 'Apr 28, 2026' },
  ])

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.subscription === 'free') {
      router.push('/home')
    }
  }, [user, router])

  if (!user || user.subscription === 'free') return null

  const slotsUsed = borrowedGames.length
  const totalSlots = user.gameSlots
  const slotsAvailable = totalSlots - slotsUsed
  const usagePercentage = (slotsUsed / totalSlots) * 100

  const handleBorrowGame = (gameId: string, gameName: string) => {
    if (slotsAvailable <= 0) {
      toast.error('No slots available. Return a game first.')
      return
    }

    const newGame: BorrowedGame = {
      id: gameId,
      name: gameName,
      borrowedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    }

    setBorrowedGames([...borrowedGames, newGame])
    useSlot()
    toast.success(`${gameName} has been borrowed!`)
  }

  const handleReturnGame = (gameId: string) => {
    setBorrowedGames(borrowedGames.filter(g => g.id !== gameId))
    returnSlot()
    toast.success('Game returned successfully!')
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Game Slots</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your borrowed games and available slots
          </p>
        </div>

        {/* Slots Overview */}
        <Card className="mb-8 border-2 border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                  <Gamepad2 className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {slotsAvailable} of {totalSlots} Slots Available
                  </h2>
                  <p className="text-muted-foreground capitalize">
                    {user.subscription} Plan
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Progress value={usagePercentage} className="h-3 w-full md:w-64" />
                <p className="text-right text-sm text-muted-foreground">
                  {slotsUsed} borrowed • {slotsAvailable} available
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Currently Borrowed */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-accent" />
                Currently Borrowed
              </CardTitle>
              <CardDescription>
                Games you have checked out
              </CardDescription>
            </CardHeader>
            <CardContent>
              {borrowedGames.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">No games borrowed yet</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Browse available games to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {borrowedGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between rounded-xl border border-border p-4"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                          <Gamepad2 className="h-6 w-6 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{game.name}</h3>
                          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Borrowed: {game.borrowedDate}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Due: {game.dueDate}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReturnGame(game.id)}
                        className="gap-1"
                      >
                        <Minus className="h-4 w-4" />
                        Return
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available to Borrow */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gamepad2 className="h-5 w-5 text-primary" />
                Available Games
              </CardTitle>
              <CardDescription>
                Browse and borrow from our library
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableGames.map((game) => {
                  const isBorrowed = borrowedGames.some(b => b.name === game.name)
                  return (
                    <div
                      key={game.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <Gamepad2 className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{game.name}</p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {game.category}
                          </Badge>
                        </div>
                      </div>
                      {isBorrowed ? (
                        <Badge variant="secondary">Borrowed</Badge>
                      ) : !game.available ? (
                        <Badge variant="outline" className="text-muted-foreground">
                          Unavailable
                        </Badge>
                      ) : slotsAvailable <= 0 ? (
                        <Button size="sm" variant="outline" disabled>
                          No Slots
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleBorrowGame(game.id, game.name)}
                          className="gap-1"
                        >
                          <Plus className="h-4 w-4" />
                          Borrow
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Slot Info */}
        {slotsAvailable === 0 && (
          <Card className="mt-8 border-2 border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-4 p-4">
              <AlertCircle className="h-8 w-8 text-destructive" />
              <div>
                <h3 className="font-semibold">All slots in use</h3>
                <p className="text-sm text-muted-foreground">
                  Return a game to borrow another, or upgrade your plan for more slots.
                </p>
              </div>
              <Button variant="outline" className="ml-auto gap-1">
                Upgrade Plan
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
