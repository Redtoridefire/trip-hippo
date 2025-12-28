"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  Settings,
  Compass,
  PlaneTakeoff,
  Luggage,
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
  { name: "My Trips", href: "/trips", icon: Luggage },
  { name: "Explore Guides", href: "/guides", icon: BookOpen },
]

export function AppSidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 lg:flex lg:flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-gray-200 dark:border-gray-700 px-6">
        <PlaneTakeoff className="h-6 w-6 text-blue-600" />
        <span className="text-xl font-bold text-gray-900 dark:text-white">TripHippo</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href ||
            (item.href === "/trips" && pathname.startsWith("/trip/"))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <Link
          href="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </aside>
  )
}
