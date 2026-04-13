"use client"

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { MainNav } from '@/components/navigation/main-nav'
import { useAuth } from '@/contexts/auth-context'
import { DiceIcon } from '@/components/icons/dice-icon'
import { 
  MapPin, 
  Calendar, 
  Clock, 
  Users, 
  Crown,
  Gamepad2,
  MessageCircle,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Navigation,
  QrCode,
  Scan,
  Camera
} from 'lucide-react'
import { toast } from 'sonner'

// Mock data - in real app this would come from API
const mockParty = {
  pid: 1,
  party_name: 'Friday Night Catan',
  location_data: JSON.stringify({
    name: 'The Board Game Cafe',
    address: '123 Sukhumvit Rd, Bangkok',
    type: 'cafe',
  }),
  host_id: 1,
  created_at: '2024-01-15T10:00:00Z',
  date: '2024-01-20',
  time: '19:00',
  maxPlayers: 6,
  description: 'Join us for an epic night of Catan! All skill levels welcome.',
  games: ['Catan', 'Ticket to Ride'],
  tags: ['Strategy', 'Competitive', 'Beginners Welcome'],
}

const mockHost = {
  uid: 1,
  name: 'John',
  surname: 'Doe',
  username: 'johnd',
  avatar: null,
}

const mockMembers = [
  { uid: 2, name: 'Jane', surname: 'Smith', username: 'janes', avatar: null, status: 'accepted', arrivedAt: null },
  { uid: 3, name: 'Mike', surname: 'Johnson', username: 'mikej', avatar: null, status: 'accepted', arrivedAt: '2024-01-20T18:45:00Z' },
  { uid: 4, name: 'Sarah', surname: 'Williams', username: 'sarahw', avatar: null, status: 'accepted', arrivedAt: null },
]

