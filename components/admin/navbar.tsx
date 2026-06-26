'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, User, ChevronLeft, ChevronRight, Settings, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { NotificationButton } from '@/components/admin/notification-button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import * as authService from '@/services/auth.service'
import { toast } from 'sonner'
import { useTheme } from 'next-themes'

interface NavbarProps {
  onMenuClick: () => void
  onCollapseClick?: () => void
  sidebarCollapsed?: boolean
}

interface CurrentUser {
  id: string
  email: string
  role: string
  name?: string
}

export function Navbar({ onMenuClick, onCollapseClick, sidebarCollapsed }: NavbarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const fetchingRef = useRef(false)

  useEffect(() => {
    setMounted(true)
    if (!fetchingRef.current) {
      fetchingRef.current = true
      fetchCurrentUser()
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      const user = await authService.getCurrentUser()
      setCurrentUser(user)
    } catch (error) {
      // Silently fail - user will see default values
      console.error('Failed to fetch current user:', error)
    }
  }

  const handleLogout = async () => {
    if (isLoggingOut || !mounted) return
    
    setIsLoggingOut(true)
    try {
      await authService.logout()
      toast.success('Logged out successfully')
      router.push('/login')
      router.refresh()
    } catch (error) {
      toast.error('Failed to logout')
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const avatarSeed = currentUser?.id || 'Admin'
  const displayName = currentUser?.name || 'Admin User'
  const displayEmail = currentUser?.email || 'admin@company.com'
  const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  return (
    <header className="sticky top-0 z-40 flex-shrink-0 rounded-xl border-b border-border bg-blue-50 backdrop-blur dark:bg-blue-950">
      <div className="flex h-16 min-w-0 items-center justify-between gap-3 px-4 md:px-6">
        {/* Left */}
        <div className="flex min-w-0 items-center gap-3 md:gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden"
          >
            <Menu className="size-5" />
          </Button>
          
          {/* Desktop collapse toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapseClick}
            className="hidden flex-shrink-0 border bg-background shadow-xs md:inline-flex"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-5" />
            ) : (
              <ChevronLeft className="size-5" />
            )}
          </Button>
          
          <h1 className="hidden truncate text-lg font-semibold md:block">Admin Dashboard</h1>
        </div>

        {/* Right */}
        <div className="flex flex-shrink-0 items-center gap-2 md:gap-4">
          {/* Theme Toggle */}
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}

          <NotificationButton />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Avatar className="size-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="flex items-center gap-3 p-3">
                <Avatar className="size-10">
                  <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{displayEmail}</p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
                <User className="size-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                <Settings className="size-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
