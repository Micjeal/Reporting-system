'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  Wallet, 
  Package, 
  ClipboardList, 
  CheckCircle2, 
  AlertCircle, 
  LogOut,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import * as authService from '@/services/auth.service'
import { toast } from 'sonner'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  isCollapsed?: boolean
}

const menuItems = [
  { href: '/admin/dashboard', icon: BarChart3, label: 'Dashboard' },
  { href: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/admin/users', icon: Users, label: 'User Management' },
  { href: '/admin/approvals', icon: CheckCircle2, label: 'Approvals' },
  { href: '/admin/sales', icon: ShoppingCart, label: 'Sales' },
  { href: '/admin/expenses', icon: Wallet, label: 'Expenses' },
  { href: '/admin/inventory', icon: Package, label: 'Inventory' },
  { href: '/admin/inventory-requests', icon: Package, label: 'Inventory Requests' },
  { href: '/admin/reports', icon: ClipboardList, label: 'Reports' },
  { href: '/admin/audit-logs', icon: AlertCircle, label: 'Audit Logs' },
]

export function Sidebar({ isOpen, onClose, isCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 flex h-dvh flex-col border-r border-border bg-blue-50 shadow-xl transition-all duration-300 dark:bg-blue-950 md:sticky md:top-4 md:z-0 md:h-[calc(100dvh-2rem)] md:translate-x-0 md:rounded-xl md:shadow-none',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          isCollapsed ? 'w-16 md:w-16' : 'w-64 md:w-64'
        )}
      >
        {/* Header */}
        <div className={cn(
          'flex h-16 flex-shrink-0 items-center justify-between gap-2 border-b border-border px-4 transition-all duration-300',
          isCollapsed && 'md:justify-center md:px-2'
        )}>
          <div className={cn(
            'flex min-w-0 items-center gap-2',
            isCollapsed && 'md:hidden'
          )}>
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart3 className="size-5 text-primary-foreground" />
            </div>
            <span className="truncate font-semibold text-foreground">Sales</span>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="md:hidden"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className={cn(
          'min-h-0 flex-1 space-y-1 overflow-y-auto p-3',
          !isCollapsed && 'md:p-4',
          isCollapsed && 'md:px-2'
        )}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                  isCollapsed && 'md:justify-center md:px-2'
                )}
                onClick={() => {
                  // Only close sidebar on mobile
                  if (window.innerWidth < 768) {
                    onClose()
                  }
                }}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="size-4 flex-shrink-0" />
                <span className={cn('min-w-0 truncate', isCollapsed && 'hidden md:hidden')}>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className={cn(
          'flex-shrink-0 border-t border-border p-3',
          !isCollapsed && 'md:p-4',
          isCollapsed && 'md:p-2'
        )}>
          <Button 
            variant="ghost" 
            className={cn(
              'w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10',
              isCollapsed && 'md:justify-center md:px-2'
            )}
            onClick={handleLogout}
            disabled={isLoggingOut}
            title={isCollapsed ? 'Logout' : undefined}
          >
            <LogOut className="size-4 flex-shrink-0 md:mr-0" />
            <span className={cn(isCollapsed && 'hidden md:hidden', 'md:ml-2')}>
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          </Button>
        </div>
      </aside>
    </>
  )
}
