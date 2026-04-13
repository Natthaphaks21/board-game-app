"use client"

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { DiceIcon } from '@/components/icons/dice-icon'
import { 
  Home, 
  Users, 
  Plus, 
  Search, 
  History, 
  LogOut, 
  Crown,
  Menu,
  X,
  Gamepad2,
  Gift,
  Star,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/parties/create', label: 'Create Party', icon: Plus },
  { href: '/parties/join', label: 'Join Party', icon: Search },
  { href: '/my-parties', label: 'My Parties', icon: Users },
  { href: '/history', label: 'History', icon: History },
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

export function MainNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showBenefitsPopup, setShowBenefitsPopup] = useState(false)

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const handleMembershipClick = () => {
    if (user?.isMember) {
      router.push('/game-slots')
    } else {
      setShowBenefitsPopup(true)
    }
  }

  const handleContinueToMembership = () => {
    setShowBenefitsPopup(false)
    router.push('/membership')
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/home" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <DiceIcon className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="hidden text-xl font-bold text-foreground sm:block">
                BoardBuddies
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-1 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Right Side */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Membership/Subscription Button */}
              <Button
                variant={user?.isMember ? 'outline' : 'default'}
                size="sm"
                onClick={handleMembershipClick}
                className="hidden gap-2 sm:flex"
              >
                {user?.isMember ? (
                  <>
                    <Gamepad2 className="h-4 w-4" />
                    Game Slots ({user?.usedSlots}/{user?.gameSlots})
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4" />
                    Become Member
                  </>
                )}
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10 border-2 border-primary">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {user?.username?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <div className="flex items-center gap-2 p-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user?.avatar} alt={user?.name} />
                      <AvatarFallback>{user?.username?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <p className="text-sm font-medium">{user?.username || `${user?.name} ${user?.surname}`}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleMembershipClick} className="sm:hidden">
                    <Crown className="mr-2 h-4 w-4" />
                    {user?.isMember ? 'Game Slots' : 'Become Member'}
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/membership">
                      <Crown className="mr-2 h-4 w-4" />
                      Membership
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/profile">Profile Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="border-t border-border py-4 md:hidden">
              <div className="flex flex-col gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Member Benefits Popup */}
      <Dialog open={showBenefitsPopup} onOpenChange={setShowBenefitsPopup}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <Crown className="h-8 w-8 text-accent-foreground" />
            </div>
            <DialogTitle className="text-center text-2xl">Become a Member</DialogTitle>
            <DialogDescription className="text-center">
              Unlock the ability to borrow board games and enjoy exclusive perks!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            {memberBenefits.map((benefit) => {
              const Icon = benefit.icon
              return (
                <div key={benefit.title} className="flex items-start gap-4 rounded-lg border p-3">
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

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowBenefitsPopup(false)} className="flex-1">
              Maybe Later
            </Button>
            <Button onClick={handleContinueToMembership} className="flex-1">
              View Plans
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
