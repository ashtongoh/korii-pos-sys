'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/actions/auth'
import { AdminUser } from '@/lib/types'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ClipboardList,
  LogOut,
  User,
} from 'lucide-react'

interface AdminSidebarProps {
  user: AdminUser
}

const navItems = [
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Menu',
    href: '/admin/menu',
    icon: UtensilsCrossed,
  },
  {
    title: 'Orders',
    href: '/admin/orders',
    icon: ClipboardList,
  },
]

export function AdminSidebar({ user }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="text-lg text-primary-foreground font-display">氷</span>
          </div>
          <div>
            <h1 className="text-lg font-display text-foreground">
              Kōri Matcha
            </h1>
            <p className="text-xs text-muted-foreground">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-zen'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      {/* Barista Link */}
      <div className="px-4 pb-4">
        <Link
          href="/merchant"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200"
        >
          <ClipboardList className="h-5 w-5" />
          Order Queue
        </Link>
      </div>

      {/* User Info & Logout */}
      <div className="p-4 border-t bg-muted/30">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {user.email}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {user.role}
            </p>
          </div>
        </div>
        <form action={signOut}>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            type="submit"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </form>
      </div>
    </aside>
  )
}
