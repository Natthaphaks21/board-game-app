"use client"

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  AlertCircle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'

interface BorrowedGame {
  itemId: string
  name: string
  category: string
  imageUrl: string | null
  borrowedDate: string
  dueDate: string
}

interface AvailableGame {
  itemId: string
  name: string
  category: string
  imageUrl: string | null
  available: boolean
}

interface BorrowGamesPayload {
  isMember: boolean
  borrowedGames: BorrowedGame[]
  availableGames: AvailableGame[]
}

function GameCover({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  if (!imageUrl) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
        <ImageIcon className="h-5 w-5 text-muted-foreground" />
      </div>
    )
  }

  return (
    <img
      src={imageUrl}
      alt={name}
      className="h-12 w-12 rounded-xl object-cover"
      loading="lazy"
    />
  )
}

export default function GameSlotsPage() {
  const { user } = useAuth()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isMemberRow, setIsMemberRow] = useState(true)
  const [borrowedGames, setBorrowedGames] = useState<BorrowedGame[]>([])
  const [availableGames, setAvailableGames] = useState<AvailableGame[]>([])

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
    if (user.subscription === 'free') {
      router.push('/home')
    }
  }, [user, router])

  const loadBorrowData = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/borrow-games', { cache: 'no-store' })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null
        throw new Error(payload?.error ?? 'Unable to load borrowed games')
      }

      const payload = (await response.json()) as BorrowGamesPayload
      setIsMemberRow(payload.isMember)
      setBorrowedGames(payload.borrowedGames ?? [])
      setAvailableGames(payload.availableGames ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to load games')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user || user.subscription === 'free') return
    void loadBorrowData()
  }, [loadBorrowData, user])

  if (!user || user.subscription === 'free') return null

  const slotsUsed = borrowedGames.length
  const totalSlots = user.gameSlots
  const slotsAvailable = totalSlots - slotsUsed
  const usagePercentage = totalSlots > 0 ? (slotsUsed / totalSlots) * 100 : 0

  const borrowedNames = useMemo(
    () => new Set(borrowedGames.map((game) => game.name)),
    [borrowedGames]
  )

  const handleBorrowGame = async (itemId: string, gameName: string) => {
    if (slotsAvailable <= 0) {
      toast.error('No slots available. Return a game first.')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/borrow-games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to borrow game')
      }

      toast.success(`${gameName} has been borrowed!`)
      await loadBorrowData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to borrow game')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReturnGame = async (itemId: string) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/borrow-games/${itemId}/return`, {
        method: 'POST',
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Unable to return game')
      }

      toast.success('Game returned successfully!')
      await loadBorrowData()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to return game')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Game Slots</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your borrowed games and available slots
          </p>
        </div>

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

        {!isMemberRow ? (
          <Card className="mb-8 border-2 border-destructive/50 bg-destructive/5">
            <CardContent className="flex items-center gap-3 p-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <p className="text-sm">
                Your account is not in `members` table yet. Please insert your `uid` into `members(vid)` in Supabase first.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {isLoading ? (
          <Card className="border-2">
            <CardContent className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading games...
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-8 lg:grid-cols-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-accent" />
                  Currently Borrowed
                </CardTitle>
                <CardDescription>Games you have checked out</CardDescription>
              </CardHeader>
              <CardContent>
                {borrowedGames.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">No games borrowed yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">Browse available games to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {borrowedGames.map((game) => (
                      <div
                        key={game.itemId}
                        className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <GameCover imageUrl={game.imageUrl} name={game.name} />
                          <div>
                            <h3 className="font-semibold">{game.name}</h3>
                            <Badge variant="outline" className="mt-1 text-xs">{game.category}</Badge>
                            <div className="mt-2 flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:gap-3">
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
                          onClick={() => handleReturnGame(game.itemId)}
                          className="gap-1"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Minus className="h-4 w-4" />}
                          Return
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-primary" />
                  Available Games
                </CardTitle>
                <CardDescription>Browse and borrow from our library</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {availableGames.map((game) => {
                    const isBorrowed = borrowedNames.has(game.name)

                    return (
                      <div
                        key={game.itemId}
                        className="flex flex-col gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-muted/50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <GameCover imageUrl={game.imageUrl} name={game.name} />
                          <div>
                            <p className="font-medium">{game.name}</p>
                            <Badge variant="outline" className="mt-1 text-xs">
                              {game.category}
                            </Badge>
                          </div>
                        </div>

                        {isBorrowed ? (
                          <Badge variant="secondary">Borrowed</Badge>
                        ) : slotsAvailable <= 0 ? (
                          <Button size="sm" variant="outline" disabled>
                            No Slots
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleBorrowGame(game.itemId, game.name)}
                            className="gap-1"
                            disabled={isSubmitting || !isMemberRow}
                          >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            Borrow
                          </Button>
                        )}
                      </div>
                    )
                  })}

                  {availableGames.length === 0 ? (
                    <p className="rounded-lg border border-border p-4 text-center text-sm text-muted-foreground">
                      No available physical game items in stock.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {slotsAvailable === 0 ? (
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
        ) : null}
      </main>
    </div>
  )
}
