"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { DiceIcon, MeepleIcon, CardStackIcon, BoardIcon } from '@/components/icons/dice-icon'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { toast } from 'sonner'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const { loginWithEmail, signInWithGoogle } = useAuth()
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithGoogle()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Google login failed. Please try again.')
      setIsGoogleLoading(false)
    }
  }

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.email || !formData.password) {
      toast.error('Please enter email and password')
      return
    }
    
    setIsLoading(true)
    try {
      await loginWithEmail(formData.email, formData.password)
      router.push('/home')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed. Please check your credentials.')
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute left-1/4 top-1/3 h-48 w-48 rounded-full bg-secondary/30 blur-3xl" />
        
        {/* Floating game elements */}
        <div className="absolute left-[10%] top-[20%] hidden animate-bounce opacity-20 md:block">
          <DiceIcon className="h-16 w-16 text-primary" />
        </div>
        <div className="absolute right-[15%] top-[15%] hidden animate-bounce opacity-20 md:block" style={{ animationDelay: '0.5s' }}>
          <MeepleIcon className="h-12 w-12 text-accent" />
        </div>
        <div className="absolute bottom-[20%] left-[15%] hidden animate-bounce opacity-20 md:block" style={{ animationDelay: '1s' }}>
          <CardStackIcon className="h-14 w-14 text-chart-3" />
        </div>
        <div className="absolute bottom-[25%] right-[10%] hidden animate-bounce opacity-20 md:block" style={{ animationDelay: '1.5s' }}>
          <BoardIcon className="h-16 w-16 text-secondary" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
        {/* Logo and Title */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/30">
            <DiceIcon className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            BoardBuddies
          </h1>
          <p className="mt-2 text-base text-muted-foreground sm:text-lg">
            Find your game night crew
          </p>
        </div>

        {/* Login Card */}
        <Card className="w-full max-w-md border-2 sm:max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome, Player!</CardTitle>
            <CardDescription>
              New user: sign up with Google first. Returning user: login with email + password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Email/Password Login Form */}
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="h-12"
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="h-12 pr-10"
                    disabled={isLoading || isGoogleLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="h-12 w-full text-base"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            {/* Google Login */}
            <Button
              className="relative h-12 w-full gap-3 text-base"
              variant="outline"
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Sign Up with Google (First Login)
                </>
              )}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our{' '}
              <a href="#" className="underline hover:text-foreground">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="underline hover:text-foreground">
                Privacy Policy
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="mt-12 grid max-w-2xl grid-cols-1 gap-6 text-center sm:grid-cols-3">
          {[
            { icon: DiceIcon, title: 'Create Parties', desc: 'Host game nights' },
            { icon: MeepleIcon, title: 'Find Players', desc: 'Match with buddies' },
            { icon: CardStackIcon, title: 'Borrow Games', desc: 'Access 1000+ titles' },
          ].map((feature) => (
            <div key={feature.title} className="space-y-2">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
