"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MainNav } from '@/components/navigation/main-nav'
import { useAuth, type SubscriptionPlan } from '@/contexts/auth-context'
import { ThaiQRPayment } from '@/components/subscription/thai-qr-payment'
import { DiceIcon } from '@/components/icons/dice-icon'
import { 
  Crown, 
  Check, 
  Sparkles, 
  Zap, 
  Gamepad2,
  Gift,
  Star,
  Shield,
  QrCode,
  X,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const plans = [
  {
    id: 'basic' as SubscriptionPlan,
    name: 'Basic',
    price: 199,
    slots: 3,
    icon: Sparkles,
    color: 'text-chart-4',
    bgColor: 'bg-chart-4/10',
    features: [
      'Borrow up to 3 games per month',
      'Access to standard game library',
      'Basic member badge',
      'Priority party notifications',
    ],
  },
  {
    id: 'pro' as SubscriptionPlan,
    name: 'Pro',
    price: 349,
    slots: 5,
    icon: Zap,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    popular: true,
    features: [
      'Borrow up to 5 games per month',
      'Access to premium game library',
      'Pro member badge',
      'Priority party notifications',
      'Early access to new games',
    ],
  },
  {
    id: 'premium' as SubscriptionPlan,
    name: 'Premium',
    price: 499,
    slots: 7,
    icon: Crown,
    color: 'text-accent',
    bgColor: 'bg-accent/10',
    features: [
      'Borrow up to 7 games per month',
      'Access to entire game library',
      'Premium member badge',
      'Priority party notifications',
      'Early access to new games',
      'Exclusive member events',
      'Free delivery on all games',
    ],
  },
]

const memberBenefits = [
  {
    icon: Gamepad2,
    title: 'Borrow Board Games',
    description: 'Access our extensive library and borrow games to play at home or bring to parties',
  },
  {
    icon: Gift,
    title: 'Exclusive Discounts',
    description: 'Get special discounts on game purchases and event tickets',
  },
  {
    icon: Star,
    title: 'Member Badge',
    description: 'Show off your membership status with a special badge on your profile',
  },
  {
    icon: Shield,
    title: 'Priority Support',
    description: 'Get faster response times and dedicated member support',
  },
]

export default function MembershipPage() {
  const { user, subscribe } = useAuth()
  const router = useRouter()
  const [showBenefits, setShowBenefits] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/')
      return
    }
  }, [user, router])

  if (!user) return null

  const handleSelectPlan = (plan: typeof plans[0]) => {
    setSelectedPlan(plan)
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    if (selectedPlan) {
      subscribe(selectedPlan.id)
      toast.success(`Welcome to ${selectedPlan.name} membership!`)
      setShowPayment(false)
      setSelectedPlan(null)
      router.push('/game-slots')
    }
  }

  const handleClosePayment = (isOpen: boolean) => {
    if (!isOpen) {
      setShowPayment(false)
      setSelectedPlan(null)
    }
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
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
            <Crown className="h-10 w-10 text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Become a Member</h1>
          <p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">
            Unlock the ability to borrow board games from our library and enjoy exclusive member benefits
          </p>
          <Button
            variant="link"
            className="mt-2 text-primary"
            onClick={() => setShowBenefits(true)}
          >
            What do members get?
          </Button>
        </div>

        {/* Current Status */}
        {user.isMember && (
          <Card className="mb-8 border-2 border-primary bg-primary/5">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                  <Crown className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    You&apos;re a {user.subscriptionPlan.charAt(0).toUpperCase() + user.subscriptionPlan.slice(1)} Member
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {user.gameSlots - user.usedSlots} game slots available
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => router.push('/game-slots')}>
                <Gamepad2 className="mr-2 h-4 w-4" />
                Manage Slots
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            const isCurrentPlan = user.subscriptionPlan === plan.id
            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative border-2 transition-all",
                  plan.popular && "border-primary shadow-lg",
                  isCurrentPlan && "border-primary bg-primary/5"
                )}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                    Most Popular
                  </Badge>
                )}
                {isCurrentPlan && (
                  <Badge variant="secondary" className="absolute -top-3 right-4">
                    Current Plan
                  </Badge>
                )}
                <CardHeader className="text-center">
                  <div className={cn("mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl", plan.bgColor)}>
                    <Icon className={cn("h-7 w-7", plan.color)} />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">฿{plan.price}</span>
                    <span className="text-muted-foreground">/month</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-center gap-2 rounded-lg bg-muted p-3">
                    <Gamepad2 className="h-5 w-5 text-primary" />
                    <span className="font-semibold">{plan.slots} Game Slots</span>
                  </div>
                  
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-6 w-full"
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      <>
                        <QrCode className="mr-2 h-4 w-4" />
                        Subscribe with Thai QR
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Payment Info */}
        <div className="mt-8 flex items-center justify-center gap-2 rounded-lg bg-muted p-4">
          <QrCode className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Pay securely with <span className="font-medium text-foreground">Thai QR / PromptPay</span>
          </p>
        </div>
      </main>

      {/* Benefits Dialog */}
      <Dialog open={showBenefits} onOpenChange={setShowBenefits}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <Crown className="h-8 w-8 text-accent-foreground" />
            </div>
            <DialogTitle className="text-center text-2xl">Member Benefits</DialogTitle>
            <DialogDescription className="text-center">
              Unlock these exclusive perks when you become a member
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {memberBenefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.title} className="flex items-start gap-4 rounded-lg border p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{benefit.title}</p>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          <Button onClick={() => setShowBenefits(false)} className="w-full">
            Got it!
          </Button>
        </DialogContent>
      </Dialog>

      {/* Thai QR Payment Modal */}
      {selectedPlan && (
        <ThaiQRPayment
          open={showPayment}
          onOpenChange={handleClosePayment}
          plan={selectedPlan}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
