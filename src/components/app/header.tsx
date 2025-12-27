"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
  LogOut,
  Menu,
  User,
  PlaneTakeoff,
  X,
  Compass,
  Map,
  BookOpen,
  Settings,
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

interface HeaderProps {
  user: {
    id: string
    email: string
    name: string
    avatar_url: string | null
  }
}

const mobileNavItems = [
  { name: "Dashboard", href: "/dashboard", icon: Compass },
  { name: "My Trips", href: "/dashboard", icon: Map },
  { name: "Explore Guides", href: "/guides", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function AppHeader({ user }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 lg:px-6">
        {/* Mobile menu button + logo */}
        <div className="flex items-center gap-4 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link href="/dashboard" className="flex items-center gap-2">
            <PlaneTakeoff className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-gray-900">TripHippo</span>
          </Link>
        </div>

      {/* Spacer for desktop */}
      <div className="hidden lg:block" />

      {/* User dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="gap-2">
            <Avatar
              src={user.avatar_url}
              alt={user.name}
              size="sm"
            />
            <span className="hidden sm:inline-block">{user.name}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <User className="mr-2 h-4 w-4" />
            Profile
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut} destructive>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
              <div className="flex items-center gap-2">
                <PlaneTakeoff className="h-6 w-6 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">TripHippo</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 p-3">
              {mobileNavItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>

            {/* User section */}
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <Avatar src={user.avatar_url} alt={user.name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false)
                  handleSignOut()
                }}
                className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