export default function PartyLobbyPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [hasArrived, setHasArrived] = useState(false)
  const [party] = useState(mockParty)
  const [host] = useState(mockHost)
  const [members, setMembers] = useState(mockMembers)
  const [showHostQR, setShowHostQR] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [scanResult, setScanResult] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/')
    }
  }, [user, router])

  if (!user) return null

  const location = JSON.parse(party.location_data)
  const partyDate = new Date(party.date)
  const isHost = user.uid === host.uid || user.username === host.username
  const arrivedMembers = members.filter(m => m.arrivedAt)

  const handleArrivalConfirm = () => {
    setHasArrived(true)
    toast.success('Arrival confirmed!')
  }

  // Generate a unique QR code data for this party (host shows this QR)
  const qrCodeData = `boardbuddies://party/${params.id}/arrival?host=${host.uid}&timestamp=${Date.now()}`
  
  // Simulated QR code URL (in real app, this would be generated server-side)
  const hostQRCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrCodeData)}`

  // Handle member scanning host's QR code
  const handleScanQR = () => {
    // Simulate successful scan
    setTimeout(() => {
      setScanResult('success')
      setHasArrived(true)
      toast.success('Arrival confirmed via QR scan!')
      setShowScanner(false)
    }, 2000)
  }

  // Handle host confirming member arrival
  const handleConfirmMemberArrival = (memberId: number) => {
    setMembers(prev => prev.map(m => 
      m.uid === memberId 
        ? { ...m, arrivedAt: new Date().toISOString() }
        : m
    ))
    toast.success('Member arrival confirmed!')
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav />
      
      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Back Button */}
        <Button variant="ghost" asChild className="mb-6">
          <Link href="/my-parties">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Parties
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
                  <DiceIcon className="h-8 w-8 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{party.party_name}</h1>
                  <p className="text-muted-foreground">Party Lobby</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {party.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              {members.length + 1}/{party.maxPlayers} Players
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            {/* Party Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Party Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {partyDate.toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">{party.time}</p>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <MapPin className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{location.name}</p>
                    <p className="text-sm text-muted-foreground">{location.address}</p>
                    <Button variant="link" size="sm" className="mt-1 h-auto p-0 text-primary">
                      <Navigation className="mr-1 h-4 w-4" />
                      Open in Google Maps
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Games</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {party.games.map((game) => (
                        <Badge key={game} variant="outline">{game}</Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {party.description && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm text-muted-foreground">Description</p>
                      <p className="mt-1">{party.description}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Arrival Confirmation Card */}
            <Card className={hasArrived ? 'border-primary bg-primary/5' : ''}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className={`h-5 w-5 ${hasArrived ? 'text-primary' : 'text-muted-foreground'}`} />
                  Arrival Confirmation
                </CardTitle>
                <CardDescription>
                  {isHost 
                    ? 'Show the QR code for members to scan when they arrive'
                    : hasArrived 
                      ? 'You have confirmed your arrival. Have fun!'
                      : 'Scan the host\'s QR code or confirm manually when you arrive'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isHost ? (
                  // Host View - Show QR Code for members to scan
                  <div className="space-y-4">
                    <div className="rounded-lg bg-accent/10 p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <QrCode className="h-6 w-6 text-accent" />
                        <div>
                          <p className="font-semibold">Host Arrival QR Code</p>
                          <p className="text-sm text-muted-foreground">
                            Show this QR code for members to scan when they arrive
                          </p>
                        </div>
                      </div>
                      <Dialog open={showHostQR} onOpenChange={setShowHostQR}>
                        <DialogTrigger asChild>
                          <Button className="w-full gap-2">
                            <QrCode className="h-5 w-5" />
                            Show Arrival QR Code
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-sm">
                          <DialogHeader className="text-center">
                            <DialogTitle className="flex items-center justify-center gap-2">
                              <QrCode className="h-5 w-5 text-primary" />
                              Arrival QR Code
                            </DialogTitle>
                            <DialogDescription>
                              Members can scan this to confirm their arrival
                            </DialogDescription>
                          </DialogHeader>
                          <div className="flex flex-col items-center py-4">
                            <div className="rounded-2xl border-4 border-primary p-4 bg-white">
                              <img 
                                src={hostQRCodeUrl}
                                alt="Party Arrival QR Code"
                                className="h-64 w-64"
                              />
                            </div>
                            <p className="mt-4 text-center text-sm text-muted-foreground">
                              Party: {party.party_name}
                            </p>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Manual confirmation for members */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Or confirm member arrivals manually:</p>
                      {members.filter(m => !m.arrivedAt).map((member) => (
                        <div key={member.uid} className="flex items-center justify-between rounded-lg border p-3">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{member.username?.charAt(0) || member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{member.username || member.name}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleConfirmMemberArrival(member.uid)}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Confirm
                          </Button>
                        </div>
                      ))}
                      {members.filter(m => !m.arrivedAt).length === 0 && (
                        <p className="text-sm text-muted-foreground py-2 text-center">
                          All members have confirmed their arrival!
                        </p>
                      )}
                    </div>
                  </div>
                ) : hasArrived ? (
                  // Member View - Already Arrived
                  <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="font-semibold text-primary">Arrival Confirmed!</p>
                      <p className="text-sm text-muted-foreground">
                        Confirmed at {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Member View - Not Yet Arrived
                  <div className="space-y-4">
                    {/* Scan QR Option */}
                    <Dialog open={showScanner} onOpenChange={setShowScanner}>
                      <DialogTrigger asChild>
                        <Button size="lg" className="w-full gap-2">
                          <Scan className="h-5 w-5" />
                          Scan Host&apos;s QR Code
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-sm">
                        <DialogHeader className="text-center">
                          <DialogTitle className="flex items-center justify-center gap-2">
                            <Camera className="h-5 w-5 text-primary" />
                            Scan QR Code
                          </DialogTitle>
                          <DialogDescription>
                            Point your camera at the host&apos;s QR code
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col items-center py-4">
                          <div className="relative h-64 w-64 rounded-2xl border-2 border-dashed border-primary bg-muted flex items-center justify-center">
                            <div className="text-center">
                              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">Camera view</p>
                              <p className="text-xs text-muted-foreground mt-1">(Simulated scanner)</p>
                            </div>
                            {/* Scanner corners */}
                            <div className="absolute left-2 top-2 h-8 w-8 border-l-4 border-t-4 border-primary" />
                            <div className="absolute right-2 top-2 h-8 w-8 border-r-4 border-t-4 border-primary" />
                            <div className="absolute bottom-2 left-2 h-8 w-8 border-b-4 border-l-4 border-primary" />
                            <div className="absolute bottom-2 right-2 h-8 w-8 border-b-4 border-r-4 border-primary" />
                          </div>
                          <Button onClick={handleScanQR} className="mt-4 w-full">
                            Simulate Scan
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">
                          Or
                        </span>
                      </div>
                    </div>

                    {/* Manual Confirmation */}
                    <Button 
                      variant="outline" 
                      size="lg" 
                      className="w-full gap-2"
                      onClick={handleArrivalConfirm}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Manual Check-in
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Members */}
          <div className="space-y-6">
            {/* Host Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-accent" />
                  Host
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 border-2 border-accent">
                    <AvatarImage src={host.avatar || undefined} />
                    <AvatarFallback className="bg-accent text-accent-foreground">
                      {host.username?.charAt(0).toUpperCase() || host.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-semibold">{host.username || `${host.name} ${host.surname}`}</p>
                    <Badge variant="secondary" className="mt-1">
                      <Crown className="mr-1 h-3 w-3" />
                      Host
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Members Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Members ({members.length})
                </CardTitle>
                <CardDescription>
                  {arrivedMembers.length} arrived
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {members.map((member) => (
                  <div key={member.uid} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.avatar || undefined} />
                      <AvatarFallback>
                        {member.username?.charAt(0).toUpperCase() || member.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.username || `${member.name} ${member.surname}`}</p>
                      {member.arrivedAt ? (
                        <Badge variant="default" className="mt-1 bg-primary/20 text-primary">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Arrived
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="mt-1">
                          Not arrived
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Chat Button */}
            <Button variant="outline" className="w-full" size="lg">
              <MessageCircle className="mr-2 h-5 w-5" />
              Party Chat
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
