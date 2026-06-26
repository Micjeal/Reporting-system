'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, X, LayoutDashboard, ShoppingCart, Receipt, LogOut, ChevronLeft, ChevronRight, User, UserCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import * as authService from '@/services/auth.service'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { MobileBottomNav } from '@/components/agent/mobile-bottom-nav'

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false) // Mobile sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Desktop/tablet collapse
  const router = useRouter()
  const pathname = usePathname()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Load collapse state from localStorage
  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('agent-sidebar-collapsed')
    if (saved !== null) {
      setSidebarCollapsed(saved === 'true')
    }
  }, [])

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('agent-sidebar-collapsed', String(newState))
  }

  const handleLogout = async () => {
    if (isLoggingOut) return
    
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

  const navItems = [
    { href: '/agent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/agent/sales', label: 'My Sales', icon: ShoppingCart },
    { href: '/agent/expenses', label: 'My Expenses', icon: Receipt },
    { href: '/agent/profile', label: 'Profile', icon: UserCircle },
  ]

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-40 bg-gradient-to-b from-white via-white to-gray-50/50 backdrop-blur-xl border-r border-gray-200/50 shadow-2xl transition-all duration-300 ease-in-out rounded-r-3xl',
            // Mobile: slide in/out
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            // Desktop/Tablet: always visible, width changes
            'lg:relative lg:translate-x-0',
            sidebarCollapsed ? 'lg:w-14' : 'lg:w-48',
            // Always full width on mobile
            'w-48'
          )}
        >
          <div className="flex flex-col h-full">
            {/* Logo/Brand */}
            <div className={cn(
              "border-b border-gray-200/50 flex items-center transition-all duration-300",
              sidebarCollapsed ? 'lg:p-5 lg:justify-center' : 'p-6'
            )}>
              <div className={cn(
                "flex items-center gap-3 transition-all duration-300",
                sidebarCollapsed && 'lg:opacity-0 lg:w-0 lg:overflow-hidden'
              )}>
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-200/50">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 leading-none tracking-tight">Sales Agent</h1>
                  <p className="text-xs text-gray-500 mt-1 font-medium">Field Portal</p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className={cn(
              "flex-1 space-y-2 transition-all duration-300 py-6",
              sidebarCollapsed ? 'px-3' : 'px-4'
            )}>
              {navItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.href)
                
                const navButton = (
                  <a
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-2xl text-sm font-medium transition-all duration-300 group relative",
                      "hover:scale-[1.02] active:scale-[0.98]",
                      sidebarCollapsed ? 'lg:justify-center lg:p-3' : 'gap-3 px-4 py-3.5',
                      active 
                        ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-200/50" 
                        : "text-gray-600 hover:bg-gray-100/80 hover:text-gray-900"
                    )}
                  >
                    <Icon 
                      size={20} 
                      className={cn(
                        "shrink-0 transition-transform duration-300",
                        active && "drop-shadow-sm",
                        !active && "group-hover:scale-110"
                      )} 
                    />
                    <span className={cn(
                      "transition-all duration-300 whitespace-nowrap font-medium",
                      sidebarCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'
                    )}>
                      {item.label}
                    </span>
                    
                    {/* Active indicator */}
                    {active && !sidebarCollapsed && (
                      <div className="ml-auto h-2 w-2 rounded-full bg-white/90 animate-pulse shadow-sm" />
                    )}
                  </a>
                )

                return sidebarCollapsed ? (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      {navButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="lg:block hidden">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                ) : navButton
              })}
            </nav>

            {/* Logout */}
            <div className={cn(
              "border-t border-gray-200/50 transition-all duration-300",
              sidebarCollapsed ? 'p-3' : 'p-4'
            )}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    className={cn(
                      "transition-all duration-300 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 group rounded-2xl",
                      sidebarCollapsed ? 'lg:w-full lg:px-0' : 'w-full gap-2'
                    )}
                    size="sm"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOut size={16} className={cn(
                      "shrink-0 transition-transform duration-300 group-hover:scale-110",
                      isLoggingOut && "animate-pulse"
                    )} />
                    <span className={cn(
                      "transition-all duration-300 font-medium",
                      sidebarCollapsed ? 'lg:opacity-0 lg:w-0 lg:overflow-hidden' : 'opacity-100'
                    )}>
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </span>
                  </Button>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="lg:block hidden">
                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full">
          {/* Navbar */}
          <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-4 py-3 flex items-center justify-between lg:px-6 shadow-sm shrink-0">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden hover:bg-gray-100 rounded-xl transition-all duration-300"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
              {/* Desktop/Tablet collapse toggle */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleCollapse}
                    className="hidden lg:flex hover:bg-gray-100 rounded-xl transition-all duration-300"
                  >
                    {sidebarCollapsed ? (
                      <ChevronRight className="h-5 w-5" />
                    ) : (
                      <ChevronLeft className="h-5 w-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                </TooltipContent>
              </Tooltip>
              <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Sales Agent Dashboard</h2>
            </div>

            <ThemeToggle />
          </header>

          {/* Page Content */}
          <main className="flex-1 pb-20 lg:pb-0 bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 p-4 lg:p-6 overflow-hidden">
            <div className="h-full overflow-y-auto">
              {children}
            </div>
          </main>

          {/* Mobile Bottom Navigation */}
          <MobileBottomNav />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
