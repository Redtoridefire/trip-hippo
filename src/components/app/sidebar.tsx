"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Map,
  Calendar,
  BookOpen,
  Settings,
  Compass,
  PlaneTakeoff,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  user: {
    id: string
    email: string
    name: string
    avatar_url: string | null
  }
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Compass },
  { name: "My Trips", href: "/dashboard", icon: Map },
  { name: "Explore Guides", href: "/guides", icon: BookOpen },
]

export function AppSidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 px-6">
        <PlaneTakeoff className="h-6 w-6 text-blue-600" />
        <span className="text-xl font-bold text-gray-900">TripHippo</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
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
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
