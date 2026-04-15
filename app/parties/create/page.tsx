"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
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
  MapPin, 
  Calendar, 
  Users, 
  Tag,
  Clock,
  Search,
  Check,
  X,
  Gamepad2,
  ArrowLeft,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

const fallbackGames = [
  { id: 'fallback-1', name: 'Catan' },
  { id: 'fallback-2', name: 'Ticket to Ride' },
  { id: 'fallback-3', name: 'Codenames' },
  { id: 'fallback-4', name: 'Wingspan' },
]

const venueTypes = [
  { id: 'cafe', name: 'Board Game Cafe', icon: '☕' },
  { id: 'restaurant', name: 'Restaurant', icon: '🍽️' },
  { id: 'bar', name: 'Bar/Pub', icon: '🍺' },
  { id: 'library', name: 'Library', icon: '📚' },
  { id: 'community', name: 'Community Center', icon: '🏢' },
]

interface PlaceSuggestion {
  placeId: string
  displayName: string
  formattedAddress: string
  latitude: number | null
  longitude: number | null
  types: string[]
  primaryType: string | null
  googleMapsUri: string | null
  isPublicVenue: boolean
}

interface GameOption {
  id: string
  name: string
}

export default function CreatePartyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false)
  const [isLoadingGames, setIsLoadingGames] = useState(false)
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null)
  const [gamesCatalogue, setGamesCatalogue] = useState<GameOption[]>(fallbackGames)
  const [placeError, setPlaceError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    newTag: '',
    venueType: '',
    locationName: '',
    locationAddress: '',
    date: '',
    time: '',
    maxPlayers: '4',
    selectedGames: [] as string[],
    gameSearch: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
  }, [user, router])

  useEffect(() => {
    if (!user) return

    const loadGames = async () => {
      setIsLoadingGames(true)
      try {
        const response = await fetch('/api/games', { cache: 'no-store' })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(payload?.error || 'Unable to load game catalogue')
        }

        const payload = (await response.json()) as { games: GameOption[] }
        const games = payload.games?.filter((game) => game.name.trim().length > 0) ?? []
        if (games.length > 0) {
          setGamesCatalogue(games)
        }
      } catch (error) {
        toast.warning(error instanceof Error ? error.message : 'Using fallback games list')
      } finally {
        setIsLoadingGames(false)
      }
    }

    void loadGames()
  }, [user])

  useEffect(() => {
    if (step !== 2) return

    const query = formData.locationAddress.trim()
    if (query.length < 3 || !formData.venueType) {
      setPlaceSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      setIsSearchingPlaces(true)
      try {
        const response = await fetch(
          `/api/places/search?q=${encodeURIComponent(query)}&venueType=${encodeURIComponent(formData.venueType)}`,
          { signal: controller.signal }
        )

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(payload?.error || 'Unable to search locations')
        }

        const payload = (await response.json()) as { places: PlaceSuggestion[] }
        setPlaceSuggestions(payload.places)
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setPlaceSuggestions([])
          setPlaceError(error instanceof Error ? error.message : 'Unable to search locations')
        }
      } finally {
        setIsSearchingPlaces(false)
      }
    }, 350)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [formData.locationAddress, formData.venueType, step])

  if (!user) return null

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    if (name === 'locationAddress') {
      setSelectedPlace(null)
      setPlaceError('')
    }
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const addTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag],
        newTag: '',
      }))
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }))
  }

  const toggleGame = (gameId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedGames: prev.selectedGames.includes(gameId)
        ? prev.selectedGames.filter(g => g !== gameId)
        : [...prev.selectedGames, gameId],
    }))
  }

  const filteredGames = gamesCatalogue.filter(game =>
    game.name.toLowerCase().includes(formData.gameSearch.toLowerCase())
  )

  const handleSelectPlace = (place: PlaceSuggestion) => {
    setSelectedPlace(place)
    setPlaceSuggestions([])
    setPlaceError('')
    setFormData(prev => ({
      ...prev,
      locationName: place.displayName,
      locationAddress: place.formattedAddress,
    }))
  }

  const handleSubmit = async () => {
    if (!selectedPlace || !selectedPlace.isPublicVenue) {
      setStep(2)
      setPlaceError('Please choose a public venue from Google Maps results.')
      return
    }

    setIsSubmitting(true)
    try {
      const selectedGameNames = formData.selectedGames
        .map((gameId) => gamesCatalogue.find((game) => game.id === gameId)?.name)
        .filter((gameName): gameName is string => Boolean(gameName))

      const response = await fetch('/api/parties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partyName: formData.name,
          description: formData.description,
          tags: formData.tags,
          venueType: formData.venueType,
          date: formData.date,
          time: formData.time,
          maxPlayers: Number(formData.maxPlayers),
          selectedGames: selectedGameNames,
          place: selectedPlace,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || 'Unable to create party')
      }

      toast.success('Party created successfully!')
      router.push('/my-parties')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to create party')
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.length >= 3
      case 2:
        return Boolean(formData.venueType && selectedPlace?.isPublicVenue)
      case 3:
        return formData.date && formData.time
      case 4:
        return formData.selectedGames.length > 0
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="mx-auto max-w-3xl px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/home">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <DiceIcon className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create a Party</h1>
          <p className="mt-2 text-muted-foreground">
            Set up your game night and invite players
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center justify-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  s <= step
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {s}
              </div>
              {s < 4 && (
                <div
                  className={`h-1 w-8 transition-colors md:w-16 ${
                    s < step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Steps */}
        <Card className="border-2">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Party Details</CardTitle>
                <CardDescription>
                  Give your party a name and add some tags
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Party Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Friday Night Catan"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="h-12"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your party..."
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tags</Label>
                  <div className="flex gap-2">
                    <Input
                      name="newTag"
                      placeholder="Add a tag"
                      value={formData.newTag}
                      onChange={handleInputChange}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      className="flex-1"
                    />
                    <Button type="button" variant="secondary" onClick={addTag}>
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1 pr-1"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="ml-1 rounded-full hover:bg-muted"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <MapPin className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Location</CardTitle>
                <CardDescription>
                  Choose a public venue for your party (restaurants, cafes, etc.)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Venue Type</Label>
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                    {venueTypes.map((venue) => (
                      <button
                        key={venue.id}
                        type="button"
                        onClick={() => {
                          setSelectedPlace(null)
                          setPlaceSuggestions([])
                          setPlaceError('')
                          setFormData(prev => ({
                            ...prev,
                            venueType: venue.id,
                            locationName: '',
                          }))
                        }}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-colors ${
                          formData.venueType === venue.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <span className="text-2xl">{venue.icon}</span>
                        <span className="text-sm font-medium">{venue.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationAddress">Search Public Venue (Google Maps)</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="locationAddress"
                      name="locationAddress"
                      placeholder="Search cafes, restaurants, libraries..."
                      value={formData.locationAddress}
                      onChange={handleInputChange}
                      className="h-12 pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You must select from Google Maps results. Only public venues are allowed.
                  </p>
                </div>

                {isSearchingPlaces ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching Google Maps...
                  </div>
                ) : null}

                {placeSuggestions.length > 0 ? (
                  <div className="max-h-64 space-y-2 overflow-y-auto rounded-xl border border-border p-2">
                    {placeSuggestions.map((place) => (
                      <button
                        key={place.placeId}
                        type="button"
                        onClick={() => handleSelectPlace(place)}
                        className="w-full rounded-lg border border-border p-3 text-left transition-colors hover:bg-muted/50"
                      >
                        <p className="font-medium">{place.displayName}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{place.formattedAddress}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {place.types.slice(0, 3).map((type) => (
                            <Badge key={type} variant="outline" className="text-[10px] uppercase">
                              {type.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}

                {selectedPlace ? (
                  <div className="rounded-xl border border-primary/40 bg-primary/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{selectedPlace.displayName}</p>
                        <p className="text-sm text-muted-foreground">{selectedPlace.formattedAddress}</p>
                      </div>
                      <Badge>Public Venue</Badge>
                    </div>
                  </div>
                ) : null}

                {placeError ? (
                  <p className="text-sm text-destructive">{placeError}</p>
                ) : null}
              </CardContent>
            </>
          )}

          {/* Step 3: Date & Time */}
          {step === 3 && (
            <>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
                  <Calendar className="h-6 w-6 text-secondary-foreground" />
                </div>
                <CardTitle>Date & Time</CardTitle>
                <CardDescription>
                  When will your party happen?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date
                    </Label>
                    <Input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleInputChange}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time" className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Time
                    </Label>
                    <Input
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Maximum Players
                  </Label>
                  <Select
                    value={formData.maxPlayers}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, maxPlayers: value }))}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} players
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {/* Step 4: Games */}
          {step === 4 && (
            <>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-chart-3/10">
                  <Gamepad2 className="h-6 w-6 text-chart-3" />
                </div>
                <CardTitle>Select Games</CardTitle>
                <CardDescription>
                  Choose the games you want to play
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    name="gameSearch"
                    placeholder="Search games..."
                    value={formData.gameSearch}
                    onChange={handleInputChange}
                    className="h-12 pl-10"
                  />
                </div>

                {formData.selectedGames.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.selectedGames.map((gameId) => {
                      const game = gamesCatalogue.find(g => g.id === gameId)
                      return game ? (
                        <Badge
                          key={gameId}
                          variant="default"
                          className="gap-1 pr-1"
                        >
                          {game.name}
                          <button
                            type="button"
                            onClick={() => toggleGame(gameId)}
                            className="ml-1 rounded-full hover:bg-primary-foreground/20"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}

                {isLoadingGames ? (
                  <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading game catalogue...
                  </div>
                ) : null}

                <div className="grid gap-3 md:grid-cols-2">
                  {filteredGames.map((game) => {
                    const isSelected = formData.selectedGames.includes(game.id)
                    return (
                      <button
                        key={game.id}
                        type="button"
                        onClick={() => toggleGame(game.id)}
                        className={`flex items-center justify-between rounded-xl border-2 p-4 transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                            <Gamepad2 className="h-5 w-5 text-secondary-foreground" />
                          </div>
                          <div className="text-left">
                            <p className="font-medium">{game.name}</p>
                            <p className="text-xs text-muted-foreground">
                              From Supabase catalogue
                            </p>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </button>
                    )
                  })}
                </div>

                {!isLoadingGames && filteredGames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No games found. Add rows to `board_game_catalogue` in Supabase.
                  </p>
                ) : null}
              </CardContent>
            </>
          )}

          {/* Navigation */}
          <CardContent className="pt-0">
            <div className="flex gap-3">
              {step > 1 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                className="flex-1"
                onClick={() => (step < 4 ? setStep(step + 1) : handleSubmit())}
                disabled={!isStepValid() || isSubmitting}
              >
                {step < 4 ? (
                  'Continue'
                ) : (
                  <span className="flex items-center gap-2">
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Create Party
                  </span>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
