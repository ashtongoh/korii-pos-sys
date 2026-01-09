'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AdminUser } from '@/lib/types'
import { AdminSidebar } from './sidebar'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminLayoutWrapperProps {
  user: AdminUser
  children: React.ReactNode
}

export function AdminLayoutWrapper({ user, children }: AdminLayoutWrapperProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header - only visible below lg */}
      <header className="lg:hidden sticky top-0 z-40 bg-card border-b shadow-zen">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-base text-primary-foreground font-display">氷</span>
            </div>
            <div>
              <h1 className="text-base font-display text-foreground">Kōri Matcha</h1>
              <p className="text-xs text-muted-foreground">Admin Portal</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Backdrop overlay - mobile only */}
        <div
          className={cn(
            'fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden',
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          )}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />

        {/* Sidebar - Mobile: fixed overlay, Desktop: static in flex */}
        <aside
          className={cn(
            // Mobile styles - fixed overlay
            'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r',
            'transform transition-transform duration-300 ease-out',
            'lg:relative lg:transform-none lg:transition-none',
            // Mobile: slide in/out
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
            // Desktop: shrink-0 to prevent flex shrinking, sticky for full height
            'lg:shrink-0 lg:sticky lg:top-0 lg:h-screen'
          )}
        >
          {/* Mobile close button */}
          <div className="lg:hidden absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <AdminSidebar user={user} />
        </aside>

        {/* Main content - takes remaining width */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}
