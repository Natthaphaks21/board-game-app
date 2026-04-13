"use client"

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'
import { CheckCircle2, Clock, QrCode, Smartphone, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ThaiQRPaymentProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  plan: {
    id: string
    name: string
    price: number
  }
  onPaymentSuccess: () => void
}

type PaymentStatus = 'generating' | 'pending' | 'checking' | 'success' | 'expired' | 'error'

export function ThaiQRPayment({ open, onOpenChange, plan, onPaymentSuccess }: ThaiQRPaymentProps) {
  const [status, setStatus] = useState<PaymentStatus>('generating')
  const [qrData, setQrData] = useState<{
    qrCodeUrl: string
    orderId: string
    expiresAt: string
  } | null>(null)
  const [timeLeft, setTimeLeft] = useState(900) // 15 minutes in seconds
  const [error, setError] = useState<string | null>(null)

  const generateQR = useCallback(async () => {
    setStatus('generating')
    setError(null)
    
    try {
      const response = await fetch('/api/payment/thai-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: plan.id,
          amount: plan.price,
          orderId: `ORD-${Date.now()}`,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setQrData(data.data)
        setStatus('pending')
        setTimeLeft(900)
      } else {
        throw new Error(data.error || 'Failed to generate QR code')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate QR code')
      setStatus('error')
    }
  }, [plan])

  // Generate QR on mount
  useEffect(() => {
    if (open && !qrData) {
      generateQR()
    }
  }, [open, qrData, generateQR])

  // Countdown timer
  useEffect(() => {
    if (status !== 'pending' || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setStatus('expired')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [status, timeLeft])

  // Simulate payment check (in production, this would poll the server or use webhooks)
  const checkPayment = async () => {
    setStatus('checking')
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    
    // For demo: randomly succeed or stay pending
    const success = Math.random() > 0.3
    
    if (success) {
      setStatus('success')
      setTimeout(() => {
        onPaymentSuccess()
        onOpenChange(false)
      }, 2000)
    } else {
      setStatus('pending')
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleClose = () => {
    if (status !== 'success') {
      setQrData(null)
      setStatus('generating')
    }
    onOpenChange(false)
  }

  const handleGoBack = () => {
    setQrData(null)
    setStatus('generating')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleGoBack}
          className="absolute left-4 top-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <DialogHeader className="text-center pt-6">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl font-bold">
            <QrCode className="h-6 w-6 text-primary" />
            Thai QR Payment
          </DialogTitle>
          <DialogDescription>
            Pay with PromptPay - Scan with your mobile banking app
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col items-center">
          {/* Plan Summary */}
          <div className="mb-4 w-full rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">Subscribing to</p>
            <p className="text-lg font-bold">{plan.name} Plan</p>
            <p className="text-2xl font-bold text-primary">{'\u0E3F'}{plan.price}</p>
            <p className="text-xs text-muted-foreground">per month</p>
          </div>

          {/* QR Code Display */}
          <div className="relative flex h-72 w-72 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card">
            {status === 'generating' && (
              <div className="flex flex-col items-center gap-3">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-muted-foreground">Generating QR Code...</p>
              </div>
            )}

            {status === 'pending' && qrData && (
              <>
                <Image
                  src={qrData.qrCodeUrl}
                  alt="PromptPay QR Code"
                  width={250}
                  height={250}
                  className="rounded-lg"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background px-3 py-1 shadow-md">
                  <div className="flex items-center gap-1.5 text-sm">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className={cn(
                      "font-mono font-bold",
                      timeLeft < 60 ? "text-destructive" : "text-foreground"
                    )}>
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
              </>
            )}

            {status === 'checking' && (
              <div className="flex flex-col items-center gap-3">
                <Spinner className="h-8 w-8" />
                <p className="text-sm text-muted-foreground">Verifying payment...</p>
              </div>
            )}

            {status === 'success' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
                <p className="font-bold text-primary">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">Activating your subscription...</p>
              </div>
            )}

            {status === 'expired' && (
              <div className="flex flex-col items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <p className="font-bold text-destructive">QR Code Expired</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateQR}
                  className="mt-2"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate New QR
                </Button>
              </div>
            )}

            {status === 'error' && (
              <div className="flex flex-col items-center gap-3 p-4 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/20">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                </div>
                <p className="font-bold text-destructive">Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateQR}
                  className="mt-2"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            )}
          </div>

          {/* Instructions */}
          {(status === 'pending' || status === 'checking') && (
            <div className="mt-6 w-full space-y-3">
              <p className="text-center text-sm font-medium">How to pay:</p>
              <ol className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    1
                  </span>
                  Open your mobile banking app
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    2
                  </span>
                  Select &quot;Scan QR&quot; or &quot;PromptPay&quot;
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    3
                  </span>
                  Scan the QR code and confirm payment
                </li>
              </ol>

              {/* Supported Banks */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-lg bg-muted p-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Supports all Thai banks: SCB, KBank, BBL, Krungthai, and more
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex w-full gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleGoBack}
              disabled={status === 'checking' || status === 'success'}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            {status === 'pending' && (
              <Button
                className="flex-1"
                onClick={checkPayment}
              >
                I&apos;ve Made the Payment
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
