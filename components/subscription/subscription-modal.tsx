"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth, type SubscriptionPlan } from '@/contexts/auth-context'
import { Check, Sparkles, Zap, Crown, QrCode } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { ThaiQRPayment } from './thai-qr-payment'

const plans = [
  {
    id: 'basic' as SubscriptionPlan,
    name: 'Basic',
    price: 99,
    slots: 3,
    icon: Sparkles,
    color: 'bg-chart-2',
    features: [
      'Borrow 3 games per month',
      'Join unlimited parties',
      'Basic game recommendations',
    ],
  },
  {
    id: 'pro' as SubscriptionPlan,
    name: 'Pro',
    price: 199,
    slots: 5,
    icon: Zap,
    color: 'bg-primary',
    popular: true,
    features: [
      'Borrow 5 games per month',
      'Join unlimited parties',
      'Priority game recommendations',
      'Early access to new games',
    ],
  },
  {
    id: 'premium' as SubscriptionPlan,
    name: 'Premium',
    price: 299,
    slots: 7,
    icon: Crown,
    color: 'bg-accent',
    features: [
      'Borrow 7 games per month',
      'Join unlimited parties',
      'Exclusive game access',
      'Free party hosting perks',
      'VIP support',
    ],
  },
]

interface SubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SubscriptionModal({ open, onOpenChange }: SubscriptionModalProps) {
  const { subscribe } = useAuth()
  const router = useRouter()
  const [selectedPlan, setSelectedPlan] = useState<typeof plans[0] | null>(null)
  const [showPayment, setShowPayment] = useState(false)

  const handleSelectPlan = (plan: typeof plans[0]) => {
    setSelectedPlan(plan)
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    if (selectedPlan) {
      subscribe(selectedPlan.id)
      toast.success(`Successfully subscribed to ${selectedPlan.name} plan!`)
      setShowPayment(false)
      setSelectedPlan(null)
      onOpenChange(false)
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-2xl font-bold">
            Choose Your Adventure
          </DialogTitle>
          <DialogDescription>
            Subscribe to unlock game borrowing and premium features
          </DialogDescription>
        </DialogHeader>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-2xl border-2 p-6 transition-all hover:scale-105",
                  plan.popular
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                    Most Popular
                  </div>
                )}

                <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl", plan.color)}>
                  <Icon className="h-6 w-6 text-white" />
                </div>

                <h3 className="text-xl font-bold">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>

                <p className="mt-2 text-sm font-medium text-primary">
                  {plan.slots} game slots
                </p>

                <ul className="mt-4 flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button
                  className="mt-6 w-full"
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan)}
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Pay with Thai QR
                </Button>
              </div>
            )
          })}
        </div>

        {/* Thai QR Payment Section Info */}
        <div className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-muted p-3">
          <QrCode className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Pay securely with <span className="font-medium text-foreground">Thai QR / PromptPay</span>
          </p>
        </div>
      </DialogContent>

      {/* Thai QR Payment Modal */}
      {selectedPlan && (
        <ThaiQRPayment
          open={showPayment}
          onOpenChange={handleClosePayment}
          plan={selectedPlan}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </Dialog>
  )
}
