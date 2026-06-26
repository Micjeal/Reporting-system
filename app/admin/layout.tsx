'use client'

import { useState, useCallback } from 'react'
import { Sidebar } from '@/components/admin/sidebar'
import { Navbar } from '@/components/admin/navbar'
import { Toaster } from '@/components/ui/toaster'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleMenuClick = useCallback(() => {
    setSidebarOpen(prev => !prev)
  }, [])

  const handleCollapseClick = useCallback(() => {
    setSidebarCollapsed(prev => !prev)
  }, [])

  const handleCloseSidebar = useCallback(() => {
    setSidebarOpen(false)
  }, [])

  return (
    <div className="flex h-dvh min-h-0 gap-3 overflow-hidden bg-background p-3 md:gap-4 md:p-4">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        isCollapsed={sidebarCollapsed}
      />

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden md:gap-4">
        {/* Navbar */}
        <Navbar
          onMenuClick={handleMenuClick}
          onCollapseClick={handleCollapseClick}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Page content */}
        <main className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden rounded-xl">
          <div className="min-h-full min-w-0 rounded-xl bg-blue-50 px-4 py-5 dark:bg-blue-950 sm:px-5 md:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <Toaster />
    </div>
  )
}
