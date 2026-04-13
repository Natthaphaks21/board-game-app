"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { DiceIcon } from '@/components/icons/dice-icon'
import { useAuth } from '@/contexts/auth-context'
import { User, ChevronRight, Shield, IdCard, ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function OnboardingPage() {
  const { user, isLoading, refreshUser, logout } = useAuth()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    username: user?.username || '',
    password: '',
    confirmPassword: '',
    thaiCitizenId: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/')
      return
    }

    if (!isLoading && user?.isProfileComplete) {
      router.push('/home')
    }
  }, [isLoading, router, user])

  useEffect(() => {
    if (user?.username && !formData.username) {
      setFormData(prev => ({ ...prev, username: user.username || '' }))
    }
  }, [formData.username, user?.username])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateThaiCitizenId = (id: string): boolean => {
    // Thai citizen ID is 13 digits
    if (!/^\d{13}$/.test(id)) return false
    
    // Checksum validation
    let sum = 0
    for (let i = 0; i < 12; i++) {
      sum += parseInt(id[i]) * (13 - i)
    }
    const checkDigit = (11 - (sum % 11)) % 10
    return checkDigit === parseInt(id[12])
  }

  const handleSubmit = async () => {
    if (!validateThaiCitizenId(formData.thaiCitizenId)) {
      setErrors(prev => ({ ...prev, thaiCitizenId: 'Invalid Thai citizen ID' }))
      return
    }

    if (formData.password.length < 8) {
      setErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters' }))
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/auth/complete-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          surname: formData.surname.trim(),
          username: formData.username.trim(),
          password: formData.password,
          thaiCitizenId: formData.thaiCitizenId,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(payload?.error || 'Failed to complete signup')
      }

      await refreshUser()
      toast.success('Signup complete. You can now login with email and password.')
      router.push('/home')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to complete signup')
      setIsSubmitting(false)
    }
  }

  const isStepValid = () => {
    if (step === 1) {
      return (
        formData.name.length >= 2 &&
        formData.surname.length >= 2 &&
        formData.username.length >= 3 &&
        formData.password.length >= 8 &&
        formData.confirmPassword.length >= 8
      )
    }

    if (step === 2) return formData.thaiCitizenId.length === 13
    return false
  }

  if (isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        {/* Back Button */}
        <div className="absolute left-4 top-4">
          <Button variant="ghost" asChild>
            <Link href="/" onClick={() => { void logout() }}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Sign Out
            </Link>
          </Button>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary">
            <DiceIcon className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Complete Your Profile</h1>
          <p className="mt-2 text-muted-foreground">
            First login requires Google OAuth, then complete signup to enable email/password login.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 flex items-center gap-2">
          {[1, 2].map((s) => (
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
              {s < 2 && (
                <div
                  className={`h-1 w-16 transition-colors ${
                    s < step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <Card className="w-full max-w-md border-2">
          {step === 1 && (
            <>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Fill in your account profile and set your login password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">First Name (ชื่อ)</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter your first name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="h-12"
                    maxLength={30}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="surname">Last Name (นามสกุล)</Label>
                  <Input
                    id="surname"
                    name="surname"
                    placeholder="Enter your last name"
                    value={formData.surname}
                    onChange={handleInputChange}
                    className="h-12"
                    maxLength={30}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    placeholder="Choose a display name"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="h-12"
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground">
                    This will be shown to other players
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`h-12 ${errors.password ? 'border-destructive' : ''}`}
                    maxLength={72}
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={`h-12 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                    maxLength={72}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              </CardContent>
            </>
          )}

          {step === 2 && (
            <>
              <CardHeader>
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
                  <IdCard className="h-6 w-6 text-accent" />
                </div>
                <CardTitle>Identity Verification</CardTitle>
                <CardDescription>
                  Verify Thai ID for identity check without storing raw ID number
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="thaiCitizenId" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Thai Citizen ID (เลขบัตรประชาชน)
                  </Label>
                  <Input
                    id="thaiCitizenId"
                    name="thaiCitizenId"
                    type="text"
                    inputMode="numeric"
                    placeholder="X-XXXX-XXXXX-XX-X"
                    value={formData.thaiCitizenId}
                    onChange={(e) => {
                      // Only allow digits
                      const value = e.target.value.replace(/\D/g, '').slice(0, 13)
                      setFormData(prev => ({ ...prev, thaiCitizenId: value }))
                      if (errors.thaiCitizenId) {
                        setErrors(prev => ({ ...prev, thaiCitizenId: '' }))
                      }
                    }}
                    className={`h-12 font-mono text-lg tracking-wider ${errors.thaiCitizenId ? 'border-destructive' : ''}`}
                    maxLength={13}
                  />
                  {errors.thaiCitizenId && (
                    <p className="text-sm text-destructive">{errors.thaiCitizenId}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {formData.thaiCitizenId.length}/13 digits
                  </p>
                </div>

                <div className="rounded-lg bg-muted p-4">
                  <div className="flex items-start gap-3">
                    <Shield className="mt-0.5 h-5 w-5 text-primary" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Why do we need this?</p>
                      <p className="text-xs text-muted-foreground">
                        We validate your Thai ID checksum and store only a salted hash plus the last 4 digits.
                        The full ID number is never stored in the database.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}

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
                className="flex-1 gap-2"
                onClick={() => (step < 2 ? setStep(step + 1) : handleSubmit())}
                disabled={!isStepValid() || isSubmitting}
              >
                {step < 2 ? (
                  <>
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Complete Setup
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <p className="mt-6 max-w-md text-center text-xs text-muted-foreground">
          Your information is securely handled under Thailand&apos;s PDPA. BoardBuddies does not persist
          full Thai ID card numbers.
        </p>
      </div>
    </div>
  )
}
