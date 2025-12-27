"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  Map,
  Plane,
  DollarSign,
  CheckSquare,
  MessageSquare,
  Settings,
} from "lucide-react"

interface TripNavProps {
  tripId: string
}

const navItems = [
  { name: "Overview", href: "", icon: LayoutDashboard },
  { name: "Itinerary", href: "itinerary", icon: Calendar },
  { name: "Map", href: "map", icon: Map },
  { name: "Reservations", href: "reservations", icon: Plane },
  { name: "Budget", href: "budget", icon: DollarSign },
  { name: "Checklist", href: "checklist", icon: CheckSquare },
  { name: "Assistant", href: "assistant", icon: MessageSquare },
  { name: "Settings", href: "settings", icon: Settings },
]

export function TripNav({ tripId }: TripNavProps) {
  const pathname = usePathname()

  return (
    <nav className="border-b border-gray-200 bg-white">
      <div className="flex overflow-x-auto px-4 lg:px-6">
        {navItems.map((item) => {
          const href = item.href ? `/trip/${tripId}/${item.href}` : `/trip/${tripId}`
          const isActive = pathname === href

          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
                isActive
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-600 hover:border-gray-300 hover:text-gray-900"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
